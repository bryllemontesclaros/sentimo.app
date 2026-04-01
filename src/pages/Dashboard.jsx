import { fmt } from '../lib/utils'
import styles from './Page.module.css'

export default function Dashboard({ data }) {
  const now = new Date()
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthIncome = data.income.filter(t => t.date?.startsWith(ym)).reduce((s, t) => s + (t.amount || 0), 0)
  const monthExpense = data.expenses.filter(t => t.date?.startsWith(ym)).reduce((s, t) => s + (t.amount || 0), 0)
  const net = monthIncome - monthExpense
  const rate = monthIncome ? Math.round((net / monthIncome) * 100) : 0
  const all = [...data.income, ...data.expenses].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 6)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>Dashboard</div>
        <div className={styles.sub}>{now.toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.stat}><div className={styles.statLabel}>Total Income</div><div className={`${styles.statVal} ${styles.green}`}>{fmt(monthIncome)}</div><div className={styles.statChange}>This month</div></div>
        <div className={styles.stat}><div className={styles.statLabel}>Total Expenses</div><div className={`${styles.statVal} ${styles.red}`}>{fmt(monthExpense)}</div><div className={styles.statChange}>This month</div></div>
        <div className={styles.stat}><div className={styles.statLabel}>Net Balance</div><div className={`${styles.statVal}`} style={{ color: net >= 0 ? 'var(--blue)' : 'var(--red)' }}>{fmt(net)}</div><div className={styles.statChange}>Income − Expenses</div></div>
        <div className={styles.stat}><div className={styles.statLabel}>Savings Rate</div><div className={`${styles.statVal} ${styles.amber}`}>{rate}%</div><div className={styles.statChange}>Of income saved</div></div>
      </div>

      <div className={styles.twoCol}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Recent transactions</div>
          {!all.length
            ? <div className={styles.empty}>No transactions yet</div>
            : all.map(t => (
              <div key={t._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: t.type === 'income' ? 'var(--accent-glow)' : 'var(--red-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{t.type === 'income' ? '↑' : '↓'}</div>
                  <div><div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{t.desc}</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>{t.date}</div></div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: t.type === 'income' ? 'var(--accent)' : 'var(--red)' }}>{t.type === 'income' ? '+' : '-'}{fmt(t.amount)}</div>
              </div>
            ))}
        </div>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Savings goals</div>
          {!data.goals.length
            ? <div className={styles.empty}>No goals yet</div>
            : data.goals.slice(0, 3).map(g => {
              const pct = Math.min(100, Math.round(((g.current || 0) / (g.target || 1)) * 100))
              return (
                <div key={g._id} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text)' }}>{g.name}</span>
                    <span style={{ color: 'var(--text3)' }}>{pct}%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--surface3)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 3 }} />
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
