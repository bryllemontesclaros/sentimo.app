import { fmt } from '../lib/utils'
import styles from './Page.module.css'

export default function Dashboard({ data, profile, symbol }) {
  const now = new Date()
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const s = symbol || '₱'

  const monthIncome = data.income.filter(t => t.date?.startsWith(ym)).reduce((s, t) => s + (t.amount || 0), 0)
  const monthExpense = data.expenses.filter(t => t.date?.startsWith(ym)).reduce((s, t) => s + (t.amount || 0), 0)
  const net = monthIncome - monthExpense
  const rate = monthIncome ? Math.round((net / monthIncome) * 100) : 0

  const profileSalary = profile?.salary ? parseFloat(profile.salary) : null
  const monthlySalary = profileSalary || data.income
    .filter(t => t.date?.startsWith(ym) && t.cat === 'Salary')
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const savingsTotal = data.goals.reduce((s, g) => s + (g.current || 0), 0)
  const all = [...data.income, ...data.expenses]
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 6)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>Dashboard</div>
        <div className={styles.sub}>{now.toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
      </div>

      {/* Row 1 */}
      <div className={styles.statsGrid}>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Total Income</div>
          <div className={`${styles.statVal} ${styles.green}`}>{fmt(monthIncome, s)}</div>
          <div className={styles.statChange}>This month</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Total Expenses</div>
          <div className={`${styles.statVal} ${styles.red}`}>{fmt(monthExpense, s)}</div>
          <div className={styles.statChange}>This month</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Net Balance</div>
          <div className={styles.statVal} style={{ color: net >= 0 ? 'var(--blue)' : 'var(--red)' }}>{fmt(net, s)}</div>
          <div className={styles.statChange}>Income − Expenses</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Savings Rate</div>
          <div className={`${styles.statVal} ${styles.amber}`}>{rate}%</div>
          <div className={styles.statChange}>Of income saved</div>
        </div>
      </div>

      {/* Row 2 */}
      <div className={styles.statsGrid} style={{ marginBottom: '1.5rem' }}>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Monthly Salary</div>
          <div className={`${styles.statVal} ${styles.green}`}>
            {profileSalary ? fmt(profileSalary, s) : fmt(monthlySalary, s)}
          </div>
          <div className={styles.statChange}>
            {profileSalary
              ? profile.paySchedule ? profile.paySchedule.replace(/-/g, ' ') : 'From profile'
              : 'From salary entries'}
          </div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Total Savings</div>
          <div className={`${styles.statVal} ${styles.blue}`}>{fmt(savingsTotal, s)}</div>
          <div className={styles.statChange}>Across all goals</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Active Goals</div>
          <div className={styles.statVal} style={{ color: 'var(--purple)' }}>{data.goals.length}</div>
          <div className={styles.statChange}>Savings goals</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Bills This Month</div>
          <div className={`${styles.statVal} ${styles.amber}`}>{fmt(data.bills.reduce((sum, b) => sum + (b.amount || 0), 0), s)}</div>
          <div className={styles.statChange}>{data.bills.filter(b => b.paid).length}/{data.bills.length} paid</div>
        </div>
      </div>

      {!profileSalary && (
        <div style={{ background: 'var(--amber-dim)', border: '1px solid var(--amber)', borderRadius: 'var(--radius-sm)', padding: '10px 16px', fontSize: 13, color: 'var(--amber)', marginBottom: '1.5rem' }}>
          Set your monthly salary in <strong>Settings → Salary Profile</strong> for more accurate tracking.
        </div>
      )}

      <div className={styles.twoCol}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Recent transactions</div>
          {!all.length
            ? <div className={styles.empty}>No transactions yet</div>
            : all.map(t => (
              <div key={t._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: t.type === 'income' ? 'var(--accent-glow)' : 'var(--red-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                    {t.type === 'income' ? '↑' : '↓'}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{t.desc}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{t.date} · {t.cat}</div>
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: t.type === 'income' ? 'var(--accent)' : 'var(--red)' }}>
                  {t.type === 'income' ? '+' : '-'}{fmt(t.amount, s)}
                </div>
              </div>
            ))}
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Savings goals</div>
          {!data.goals.length
            ? <div className={styles.empty}>No goals yet</div>
            : data.goals.slice(0, 4).map(g => {
              const pct = Math.min(100, Math.round(((g.current || 0) / (g.target || 1)) * 100))
              return (
                <div key={g._id} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text)' }}>{g.name}</span>
                    <span style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{fmt(g.current || 0, s)} / {fmt(g.target, s)}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--surface3)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct >= 80 ? 'var(--amber)' : 'var(--accent)', borderRadius: 3, transition: 'width 0.4s ease' }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{pct}% complete</div>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
