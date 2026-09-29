import { useEffect, useRef, useState } from 'react'
import { chatIdToPhone } from '../api.js'

function formatTime(ts) {
  const d = new Date(ts)
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

export default function ChatWindow({ chat, onSend }) {
  const [text, setText] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [chat?.messages.length, chat?.chatId])

  if (!chat) {
    return (
      <main className="chat chat--empty">
        <div className="chat__placeholder">
          <div className="chat__placeholder-logo">MAX</div>
          <p>Выберите чат или создайте новый, чтобы начать общение</p>
        </div>
      </main>
    )
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    onSend(text)
    setText('')
  }

  return (
    <main className="chat">
      <header className="chat__header">
        <div className="chat__avatar">
          {String(chat.name || '').replace(/^\+/, '').slice(-2)}
        </div>
        <div className="chat__title">
          <div className="chat__name">
            {chat.name || chatIdToPhone(chat.chatId)}
          </div>
          <div className="chat__sub">{chatIdToPhone(chat.chatId)}</div>
        </div>
      </header>

      <div className="chat__messages" ref={scrollRef}>
        {chat.messages.length === 0 && (
          <div className="chat__hint">
            Сообщений пока нет. Напишите первым 👇
          </div>
        )}
        {chat.messages.map((m) => (
          <div
            key={m.id}
            className={
              'bubble ' +
              (m.outgoing ? 'bubble--out' : 'bubble--in') +
              (m.error ? ' bubble--error' : '')
            }
          >
            <span className="bubble__text">{m.text}</span>
            <span className="bubble__time">{formatTime(m.timestamp)}</span>
          </div>
        ))}
      </div>

      <form className="chat__composer" onSubmit={handleSubmit}>
        <input
          className="chat__input"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Написать сообщение…"
          autoFocus
        />
        <button className="chat__send" type="submit" disabled={!text.trim()}>
          Отправить
        </button>
      </form>
    </main>
  )
}
