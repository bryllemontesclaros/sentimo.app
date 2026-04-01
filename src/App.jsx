import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth'
import { auth, db } from './lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import LandingPage from './pages/LandingPage'
import AuthScreen from './pages/AuthScreen'
import AppShell from './pages/AppShell'
import Onboarding from './pages/Onboarding'
import { PageLoader } from './components/Loading'

function AuthRoute() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState(null)
  const [isNew, setIsNew] = useState(false)

  useEffect(() => {
    async function resolveUser(u) {
      try {
        const profileDoc = await getDoc(doc(db, 'users', u.uid, 'profile', 'main'))
        setIsNew(!profileDoc.exists())
      } catch {
        setIsNew(false)
      }
      setUser(u)
      setReady(true)
    }

    async function init() {
      // Handle Google redirect result first
      try {
        const result = await getRedirectResult(auth)
        if (result?.user) {
          await resolveUser(result.user)
          navigate('/app', { replace: true })
          return
        }
      } catch {}

      // Check current auth state
      const unsub = onAuthStateChanged(auth, async u => {
        if (u) {
          await resolveUser(u)
          navigate('/app', { replace: true })
        } else {
          setReady(true)
        }
      })
      return unsub
    }

    let unsub
    init().then(u => { unsub = u })
    return () => { if (typeof unsub === 'function') unsub() }
  }, [])

  if (!ready) return <PageLoader />
  if (user && isNew) return <Onboarding user={user} onDone={() => navigate('/app', { replace: true })} />
  return <AuthScreen />
}

function ProtectedRoute() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState(null)
  const [isNew, setIsNew] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      if (u) {
        try {
          const profileDoc = await getDoc(doc(db, 'users', u.uid, 'profile', 'main'))
          setIsNew(!profileDoc.exists())
        } catch {
          setIsNew(false)
        }
        setUser(u)
      } else {
        navigate('/login', { replace: true })
      }
      setReady(true)
    })
    return unsub
  }, [])

  if (!ready) return <PageLoader />
  if (isNew) return <Onboarding user={user} onDone={() => setIsNew(false)} />
  if (user) return <AppShell user={user} />
  return null
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage onGetStarted={() => window.location.href = '/login'} />} />
      <Route path="/login" element={<AuthRoute />} />
      <Route path="/app" element={<ProtectedRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
