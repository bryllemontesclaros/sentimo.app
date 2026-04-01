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
        </div>
      </aside>
      <div className={styles.mainWrap}>
        <header className={styles.topBar}>
          <div className={styles.topBarRight}>
            <button className={styles.themeBtn} onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
            <NotificationBell data={data} profile={profile} />
          </div>
        </header>
        <main className={styles.main}>
          <PageComponent user={user} data={data} profile={profile} symbol={symbol} />
        </main>
      </div>

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
