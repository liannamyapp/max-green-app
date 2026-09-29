const CREDS_KEY = 'max-chat:creds'

export function loadCreds() {
  try {
    const raw = localStorage.getItem(CREDS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveCreds(creds) {
  localStorage.setItem(CREDS_KEY, JSON.stringify(creds))
}

export function clearCreds() {
  localStorage.removeItem(CREDS_KEY)
}

function chatsKey(idInstance) {
  return `max-chat:chats:${idInstance}`
}

export function loadChats(idInstance) {
  try {
    const raw = localStorage.getItem(chatsKey(idInstance))
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveChats(idInstance, chats) {
  localStorage.setItem(chatsKey(idInstance), JSON.stringify(chats))
}
