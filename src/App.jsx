import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './lib/firebase'
import AuthScreen from './pages/AuthScreen'
import AppShell from './pages/AppShell'

export default function App() {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u || null))
    return unsub
  }, [])

  if (user === undefined) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)', fontSize: 28 }}>Sentimo</div>
    </div>
  )

  return user ? <AppShell user={user} /> : <AuthScreen />
}
