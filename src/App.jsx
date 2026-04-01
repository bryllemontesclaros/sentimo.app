import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from './lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import LandingPage from './pages/LandingPage'
import AuthScreen from './pages/AuthScreen'
import AppShell from './pages/AppShell'
import Onboarding from './pages/Onboarding'
import { PageLoader } from './components/Loading'

export default function App() {
  const [user, setUser] = useState(undefined)
  const [isNew, setIsNew] = useState(false)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      if (u) {
        try {
          const profileDoc = await getDoc(doc(db, 'users', u.uid, 'profile', 'main'))
          setIsNew(!profileDoc.exists())
        } catch {
          setIsNew(false)
        }
      }
      setUser(u || null)
    })
    return unsub
  }, [])

  if (user === undefined) return <PageLoader />

  if (user) {
    if (isNew) return <Onboarding user={user} onDone={() => setIsNew(false)} />
    return <AppShell user={user} />
  }

  if (showAuth) return <AuthScreen onBack={() => setShowAuth(false)} />
  return <LandingPage onGetStarted={() => setShowAuth(true)} />
}
