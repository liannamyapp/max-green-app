import { useCallback, useEffect, useRef, useState } from 'react'
import Login from './components/Login.jsx'
import Sidebar from './components/Sidebar.jsx'
import ChatWindow from './components/ChatWindow.jsx'
import {
  sendMessage,
  receiveNotification,
  deleteNotification,
  phoneToChatId,
  chatIdToPhone,
  getSettings,
  receivingEnabled,
  enableReceiving,
} from './api.js'
import {
  loadCreds,
  saveCreds,
  clearCreds,
  loadChats,
  saveChats,
} from './storage.js'

const POLL_INTERVAL_MS = 3000

export default function App() {
  const [creds, setCreds] = useState(() => loadCreds())
  const [chats, setChats] = useState({})
  const [activeChatId, setActiveChatId] = useState(null)
  const [pollError, setPollError] = useState(null)
  const [needsReceiveSetup, setNeedsReceiveSetup] = useState(false)
  const [fixingSettings, setFixingSettings] = useState(false)

  useEffect(() => {
    if (creds) setChats(loadChats(creds.idInstance))
  }, [creds])

  useEffect(() => {
    if (!creds) return
    let cancelled = false
    getSettings(creds)
      .then((settings) => {
        if (!cancelled) setNeedsReceiveSetup(!receivingEnabled(settings))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [creds])

  async function handleEnableReceiving() {
    setFixingSettings(true)
    try {
      await enableReceiving(creds)
      setNeedsReceiveSetup(false)
    } catch (err) {
      setPollError(err.message)
    } finally {
      setFixingSettings(false)
    }
  }

  useEffect(() => {
    if (creds) saveChats(creds.idInstance, chats)
  }, [creds, chats])

  const upsertChat = useCallback((chatId, name) => {
    setChats((prev) => {
      if (prev[chatId]) return prev
      return {
        ...prev,
        [chatId]: { chatId, name: name || chatIdToPhone(chatId), messages: [] },
      }
    })
  }, [])

  const addMessage = useCallback((chatId, msg, name) => {
    setChats((prev) => {
      const existing = prev[chatId] || {
        chatId,
        name: name || chatIdToPhone(chatId),
        messages: [],
      }
      if (msg.id && existing.messages.some((m) => m.id === msg.id)) return prev
      return {
        ...prev,
        [chatId]: {
          ...existing,
          name: existing.name || name || chatIdToPhone(chatId),
          messages: [...existing.messages, msg],
        },
      }
    })
  }, [])

  const processNotification = useCallback(
    (notification) => {
      const body = notification?.body
      if (!body) return
      const { typeWebhook, senderData, messageData, idMessage, timestamp } = body

      const text =
        messageData?.textMessageData?.textMessage ??
        messageData?.extendedTextMessageData?.text

      if (typeWebhook === 'incomingMessageReceived' && text != null) {
        const chatId = senderData?.chatId
        if (!chatId) return
        addMessage(
          chatId,
          {
            id: idMessage,
            text,
            outgoing: false,
            timestamp: (timestamp || 0) * 1000 || Date.now(),
          },
          senderData?.senderName,
        )
      } else if (
        typeWebhook === 'outgoingAPIMessageReceived' &&
        text != null
      ) {
        const chatId = senderData?.chatId
        if (!chatId) return
        addMessage(chatId, {
          id: idMessage,
          text,
          outgoing: true,
          timestamp: (timestamp || 0) * 1000 || Date.now(),
        })
      }
    },
    [addMessage],
  )

  useEffect(() => {
    if (!creds) return
    let stopped = false
    let timer

    async function poll() {
      try {
        const notification = await receiveNotification(creds)
        setPollError(null)
        if (notification) {
          processNotification(notification)
          await deleteNotification(creds, notification.receiptId)
          if (!stopped) {
            timer = setTimeout(poll, 300)
            return
          }
        }
      } catch (err) {
        setPollError(err.message)
      }
      if (!stopped) timer = setTimeout(poll, POLL_INTERVAL_MS)
    }

    poll()
    return () => {
      stopped = true
      clearTimeout(timer)
    }
  }, [creds, processNotification])

  function handleLogin(newCreds) {
    saveCreds(newCreds)
    setCreds(newCreds)
  }

  function handleLogout() {
    clearCreds()
    setCreds(null)
    setChats({})
    setActiveChatId(null)
  }

  function handleCreateChat(phone) {
    const chatId = phoneToChatId(phone)
    upsertChat(chatId)
    setActiveChatId(chatId)
    return chatId
  }

  async function handleSend(text) {
    if (!activeChatId || !text.trim()) return
    const trimmed = text.trim()
    const tempId = `local-${Date.now()}`
    addMessage(activeChatId, {
      id: tempId,
      text: trimmed,
      outgoing: true,
      timestamp: Date.now(),
    })
    try {
      await sendMessage(creds, activeChatId, trimmed)
    } catch (err) {
      addMessage(activeChatId, {
        id: `err-${Date.now()}`,
        text: `⚠️ Не удалось отправить: ${err.message}`,
        outgoing: true,
        timestamp: Date.now(),
        error: true,
      })
    }
  }

  if (!creds) {
    return <Login onLogin={handleLogin} />
  }

  const activeChat = activeChatId ? chats[activeChatId] : null

  return (
    <div className="app">
      <Sidebar
        creds={creds}
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
        onCreateChat={handleCreateChat}
        onLogout={handleLogout}
        pollError={pollError}
      />
      <div className="app__main">
        {needsReceiveSetup && (
          <div className="setupbanner">
            <span>
              Получение сообщений выключено в настройках инстанса — ответы
              получателя не будут видны.
            </span>
            <button
              className="setupbanner__btn"
              onClick={handleEnableReceiving}
              disabled={fixingSettings}
            >
              {fixingSettings ? 'Включаем…' : 'Включить получение'}
            </button>
          </div>
        )}
        <ChatWindow chat={activeChat} onSend={handleSend} />
      </div>
    </div>
  )
}
