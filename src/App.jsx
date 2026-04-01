import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from './lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import LandingPage from './pages/LandingPage'
import AuthScreen from './pages/AuthScreen'
import AppShell from './pages/AppShell'
import Onboarding from './pages/Onboarding'
import { PageLoader } from './components/Loading'

// Shared auth hook used by both routes
function useAuth() {
  const [state, setState] = useState({ ready: false, user: null, isNew: false })

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      if (u) {
        let isNew = false
        try {
          const snap = await getDoc(doc(db, 'users', u.uid, 'profile', 'main'))
          isNew = !snap.exists()
        } catch {}
        setState({ ready: true, user: u, isNew })
      } else {
        setState({ ready: true, user: null, isNew: false })
      }
    })
    return unsub
  }, [])

  return state
}

function AuthRoute() {
  const navigate = useNavigate()
  const { ready, user, isNew } = useAuth()

  useEffect(() => {
    if (ready && user && !isNew) {
      navigate('/app', { replace: true })
    }
  }, [ready, user, isNew])

  if (!ready) return <PageLoader />
  if (user && isNew) return <Onboarding user={user} onDone={() => navigate('/app', { replace: true })} />
  if (user) return null // navigating to /app
  return <AuthScreen />
}

function ProtectedRoute() {
  const navigate = useNavigate()
  const { ready, user, isNew } = useAuth()

  useEffect(() => {
    if (ready && !user) {
      navigate('/login', { replace: true })
    }
  }, [ready, user])

  if (!ready) return <PageLoader />
  if (!user) return null // navigating to /login
  if (isNew) return <Onboarding user={user} onDone={() => navigate('/app', { replace: true })} />
  return <AppShell user={user} />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthRoute />} />
      <Route path="/app" element={<ProtectedRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
