import { useState } from 'react'
import { getStateInstance } from '../api.js'

export default function Login({ onLogin }) {
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    const creds = {
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
    }
    if (!creds.idInstance || !creds.apiTokenInstance) {
      setError('Заполните оба поля')
      return
    }
    setLoading(true)
    try {
      const state = await getStateInstance(creds)
      if (state?.stateInstance && state.stateInstance !== 'authorized') {
        setError(
          `Инстанс не авторизован (состояние: ${state.stateInstance}). ` +
            'Авторизуйте его в личном кабинете GREEN-API.',
        )
        setLoading(false)
        return
      }
      onLogin(creds)
    } catch (err) {
      setError(
        'Не удалось проверить учётные данные. Проверьте idInstance и ' +
          `apiTokenInstance. (${err.message})`,
      )
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <form className="login__card" onSubmit={handleSubmit}>
        <div className="login__logo">MAX</div>
        <h1 className="login__title">Вход в чат</h1>
        <p className="login__subtitle">
          Введите данные вашего инстанса{' '}
          <a href="https://green-api.com/max" target="_blank" rel="noreferrer">
            GREEN-API
          </a>
        </p>

        <label className="login__label">
          idInstance
          <input
            className="login__input"
            type="text"
            value={idInstance}
            onChange={(e) => setIdInstance(e.target.value)}
            placeholder="1101000000"
            autoComplete="off"
          />
        </label>

        <label className="login__label">
          apiTokenInstance
          <input
            className="login__input"
            type="password"
            value={apiTokenInstance}
            onChange={(e) => setApiTokenInstance(e.target.value)}
            placeholder="d75b3a66374942c5b3c019c698abc2067e151558acbd412345"
            autoComplete="off"
          />
        </label>

        {error && <div className="login__error">{error}</div>}

        <button className="login__button" type="submit" disabled={loading}>
          {loading ? 'Проверка…' : 'Войти'}
        </button>
      </form>
    </div>
  )
}
