import { useState, useEffect } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { listenCol, listenProfile } from '../lib/firestore'
import { getInitials, getCurrencySymbol } from '../lib/utils'
import Dashboard from './Dashboard'
import Calendar from './Calendar'
import Income from './Income'
import Expenses from './Expenses'
import Bills from './Bills'
import Savings from './Savings'
import Accounts from './Accounts'
import Breakdown from './Breakdown'
import Budget from './Budget'
import Settings from './Settings'
import History from './History'
import QuickAdd from './QuickAdd'
import { useTheme } from '../lib/theme.jsx'
import NotificationBell from '../components/NotificationBell'
import styles from './AppShell.module.css'

export default function AppShell({ user }) {
  const [page, setPage] = useState('dashboard')
  const [data, setData] = useState({ income: [], expenses: [], bills: [], goals: [], accounts: [], budgets: [] })
  const [profile, setProfile] = useState({})

  useEffect(() => {
    if (!user) return
    const uid = user.uid
    const unsubs = [
      listenCol(uid, 'income', rows => setData(d => ({ ...d, income: rows }))),
      listenCol(uid, 'expenses', rows => setData(d => ({ ...d, expenses: rows }))),
      listenCol(uid, 'bills', rows => setData(d => ({ ...d, bills: rows }))),
      listenCol(uid, 'goals', rows => setData(d => ({ ...d, goals: rows }))),
      listenCol(uid, 'accounts', rows => setData(d => ({ ...d, accounts: rows }))),
      listenCol(uid, 'budgets', rows => setData(d => ({ ...d, budgets: rows }))),
      listenProfile(uid, p => setProfile(p)),
    ]
    return () => unsubs.forEach(u => u())
  }, [user])

  const symbol = getCurrencySymbol(profile.currency || 'PHP')

  const nav = [
    { id: 'dashboard', label: 'Dashboard', icon: '◈', section: 'Overview' },
    { id: 'calendar', label: 'Calendar', icon: '◻', section: null },
    { id: 'history', label: 'History', icon: '☰', section: null },
    { id: 'breakdown', label: 'Breakdown', icon: '◑', section: 'Finance' },
    { id: 'budget', label: 'Budget', icon: '◎', section: null },
    { id: 'accounts', label: 'Accounts', icon: '◉', section: null },
    { id: 'savings', label: 'Savings Goals', icon: '◆', section: null },
    { id: 'settings', label: 'Settings', icon: '⚙', section: 'Account' },
  ]

  const pages = { dashboard: Dashboard, calendar: Calendar, history: History, income: Income, expenses: Expenses, bills: Bills, savings: Savings, accounts: Accounts, breakdown: Breakdown, budget: Budget, settings: Settings }
  const PageComponent = pages[page]

  const bottomNav = [
    { id: 'dashboard', label: 'Home', icon: '◈' },
    { id: 'calendar', label: 'Calendar', icon: '◻' },
    { id: 'history', label: 'History', icon: '☰' },
    { id: 'breakdown', label: 'Charts', icon: '◑' },
    { id: 'settings', label: 'Settings', icon: '⚙' },
  ]

  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const { theme, toggle: toggleTheme } = useTheme()

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <div className={styles.logo}>Sentimo</div>
          <NotificationBell data={data} profile={profile} />
        </div>
        {nav.map(n => (
          <div key={n.id}>
            {n.section && <div className={styles.navSection}>{n.section}</div>}
            <div className={`${styles.navItem} ${page === n.id ? styles.active : ''}`} onClick={() => setPage(n.id)}>
              <span className={styles.icon}>{n.icon}</span> {n.label}
            </div>
          </div>
        ))}
        <div className={styles.sidebarBottom}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>{getInitials(user.displayName || user.email)}</div>
            <div>
              <div className={styles.userName}>{user.displayName || 'User'}</div>
              <div className={styles.userEmail}>{user.email}</div>
            </div>
          </div>
          <button className={styles.btnLogout} onClick={() => signOut(auth)}>← Log out</button>
          <button className={styles.themeToggle} onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? '☀ Light mode' : '🌙 Dark mode'}
          </button>
        </div>
      </aside>
      <main className={styles.main}>
        <PageComponent user={user} data={data} profile={profile} symbol={symbol} />
      </main>

      {/* FLOATING QUICK ADD BUTTON */}
      <button className={styles.fab} onClick={() => setShowQuickAdd(true)} title="Quick add expense">−</button>

      {/* QUICK ADD MODAL */}
      {showQuickAdd && (
        <div className={styles.quickAddOverlay} onClick={e => { if (e.target === e.currentTarget) setShowQuickAdd(false) }}>
          <div className={styles.quickAddPanel}>
            <div className={styles.quickAddHeader}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--text)' }}>Quick Add</div>
              <button onClick={() => setShowQuickAdd(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 20, cursor: 'pointer', minWidth: 36, minHeight: 36 }}>✕</button>
            </div>
            <QuickAdd user={user} symbol={symbol} onClose={() => setShowQuickAdd(false)} />
          </div>
        </div>
      )}

      <nav className={styles.bottomNav}>
        {bottomNav.map(n => (
          <button key={n.id} className={`${styles.bottomNavItem} ${page === n.id ? styles.active : ''}`} onClick={() => setPage(n.id)}>
            <span className={styles.bottomNavIcon}>{n.icon}</span>
            <span className={styles.bottomNavLabel}>{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
