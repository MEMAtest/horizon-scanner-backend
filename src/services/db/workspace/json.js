const fs = require('fs').promises
const {
  createDefaultWorkspaceState,
  ensureBookmarkCollections,
  parseWorkspaceState
} = require('./validators')
const { mapPinnedItems } = require('./mappers')

async function loadWorkspaceState(service) {
  try {
    const raw = await fs.readFile(service.workspaceFile, 'utf8')
    return parseWorkspaceState(raw)
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn('[workspace] Failed to read workspace cache:', error.message)
    }
    const fallback = createDefaultWorkspaceState()
    await fs.writeFile(service.workspaceFile, JSON.stringify(fallback, null, 2))
    return fallback
  }
}

async function saveWorkspaceState(service, state) {
  const merged = {
    ...createDefaultWorkspaceState(),
    ...state,
    savedSearches: Array.isArray(state?.savedSearches) ? state.savedSearches : [],
    customAlerts: Array.isArray(state?.customAlerts) ? state.customAlerts : [],
    pinnedItems: Array.isArray(state?.pinnedItems) ? state.pinnedItems : [],
    firmProfile: state?.firmProfile || null,
    bookmarkCollections: ensureBookmarkCollections(state?.bookmarkCollections || state?.bookmark_collections)
  }

  await fs.writeFile(service.workspaceFile, JSON.stringify(merged, null, 2))
  return merged
}

async function getSavedSearchesJSON(service) {
  const workspace = await loadWorkspaceState(service)
  return workspace.savedSearches
}

async function getSavedSearchJSON(service, searchId) {
  const workspace = await loadWorkspaceState(service)
  return workspace.savedSearches.find(search => String(search.id) === String(searchId)) || null
}

async function deleteSavedSearchJSON(service, searchId) {
  const workspace = await loadWorkspaceState(service)
  const initialLength = workspace.savedSearches.length
  workspace.savedSearches = workspace.savedSearches.filter(search => String(search.id) !== String(searchId))
  await saveWorkspaceState(service, workspace)
  return workspace.savedSearches.length < initialLength
}

async function createCustomAlertJSON(service, customAlert) {
  try {
    const workspace = await loadWorkspaceState(service)
    workspace.customAlerts.push(customAlert)
    await saveWorkspaceState(service, workspace)
    console.log(`🚨 Created custom alert in JSON: ${customAlert.alertName}`)
    return customAlert
  } catch (error) {
    throw new Error(`Failed to create custom alert: ${error.message}`)
  }
}

async function getCustomAlertsJSON(service) {
  try {
    const workspace = await loadWorkspaceState(service)
    return workspace.customAlerts
  } catch (error) {
    return []
  }
}

async function updateAlertStatusJSON(service, alertId, isActive) {
  try {
    const workspace = await loadWorkspaceState(service)
    const alert = workspace.customAlerts.find(item => String(item.id) === String(alertId))
    if (alert) {
      alert.isActive = isActive
      await saveWorkspaceState(service, workspace)
      return true
    }
    return false
  } catch (error) {
    return false
  }
}

async function deleteCustomAlertJSON(service, alertId) {
  try {
    const workspace = await loadWorkspaceState(service)
    const initialLength = workspace.customAlerts.length
    workspace.customAlerts = workspace.customAlerts.filter(alert => String(alert.id) !== String(alertId))
    await saveWorkspaceState(service, workspace)
    return workspace.customAlerts.length < initialLength
  } catch (error) {
    return false
  }
}

async function getPinnedItemsJSON(service) {
  try {
    const workspace = await loadWorkspaceState(service)
    return mapPinnedItems(service, workspace.pinnedItems)
  } catch (error) {
    return []
  }
}

async function updatePinnedItemNotesJSON(service, updateUrl, notes) {
  try {
    const workspace = await loadWorkspaceState(service)
    const pinnedItem = workspace.pinnedItems.find(item => item.updateUrl === updateUrl)
    if (pinnedItem) {
      pinnedItem.notes = notes
      pinnedItem.updatedDate = new Date().toISOString()
      await saveWorkspaceState(service, workspace)
      return true
    }
    return false
  } catch (error) {
    return false
  }
}

async function getFirmProfileJSON(service) {
  try {
    const workspace = await loadWorkspaceState(service)
    return workspace.firmProfile
  } catch (error) {
    return null
  }
}

async function clearFirmProfileJSON(service) {
  try {
    const workspace = await loadWorkspaceState(service)
    workspace.firmProfile = null
    await saveWorkspaceState(service, workspace)
    console.log('✅ Firm profile cleared from JSON')
  } catch (error) {
    console.error('Error clearing firm profile from JSON:', error)
    throw error
  }
}

async function saveFirmProfileJSON(service, profileData) {
  try {
    const workspace = await loadWorkspaceState(service)

    // Save the profile
    workspace.firmProfile = {
      firmName: profileData.firmName,
      primarySectors: profileData.primarySectors || [],
      firmSize: profileData.firmSize || 'Medium',
      isActive: true,
      createdDate: new Date().toISOString()
    }

    await saveWorkspaceState(service, workspace)
    console.log('✅ Firm profile saved to JSON')
    return workspace.firmProfile
  } catch (error) {
    console.error('Error saving firm profile to JSON:', error)
    throw error
  }
}

module.exports = {
  clearFirmProfileJSON,
  createCustomAlertJSON,
  deleteCustomAlertJSON,
  deleteSavedSearchJSON,
  getCustomAlertsJSON,
  getFirmProfileJSON,
  getPinnedItemsJSON,
  getSavedSearchJSON,
  getSavedSearchesJSON,
  loadWorkspaceState,
  saveFirmProfileJSON,
  saveWorkspaceState,
  updateAlertStatusJSON,
  updatePinnedItemNotesJSON
}
