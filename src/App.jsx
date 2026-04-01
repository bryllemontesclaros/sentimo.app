import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './lib/firebase'
import AuthScreen from './pages/AuthScreen'
import AppShell from './pages/AppShell'
import Onboarding from './pages/Onboarding'
import { PageLoader } from './components/Loading'

export default function App() {
  const [user, setUser] = useState(undefined)
  const [isNew, setIsNew] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (u) {
        // Check if newly registered (metadata creationTime ≈ lastSignInTime)
        const created = new Date(u.metadata.creationTime).getTime()
        const lastSign = new Date(u.metadata.lastSignInTime).getTime()
        setIsNew(Math.abs(created - lastSign) < 5000)
      }
      setUser(u || null)
    })
    return unsub
  }, [])

  if (user === undefined) return <PageLoader />
  if (!user) return <AuthScreen />
  if (isNew) return <Onboarding user={user} onDone={() => setIsNew(false)} />
  return <AppShell user={user} />
}
