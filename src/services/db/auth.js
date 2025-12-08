/**
 * Auth Database Methods
 * Handles users, magic link tokens, and sessions
 */

const fs = require('fs').promises
const crypto = require('crypto')
const path = require('path')

// Constants
const MAGIC_LINK_EXPIRY_MINUTES = 15
const SESSION_EXPIRY_DAYS = 7

function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex')
}

function toIso(value) {
  if (!value) return null
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString()
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function normalizeUser(row) {
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    createdAt: toIso(row.created_at),
    lastLoginAt: toIso(row.last_login_at)
  }
}

function normalizeSession(row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    sessionToken: row.session_token,
    expiresAt: toIso(row.expires_at),
    createdAt: toIso(row.created_at)
  }
}

module.exports = function applyAuthMethods(EnhancedDBService) {
  Object.assign(EnhancedDBService.prototype, {

    // =========================================================================
    // Table Creation
    // =========================================================================

    async ensureAuthTables() {
      if (!this.usePostgres) return

      const client = await this.pool.connect()
      try {
        // Users table
        await client.query(`
          CREATE TABLE IF NOT EXISTS auth_users (
            id BIGSERIAL PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            last_login_at TIMESTAMP WITHOUT TIME ZONE
          )
        `)
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users (email)
        `)

        // Magic link tokens
        await client.query(`
          CREATE TABLE IF NOT EXISTS magic_link_tokens (
            id BIGSERIAL PRIMARY KEY,
            email TEXT NOT NULL,
            token TEXT UNIQUE NOT NULL,
            expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
            used_at TIMESTAMP WITHOUT TIME ZONE,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
          )
        `)
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_token ON magic_link_tokens (token)
        `)
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_email ON magic_link_tokens (email)
        `)

        // Sessions table
        await client.query(`
          CREATE TABLE IF NOT EXISTS auth_sessions (
            id BIGSERIAL PRIMARY KEY,
            user_id BIGINT REFERENCES auth_users(id) ON DELETE CASCADE,
            session_token TEXT UNIQUE NOT NULL,
            expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
          )
        `)
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions (session_token)
        `)
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions (user_id)
        `)

        console.log('✅ Auth tables ensured')
      } catch (error) {
        console.error('Error ensuring auth tables:', error.message)
      } finally {
        client.release()
      }
    },

    // =========================================================================
    // User Methods
    // =========================================================================

    async getOrCreateUser(email) {
      await this.waitForInitialization()
      const normalizedEmail = email.toLowerCase().trim()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          // Try to find existing user
          let result = await client.query(
            'SELECT * FROM auth_users WHERE email = $1',
            [normalizedEmail]
          )

          if (result.rows.length > 0) {
            return normalizeUser(result.rows[0])
          }

          // Create new user
          result = await client.query(
            `INSERT INTO auth_users (email, created_at)
             VALUES ($1, NOW())
             RETURNING *`,
            [normalizedEmail]
          )

          return normalizeUser(result.rows[0])
        } finally {
          client.release()
        }
      }

      // JSON fallback
      return this.getOrCreateUserJSON(normalizedEmail)
    },

    async getUserById(userId) {
      await this.waitForInitialization()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(
            'SELECT * FROM auth_users WHERE id = $1',
            [userId]
          )
          return result.rows.length > 0 ? normalizeUser(result.rows[0]) : null
        } finally {
          client.release()
        }
      }

      return this.getUserByIdJSON(userId)
    },

    async updateLastLogin(userId) {
      await this.waitForInitialization()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          await client.query(
            'UPDATE auth_users SET last_login_at = NOW() WHERE id = $1',
            [userId]
          )
        } finally {
          client.release()
        }
      }
    },

    // =========================================================================
    // Magic Link Token Methods
    // =========================================================================

    async createMagicLinkToken(email) {
      await this.waitForInitialization()
      const normalizedEmail = email.toLowerCase().trim()
      const token = generateToken(32)
      const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000)

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          // Invalidate any existing tokens for this email
          await client.query(
            `UPDATE magic_link_tokens
             SET used_at = NOW()
             WHERE email = $1 AND used_at IS NULL`,
            [normalizedEmail]
          )

          // Create new token
          await client.query(
            `INSERT INTO magic_link_tokens (email, token, expires_at, created_at)
             VALUES ($1, $2, $3, NOW())`,
            [normalizedEmail, token, expiresAt]
          )

          return { token, expiresAt: expiresAt.toISOString() }
        } finally {
          client.release()
        }
      }

      return this.createMagicLinkTokenJSON(normalizedEmail, token, expiresAt)
    },

    async verifyMagicLinkToken(token) {
      await this.waitForInitialization()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          // Find valid token
          const result = await client.query(
            `SELECT * FROM magic_link_tokens
             WHERE token = $1
             AND used_at IS NULL
             AND expires_at > NOW()`,
            [token]
          )

          if (result.rows.length === 0) {
            return null
          }

          const tokenRecord = result.rows[0]

          // Mark token as used
          await client.query(
            'UPDATE magic_link_tokens SET used_at = NOW() WHERE id = $1',
            [tokenRecord.id]
          )

          return {
            email: tokenRecord.email,
            valid: true
          }
        } finally {
          client.release()
        }
      }

      return this.verifyMagicLinkTokenJSON(token)
    },

    async cleanExpiredTokens() {
      await this.waitForInitialization()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          await client.query(
            'DELETE FROM magic_link_tokens WHERE expires_at < NOW() OR used_at IS NOT NULL'
          )
        } finally {
          client.release()
        }
      }
    },

    // =========================================================================
    // Session Methods
    // =========================================================================

    async createSession(userId) {
      await this.waitForInitialization()
      const sessionToken = generateToken(32)
      const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000)

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          await client.query(
            `INSERT INTO auth_sessions (user_id, session_token, expires_at, created_at)
             VALUES ($1, $2, $3, NOW())`,
            [userId, sessionToken, expiresAt]
          )

          return {
            sessionToken,
            expiresAt: expiresAt.toISOString()
          }
        } finally {
          client.release()
        }
      }

      return this.createSessionJSON(userId, sessionToken, expiresAt)
    },

    async getSessionByToken(sessionToken) {
      await this.waitForInitialization()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(
            `SELECT s.*, u.email
             FROM auth_sessions s
             JOIN auth_users u ON s.user_id = u.id
             WHERE s.session_token = $1
             AND s.expires_at > NOW()`,
            [sessionToken]
          )

          if (result.rows.length === 0) {
            return null
          }

          const row = result.rows[0]
          return {
            id: row.id,
            userId: row.user_id,
            email: row.email,
            sessionToken: row.session_token,
            expiresAt: toIso(row.expires_at)
          }
        } finally {
          client.release()
        }
      }

      return this.getSessionByTokenJSON(sessionToken)
    },

    async destroySession(sessionToken) {
      await this.waitForInitialization()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          await client.query(
            'DELETE FROM auth_sessions WHERE session_token = $1',
            [sessionToken]
          )
          return true
        } finally {
          client.release()
        }
      }

      return this.destroySessionJSON(sessionToken)
    },

    async destroyUserSessions(userId) {
      await this.waitForInitialization()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          await client.query(
            'DELETE FROM auth_sessions WHERE user_id = $1',
            [userId]
          )
          return true
        } finally {
          client.release()
        }
      }

      return this.destroyUserSessionsJSON(userId)
    },

    async cleanExpiredSessions() {
      await this.waitForInitialization()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          await client.query('DELETE FROM auth_sessions WHERE expires_at < NOW()')
        } finally {
          client.release()
        }
      }
    },

    // =========================================================================
    // JSON Fallback Methods
    // =========================================================================

    getAuthDataPath() {
      return path.join(this.jsonDataPath, 'auth')
    },

    getUsersFile() {
      return path.join(this.getAuthDataPath(), 'users.json')
    },

    getTokensFile() {
      return path.join(this.getAuthDataPath(), 'tokens.json')
    },

    getSessionsFile() {
      return path.join(this.getAuthDataPath(), 'sessions.json')
    },

    async ensureAuthDataDir() {
      try {
        await fs.mkdir(this.getAuthDataPath(), { recursive: true })
      } catch (error) {
        // Ignore if exists
      }
    },

    async loadJSONFile(filePath) {
      try {
        const data = await fs.readFile(filePath, 'utf8')
        return JSON.parse(data)
      } catch (error) {
        if (error.code === 'ENOENT') return []
        throw error
      }
    },

    async saveJSONFile(filePath, data) {
      await this.ensureAuthDataDir()
      await fs.writeFile(filePath, JSON.stringify(data, null, 2))
    },

    async getOrCreateUserJSON(email) {
      const users = await this.loadJSONFile(this.getUsersFile())
      let user = users.find(u => u.email === email)

      if (!user) {
        user = {
          id: Date.now(),
          email,
          created_at: new Date().toISOString(),
          last_login_at: null
        }
        users.push(user)
        await this.saveJSONFile(this.getUsersFile(), users)
      }

      return normalizeUser(user)
    },

    async getUserByIdJSON(userId) {
      const users = await this.loadJSONFile(this.getUsersFile())
      const user = users.find(u => u.id === userId)
      return user ? normalizeUser(user) : null
    },

    async createMagicLinkTokenJSON(email, token, expiresAt) {
      const tokens = await this.loadJSONFile(this.getTokensFile())

      // Invalidate existing tokens for email
      tokens.forEach(t => {
        if (t.email === email && !t.used_at) {
          t.used_at = new Date().toISOString()
        }
      })

      tokens.push({
        id: Date.now(),
        email,
        token,
        expires_at: expiresAt.toISOString(),
        used_at: null,
        created_at: new Date().toISOString()
      })

      await this.saveJSONFile(this.getTokensFile(), tokens)
      return { token, expiresAt: expiresAt.toISOString() }
    },

    async verifyMagicLinkTokenJSON(token) {
      const tokens = await this.loadJSONFile(this.getTokensFile())
      const now = new Date()

      const tokenRecord = tokens.find(t =>
        t.token === token &&
        !t.used_at &&
        new Date(t.expires_at) > now
      )

      if (!tokenRecord) return null

      // Mark as used
      tokenRecord.used_at = now.toISOString()
      await this.saveJSONFile(this.getTokensFile(), tokens)

      return { email: tokenRecord.email, valid: true }
    },

    async createSessionJSON(userId, sessionToken, expiresAt) {
      const sessions = await this.loadJSONFile(this.getSessionsFile())

      sessions.push({
        id: Date.now(),
        user_id: userId,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      })

      await this.saveJSONFile(this.getSessionsFile(), sessions)
      return { sessionToken, expiresAt: expiresAt.toISOString() }
    },

    async getSessionByTokenJSON(sessionToken) {
      const sessions = await this.loadJSONFile(this.getSessionsFile())
      const users = await this.loadJSONFile(this.getUsersFile())
      const now = new Date()

      const session = sessions.find(s =>
        s.session_token === sessionToken &&
        new Date(s.expires_at) > now
      )

      if (!session) return null

      const user = users.find(u => u.id === session.user_id)
      if (!user) return null

      return {
        id: session.id,
        userId: session.user_id,
        email: user.email,
        sessionToken: session.session_token,
        expiresAt: session.expires_at
      }
    },

    async destroySessionJSON(sessionToken) {
      const sessions = await this.loadJSONFile(this.getSessionsFile())
      const filtered = sessions.filter(s => s.session_token !== sessionToken)
      await this.saveJSONFile(this.getSessionsFile(), filtered)
      return true
    },

    async destroyUserSessionsJSON(userId) {
      const sessions = await this.loadJSONFile(this.getSessionsFile())
      const filtered = sessions.filter(s => s.user_id !== userId)
      await this.saveJSONFile(this.getSessionsFile(), filtered)
      return true
    }
  })
}
