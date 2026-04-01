import { useState, useEffect } from 'react'
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth'
import { auth, db } from './lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import LandingPage from './pages/LandingPage'
import AuthScreen from './pages/AuthScreen'
import AppShell from './pages/AppShell'
import Onboarding from './pages/Onboarding'
import { PageLoader } from './components/Loading'

const REDIRECT_KEY = 'sentimo_google_redirect'

export default function App() {
  const [user, setUser] = useState(undefined)
  const [isNew, setIsNew] = useState(false)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    const wasRedirecting = sessionStorage.getItem(REDIRECT_KEY)
    if (wasRedirecting) sessionStorage.removeItem(REDIRECT_KEY)

    async function resolveUser(u) {
      try {
        const profileDoc = await getDoc(doc(db, 'users', u.uid, 'profile', 'main'))
        setIsNew(!profileDoc.exists())
      } catch {
        setIsNew(false)
      }
      setUser(u)
    }

    // Always set up onAuthStateChanged — it handles ALL cases
    // including after redirect returns (Firebase resolves it internally)
    const unsub = onAuthStateChanged(auth, async u => {
      if (u) {
        await resolveUser(u)
      } else {
        // Only show null if we're NOT mid-redirect
        if (!wasRedirecting) {
          setUser(null)
        } else {
          // Mid-redirect — wait for getRedirectResult to fire auth state again
          try {
            const result = await getRedirectResult(auth)
            if (result?.user) {
              await resolveUser(result.user)
            } else {
              setUser(null)
            }
          } catch {
            setUser(null)
          }
        }
      }
    })

    return unsub
  }, [])

  if (user === undefined) return <PageLoader />

  if (user) {
    if (isNew) return <Onboarding user={user} onDone={() => setIsNew(false)} />
    return <AppShell user={user} />
  }

  if (showAuth) return <AuthScreen onBack={() => setShowAuth(false)} redirectKey={REDIRECT_KEY} />
  return <LandingPage onGetStarted={() => setShowAuth(true)} />
}
