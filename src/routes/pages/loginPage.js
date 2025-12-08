/**
 * Login Page Routes
 * Handles login form and magic link verification
 */

const authService = require('../../services/authService')
const { setSessionCookie } = require('../../middleware/authMiddleware')
const { getCommonStyles } = require('../templates/commonStyles')

/**
 * Render login page
 */
async function renderLoginPage(req, res) {
  // If already logged in, redirect to home
  if (req.user && req.isAuthenticated) {
    return res.redirect('/')
  }

  const returnUrl = req.query.returnUrl || '/'
  const error = req.query.error || null

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - RegCanary</title>
  ${getCommonStyles()}
  <style>
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f5f7fb 0%, #e8eef5 100%);
      padding: 20px;
    }

    .login-container {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12);
      padding: 48px;
      max-width: 440px;
      width: 100%;
    }

    .login-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .login-logo {
      font-size: 2rem;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 8px;
    }

    .login-subtitle {
      color: #6b7280;
      font-size: 0.95rem;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-label {
      font-weight: 500;
      color: #374151;
      font-size: 0.9rem;
    }

    .form-input {
      padding: 14px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      font-size: 1rem;
      transition: all 0.2s;
    }

    .form-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .login-btn {
      padding: 14px 24px;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
    }

    .login-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(59, 130, 246, 0.35);
    }

    .login-btn:disabled {
      background: #9ca3af;
      box-shadow: none;
      cursor: not-allowed;
      transform: none;
    }

    .error-message {
      background: #fef2f2;
      color: #dc2626;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 0.9rem;
      border: 1px solid #fecaca;
    }

    .success-message {
      background: #f0fdf4;
      color: #16a34a;
      padding: 16px;
      border-radius: 8px;
      font-size: 0.95rem;
      border: 1px solid #bbf7d0;
      text-align: center;
    }

    .login-footer {
      margin-top: 24px;
      text-align: center;
      color: #6b7280;
      font-size: 0.85rem;
    }

    .login-footer a {
      color: #3b82f6;
      text-decoration: none;
    }

    .login-footer a:hover {
      text-decoration: underline;
    }

    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 0.8s linear infinite;
      margin-right: 8px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .hidden { display: none; }
  </style>
</head>
<body>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <div class="login-logo">RegCanary</div>
        <p class="login-subtitle">UK Financial Regulatory Intelligence</p>
      </div>

      ${error ? `<div class="error-message">${escapeHtml(error)}</div>` : ''}

      <div id="loginForm">
        <form class="login-form" onsubmit="handleLogin(event)">
          <div class="form-group">
            <label class="form-label" for="email">Email address</label>
            <input
              type="email"
              id="email"
              name="email"
              class="form-input"
              placeholder="you@company.com"
              required
              autocomplete="email"
            >
          </div>

          <button type="submit" class="login-btn" id="submitBtn">
            Send login link
          </button>
        </form>

        <div class="login-footer">
          <p>We'll email you a magic link for passwordless sign-in.</p>
          <p style="margin-top: 16px;">
            <a href="/">Continue browsing without login</a>
          </p>
        </div>
      </div>

      <div id="successMessage" class="hidden">
        <div class="success-message">
          <strong>Check your email!</strong><br><br>
          We've sent a login link to <span id="sentEmail"></span>.<br>
          Click the link in the email to sign in.
        </div>
        <div class="login-footer" style="margin-top: 24px;">
          <p>Didn't receive the email? <a href="#" onclick="showLoginForm()">Try again</a></p>
        </div>
      </div>
    </div>
  </div>

  <script>
    const returnUrl = '${escapeHtml(returnUrl)}';

    async function handleLogin(event) {
      event.preventDefault();

      const email = document.getElementById('email').value.trim();
      const submitBtn = document.getElementById('submitBtn');

      if (!email) return;

      // Show loading state
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Sending...';

      try {
        const response = await fetch('/api/auth/magic-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (data.success) {
          // Show success message
          document.getElementById('loginForm').classList.add('hidden');
          document.getElementById('successMessage').classList.remove('hidden');
          document.getElementById('sentEmail').textContent = email;
        } else {
          throw new Error(data.error || 'Failed to send login link');
        }
      } catch (error) {
        alert(error.message);
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Send login link';
      }
    }

    function showLoginForm() {
      document.getElementById('loginForm').classList.remove('hidden');
      document.getElementById('successMessage').classList.add('hidden');
      document.getElementById('email').value = '';
      document.getElementById('submitBtn').disabled = false;
      document.getElementById('submitBtn').innerHTML = 'Send login link';
    }
  </script>
</body>
</html>
`

  res.send(html)
}

/**
 * Verify magic link token
 */
async function verifyMagicLink(req, res) {
  const { token } = req.query
  const returnUrl = req.query.returnUrl || '/'

  if (!token) {
    return res.redirect('/login?error=Invalid login link')
  }

  try {
    const result = await authService.verifyMagicLink(token)

    if (!result || !result.user || !result.session) {
      return res.redirect('/login?error=Login link has expired or is invalid. Please request a new one.')
    }

    // Set session cookie
    setSessionCookie(res, result.session.sessionToken)

    // Check if user needs to select persona
    // For now, just redirect to home or return URL
    res.redirect(returnUrl)
  } catch (error) {
    console.error('Magic link verification error:', error.message)
    res.redirect('/login?error=Something went wrong. Please try again.')
  }
}

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Register auth page routes
 */
function registerAuthPageRoutes(app) {
  app.get('/login', renderLoginPage)
  app.get('/auth/verify', verifyMagicLink)
}

module.exports = {
  renderLoginPage,
  verifyMagicLink,
  registerAuthPageRoutes
}
