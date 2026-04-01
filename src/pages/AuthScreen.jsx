import { useState } from 'react'
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signInWithPopup, updateProfile
} from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'
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
  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })

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

  async function handleGoogle() {
    setError('')
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') setError('Google sign-in failed. Try again.')
    }
  }

  const GoogleIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.logo}>Sentimo</div>
        <div className={styles.tagline}>Bawat piso, sinusubaybayan.</div>

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'login' ? styles.active : ''}`} onClick={() => { setTab('login'); setError('') }}>Log in</button>
          <button className={`${styles.tab} ${tab === 'register' ? styles.active : ''}`} onClick={() => { setTab('register'); setError('') }}>Register</button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className={styles.field}><label>Email</label><input type="email" placeholder="juan@email.com" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div className={styles.field}><label>Password</label><input type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} /></div>
            <button className={styles.btnPrimary} type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Log in'}</button>
            <div className={styles.divider}>or</div>
            <button type="button" className={styles.btnGoogle} onClick={handleGoogle}><GoogleIcon /> Continue with Google</button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className={styles.field}><label>Full name</label><input type="text" placeholder="Juan dela Cruz" value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div className={styles.field}><label>Email</label><input type="email" placeholder="juan@email.com" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div className={styles.field}><label>Password</label><input type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => set('password', e.target.value)} /></div>
            <div className={styles.field}><label>Confirm password</label><input type="password" placeholder="••••••••" value={form.confirm} onChange={e => set('confirm', e.target.value)} /></div>
            <button className={styles.btnPrimary} type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</button>
            <div className={styles.divider}>or</div>
            <button type="button" className={styles.btnGoogle} onClick={handleGoogle}><GoogleIcon /> Sign up with Google</button>
          </form>
        )}
      </div>
    </div>
  )
}
