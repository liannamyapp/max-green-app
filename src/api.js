const BASE_URL = 'https://api.green-api.com'

function instanceUrl({ idInstance, apiTokenInstance }, method, extra = '') {
  return `${BASE_URL}/waInstance${idInstance}/${method}/${apiTokenInstance}${extra}`
}

export function phoneToChatId(phone) {
  const digits = String(phone).replace(/\D/g, '')
  return `${digits}@c.us`
}

export function chatIdToPhone(chatId) {
  const digits = String(chatId).replace(/@c\.us$/, '').replace(/\D/g, '')
  return digits ? `+${digits}` : chatId
}

export async function sendMessage(creds, chatId, message) {
  const res = await fetch(instanceUrl(creds, 'sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`sendMessage failed: ${res.status} ${text}`)
  }
  return res.json()
}

export async function receiveNotification(creds) {
  const res = await fetch(instanceUrl(creds, 'receiveNotification'), {
    method: 'GET',
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`receiveNotification failed: ${res.status} ${text}`)
  }
  const text = await res.text()
  if (!text) return null
  return JSON.parse(text)
}

export async function deleteNotification(creds, receiptId) {
  const res = await fetch(
    instanceUrl(creds, 'deleteNotification', `/${receiptId}`),
    { method: 'DELETE' },
  )
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`deleteNotification failed: ${res.status} ${text}`)
  }
  return res.json()
}

export async function getStateInstance(creds) {
  const res = await fetch(instanceUrl(creds, 'getStateInstance'), {
    method: 'GET',
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`getStateInstance failed: ${res.status} ${text}`)
  }
  return res.json()
}

export async function getSettings(creds) {
  const res = await fetch(instanceUrl(creds, 'getSettings'), { method: 'GET' })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`getSettings failed: ${res.status} ${text}`)
  }
  return res.json()
}

export function receivingEnabled(settings) {
  if (!settings) return false
  return (
    settings.incomingWebhook === 'yes' &&
    (!settings.webhookUrl || settings.webhookUrl === '')
  )
}

export async function enableReceiving(creds) {
  const res = await fetch(instanceUrl(creds, 'setSettings'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      webhookUrl: '',
      incomingWebhook: 'yes',
      outgoingAPIMessageWebhook: 'yes',
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`setSettings failed: ${res.status} ${text}`)
  }
  return res.json()
}
