import { useState } from 'react'
import { chatIdToPhone } from '../api.js'

function initials(name) {
  const s = String(name || '').replace(/^\+/, '')
  return s.slice(-2) || '??'
}

function lastMessagePreview(chat) {
  const last = chat.messages[chat.messages.length - 1]
  if (!last) return 'Нет сообщений'
  return (last.outgoing ? 'Вы: ' : '') + last.text
}

export default function Sidebar({
  creds,
  chats,
  activeChatId,
  onSelectChat,
  onCreateChat,
  onLogout,
  pollError,
}) {
  const [phone, setPhone] = useState('')
  const [showNew, setShowNew] = useState(false)

  const chatList = Object.values(chats).sort((a, b) => {
    const at = a.messages[a.messages.length - 1]?.timestamp || 0
    const bt = b.messages[b.messages.length - 1]?.timestamp || 0
    return bt - at
  })

  function handleCreate(e) {
    e.preventDefault()
    const digits = phone.replace(/\D/g, '')
    if (!digits) return
    onCreateChat(digits)
    setPhone('')
    setShowNew(false)
  }

  return (
    <aside className="sidebar">
      <header className="sidebar__header">
        <div className="sidebar__brand">
          <span className="sidebar__brandmark">MAX</span>
          <span className="sidebar__instance">#{creds.idInstance}</span>
        </div>
        <button
          className="sidebar__logout"
          onClick={onLogout}
          title="Выйти"
        >
          Выйти
        </button>
      </header>

      <div className="sidebar__new">
        {showNew ? (
          <form onSubmit={handleCreate} className="sidebar__newform">
            <input
              className="sidebar__newinput"
              type="tel"
              autoFocus
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Номер получателя, напр. 79991234567"
            />
            <button className="sidebar__newbtn" type="submit">
              OK
            </button>
          </form>
        ) : (
          <button
            className="sidebar__newtrigger"
            onClick={() => setShowNew(true)}
          >
            + Новый чат
          </button>
        )}
      </div>

      {pollError && (
        <div className="sidebar__pollerror" title={pollError}>
          Ошибка получения: {pollError}
        </div>
      )}

      <div className="sidebar__list">
        {chatList.length === 0 && (
          <div className="sidebar__empty">
            Создайте новый чат, чтобы начать переписку.
          </div>
        )}
        {chatList.map((chat) => (
          <button
            key={chat.chatId}
            className={
              'chatitem' +
              (chat.chatId === activeChatId ? ' chatitem--active' : '')
            }
            onClick={() => onSelectChat(chat.chatId)}
          >
            <div className="chatitem__avatar">{initials(chat.name)}</div>
            <div className="chatitem__body">
              <div className="chatitem__name">
                {chat.name || chatIdToPhone(chat.chatId)}
              </div>
              <div className="chatitem__preview">
                {lastMessagePreview(chat)}
              </div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  )
}
