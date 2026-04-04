import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  updateProfile, sendPasswordResetEmail
} from 'firebase/auth'
import { auth } from '../lib/firebase'
import styles from './AuthScreen.module.css'

const ERROR_MSGS = {
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/too-many-requests': 'Too many attempts. Try again later.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/invalid-email': 'Invalid email address.',
}

export default function AuthScreen() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showForgot, setShowForgot] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  function set(field, val) { setForm(f => ({ ...f, [field]: val })) }

  async function handleLogin(e) {
    e.preventDefault()
    if (!form.email || !form.password) return setError('Please enter email and password.')
    setLoading(true); setError('')
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password)
    } catch (e) {
      setError(ERROR_MSGS[e.code] || e.message)
    } finally { setLoading(false) }
  }

  async function handleRegister(e) {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) return setError('Please fill all fields.')
    if (form.password !== form.confirm) return setError('Passwords do not match.')
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')
    setLoading(true); setError('')
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password)
      await updateProfile(cred.user, { displayName: form.name })
    } catch (e) {
      setError(ERROR_MSGS[e.code] || e.message)
    } finally { setLoading(false) }
  }

  async function handleReset(e) {
    e.preventDefault()
    if (!resetEmail) return setError('Please enter your email.')
    setResetLoading(true); setError('')
    try {
      await sendPasswordResetEmail(auth, resetEmail)
      setSuccess('Password reset email sent. Check your inbox.')
      setShowForgot(false)
      setResetEmail('')
    } catch (e) {
      setError(ERROR_MSGS[e.code] || 'Failed to send reset email.')
    } finally { setResetLoading(false) }
  }

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.logo}>Sentimo</div>
        <div className={styles.tagline}>Bawat piso, sinusubaybayan.</div>

        {!showForgot ? (
          <>
            <div className={styles.tabs}>
              <button className={`${styles.tab} ${tab === 'login' ? styles.active : ''}`} onClick={() => { setTab('login'); setError(''); setSuccess('') }}>Log in</button>
              <button className={`${styles.tab} ${tab === 'register' ? styles.active : ''}`} onClick={() => { setTab('register'); setError(''); setSuccess('') }}>Register</button>
            </div>

            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.successMsg}>{success}</div>}

            {tab === 'login' ? (
              <form onSubmit={handleLogin}>
                <div className={styles.field}><label>Email</label><input type="email" placeholder="juan@email.com" value={form.email} onChange={e => set('email', e.target.value)} autoComplete="email" /></div>
                <div className={styles.field}><label>Password</label><input type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} autoComplete="current-password" /></div>
                <button type="button" className={styles.forgotLink} onClick={() => { setShowForgot(true); setResetEmail(form.email); setError('') }}>Forgot password?</button>
                <button className={styles.btnPrimary} type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Log in'}</button>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                <div className={styles.field}><label>Full name</label><input type="text" placeholder="Juan dela Cruz" value={form.name} onChange={e => set('name', e.target.value)} autoComplete="name" /></div>
                <div className={styles.field}><label>Email</label><input type="email" placeholder="juan@email.com" value={form.email} onChange={e => set('email', e.target.value)} autoComplete="email" /></div>
                <div className={styles.field}><label>Password</label><input type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => set('password', e.target.value)} autoComplete="new-password" /></div>
                <div className={styles.field}><label>Confirm password</label><input type="password" placeholder="••••••••" value={form.confirm} onChange={e => set('confirm', e.target.value)} autoComplete="new-password" /></div>
                <button className={styles.btnPrimary} type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</button>
              </form>
            )}
          </>
        ) : (
          <>
            <div className={styles.forgotTitle}>Reset password</div>
            <div className={styles.forgotSub}>Enter your email and we'll send you a reset link.</div>
            {error && <div className={styles.error}>{error}</div>}
            <form onSubmit={handleReset}>
              <div className={styles.field}><label>Email</label><input type="email" placeholder="juan@email.com" value={resetEmail} onChange={e => setResetEmail(e.target.value)} autoFocus /></div>
              <button className={styles.btnPrimary} type="submit" disabled={resetLoading}>{resetLoading ? 'Sending...' : 'Send reset link'}</button>
            </form>
            <button type="button" className={styles.backLink} onClick={() => { setShowForgot(false); setError('') }}>← Back to login</button>
          </>
        )}
      </div>
    </div>
  )
}
