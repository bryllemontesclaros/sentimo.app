import { useEffect, useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { listenCol, listenProfile } from '../lib/firestore'
import { getInitials, getCurrencySymbol } from '../lib/utils'
import Calendar from './Calendar'
import Savings from './Savings'
import Accounts from './Accounts'
import Breakdown from './Breakdown'
import Budget from './Budget'
import Settings from './Settings'
import History from './History'
import { useTheme } from '../lib/theme.jsx'
import NotificationBell from '../components/NotificationBell'
import styles from './AppShell.module.css'

const NAV_ICONS = {
  calendar: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  breakdown: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  budget: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  savings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ),
  accounts: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
    </svg>
  ),
  settings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
}

export default function AppShell({ user }) {
  const [page, setPage] = useState('calendar')
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
    { id: 'calendar', label: 'Calendar', icon: '◻', section: 'Track' },
    { id: 'history', label: 'History', icon: '☰', section: null },
    { id: 'breakdown', label: 'Breakdown', icon: '◑', section: 'Analyse' },
    { id: 'budget', label: 'Budget', icon: '◎', section: null },
    { id: 'accounts', label: 'Accounts', icon: '◉', section: null },
    { id: 'savings', label: 'Savings Goals', icon: '◆', section: null },
    { id: 'settings', label: 'Settings', icon: '⚙', section: 'Account' },
  ]

  const pages = { calendar: Calendar, history: History, savings: Savings, accounts: Accounts, breakdown: Breakdown, budget: Budget, settings: Settings }
  const PageComponent = pages[page] || Calendar

  const bottomNav = [
    { id: 'calendar', label: 'Calendar', iconKey: 'calendar' },
    { id: 'breakdown', label: 'Charts', iconKey: 'breakdown' },
    { id: 'budget', label: 'Budget', iconKey: 'budget' },
    { id: 'accounts', label: 'Accounts', iconKey: 'accounts' },
    { id: 'settings', label: 'Settings', iconKey: 'settings' },
  ]

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
          <div className={styles.topBarLogo}>Sentimo</div>
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
      <nav className={styles.bottomNav}>
        {bottomNav.map(n => (
          <button key={n.id} className={`${styles.bottomNavItem} ${page === n.id ? styles.active : ''}`} onClick={() => setPage(n.id)}>
            <span className={styles.bottomNavIcon}>{NAV_ICONS[n.iconKey]}</span>
            <span className={styles.bottomNavLabel}>{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
