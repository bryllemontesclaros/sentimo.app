import { useState, useEffect } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { listenCol } from '../lib/firestore'
import { getInitials } from '../lib/utils'
import Dashboard from './Dashboard'
import Calendar from './Calendar'
import Income from './Income'
import Expenses from './Expenses'
import Bills from './Bills'
import Savings from './Savings'
import Settings from './Settings'
import styles from './AppShell.module.css'

export default function AppShell({ user }) {
  const [page, setPage] = useState('dashboard')
  const [data, setData] = useState({ income: [], expenses: [], bills: [], goals: [] })

  useEffect(() => {
    if (!user) return
    const uid = user.uid
    const unsubs = [
      listenCol(uid, 'income', rows => setData(d => ({ ...d, income: rows }))),
      listenCol(uid, 'expenses', rows => setData(d => ({ ...d, expenses: rows }))),
      listenCol(uid, 'bills', rows => setData(d => ({ ...d, bills: rows }))),
      listenCol(uid, 'goals', rows => setData(d => ({ ...d, goals: rows }))),
    ]
    return () => unsubs.forEach(u => u())
  }, [user])

  const nav = [
    { id: 'dashboard', label: 'Dashboard', icon: '◈', section: 'Overview' },
    { id: 'calendar', label: 'Calendar', icon: '◻', section: null },
    { id: 'income', label: 'Income', icon: '↑', section: 'Tracker' },
    { id: 'expenses', label: 'Expenses', icon: '↓', section: null },
    { id: 'bills', label: 'Bills', icon: '◷', section: null },
    { id: 'savings', label: 'Savings Goals', icon: '◎', section: null },
    { id: 'settings', label: 'Settings', icon: '⚙', section: 'Account' },
  ]

  const pages = { dashboard: Dashboard, calendar: Calendar, income: Income, expenses: Expenses, bills: Bills, savings: Savings, settings: Settings }
  const PageComponent = pages[page]

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>Sentimo</div>
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
      <main className={styles.main}>
        <PageComponent user={user} data={data} />
      </main>
    </div>
  )
}
