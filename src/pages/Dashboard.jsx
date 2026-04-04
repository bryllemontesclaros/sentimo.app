import { useMemo } from 'react'
import { fmt, today } from '../lib/utils'
import { buildForecast, getEndOfMonthBalance } from '../lib/forecast'
import { getProjectedTransactions } from '../lib/recurrence'
import styles from './Page.module.css'
import dStyles from './Dashboard.module.css'

const TYPE_COLOR = { income: 'var(--accent)', expense: 'var(--red)' }
const TYPE_SIGN = { income: '+', expense: '−' }
const TYPE_BG = { income: 'var(--accent-glow)', expense: 'var(--red-dim)' }

export default function Dashboard({ user, data, profile, symbol }) {
  const s = symbol || '₱'
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const todayStr = today()
  const ym = `${year}-${String(month + 1).padStart(2, '0')}`
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening'
  const name = user?.displayName?.split(' ')[0] || 'there'

  // This month income & expenses
  const mIncome = useMemo(() =>
    data.income.filter(t => t.date?.startsWith(ym)).reduce((s, t) => s + (t.amount || 0), 0),
    [data.income, ym])
  const mExpense = useMemo(() =>
    data.expenses.filter(t => t.date?.startsWith(ym)).reduce((s, t) => s + (t.amount || 0), 0),
    [data.expenses, ym])
  const mNet = mIncome - mExpense

  // Last month comparison
  let lm = month - 1, ly = year
  if (lm < 0) { lm = 11; ly-- }
  const lym = `${ly}-${String(lm + 1).padStart(2, '0')}`
  const lmExpense = useMemo(() =>
    data.expenses.filter(t => t.date?.startsWith(lym)).reduce((s, t) => s + (t.amount || 0), 0),
    [data.expenses, lym])
  const expenseChange = lmExpense > 0 ? Math.round(((mExpense - lmExpense) / lmExpense) * 100) : null

  // Total net worth
  const netWorth = data.accounts.reduce((s, a) => s + (a.balance || 0), 0)

  // Budget health
  const budgetHealth = useMemo(() => {
    const spending = {}
    data.expenses.filter(t => t.date?.startsWith(ym)).forEach(t => {
      spending[t.cat] = (spending[t.cat] || 0) + (t.amount || 0)
    })
    let ok = 0, warning = 0, over = 0
    data.budgets.forEach(b => {
      const pct = (spending[b.cat] || 0) / b.limit
      if (pct >= 1) over++
      else if (pct >= 0.8) warning++
      else ok++
    })
    return { ok, warning, over, total: data.budgets.length }
  }, [data.budgets, data.expenses, ym])

  // Savings goals
  const savingsTotal = data.goals.reduce((s, g) => s + (g.current || 0), 0)
  const savingsTarget = data.goals.reduce((s, g) => s + (g.target || 0), 0)
  const savingsPct = savingsTarget > 0 ? Math.min(100, Math.round((savingsTotal / savingsTarget) * 100)) : 0

  // Forecast — end of month
  const projected = useMemo(() =>
    getProjectedTransactions(data.income, data.expenses, year, month),
    [data.income, data.expenses, year, month])
  const allIncome = useMemo(() => [
    ...data.income.filter(t => t.date?.startsWith(ym)),
    ...projected.filter(t => t.type === 'income'),
  ], [data.income, projected, ym])
  const allExpenses = useMemo(() => [
    ...data.expenses.filter(t => t.date?.startsWith(ym)),
    ...projected.filter(t => t.type === 'expense'),
  ], [data.expenses, projected, ym])
  const baseBalance = data.accounts.reduce((s, a) => s + (a.balance || 0), 0)
  const forecastMap = useMemo(() => buildForecast(allIncome, allExpenses, year, month, baseBalance), [allIncome, allExpenses, year, month, baseBalance])
  const eomBalance = getEndOfMonthBalance(forecastMap)

  // Recent transactions — last 5
  const recent = useMemo(() => {
    const all = [
      ...data.income.map(t => ({ ...t, txType: 'income' })),
      ...data.expenses.map(t => ({ ...t, txType: 'expense' })),
    ].filter(t => t.date).sort((a, b) => b.date.localeCompare(a.date))
    return all.slice(0, 5)
  }, [data.income, data.expenses])

  // Top expense category this month
  const topCat = useMemo(() => {
    const map = {}
    data.expenses.filter(t => t.date?.startsWith(ym)).forEach(t => {
      map[t.cat] = (map[t.cat] || 0) + (t.amount || 0)
    })
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1])
    return sorted[0] || null
  }, [data.expenses, ym])

  return (
    <div className={styles.page}>
      {/* GREETING */}
      <div className={dStyles.greeting}>
        <div className={dStyles.greetingText}>
          <span className={dStyles.greetingHi}>{greeting}, {name} 👋</span>
          <span className={dStyles.greetingDate}>{now.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* NET WORTH HERO */}
      <div className={dStyles.heroCard}>
        <div className={dStyles.heroLabel}>Total net worth</div>
        <div className={dStyles.heroVal}>{fmt(netWorth, s)}</div>
        <div className={dStyles.heroSub}>{data.accounts.length} account{data.accounts.length !== 1 ? 's' : ''}</div>
      </div>

      {/* THIS MONTH STATS */}
      <div className={dStyles.statsRow}>
        <div className={dStyles.statBox}>
          <div className={dStyles.statBoxLabel}>Income</div>
          <div className={dStyles.statBoxVal} style={{ color: 'var(--accent)' }}>+{fmt(mIncome, s)}</div>
        </div>
        <div className={dStyles.statBox}>
          <div className={dStyles.statBoxLabel}>Expenses</div>
          <div className={dStyles.statBoxVal} style={{ color: 'var(--red)' }}>−{fmt(mExpense, s)}</div>
          {expenseChange !== null && (
            <div className={dStyles.statBoxChange} style={{ color: expenseChange > 0 ? 'var(--red)' : 'var(--accent)' }}>
              {expenseChange > 0 ? '↑' : '↓'} {Math.abs(expenseChange)}% vs last month
            </div>
          )}
        </div>
        <div className={dStyles.statBox}>
          <div className={dStyles.statBoxLabel}>Net</div>
          <div className={dStyles.statBoxVal} style={{ color: mNet >= 0 ? 'var(--blue)' : 'var(--red)' }}>
            {mNet >= 0 ? '+' : ''}{fmt(mNet, s)}
          </div>
        </div>
      </div>

      {/* FORECAST + BUDGET ROW */}
      <div className={dStyles.twoCol}>
        {/* END OF MONTH FORECAST */}
        <div className={dStyles.miniCard}>
          <div className={dStyles.miniLabel}>End of month forecast</div>
          <div className={dStyles.miniVal} style={{ color: eomBalance >= 0 ? 'var(--accent)' : 'var(--red)' }}>
            {fmt(eomBalance, s)}
          </div>
          <div className={dStyles.miniSub} style={{ color: eomBalance >= 0 ? 'var(--accent)' : 'var(--red)' }}>
            {eomBalance >= 0 ? 'Projected surplus' : 'Projected deficit'}
          </div>
        </div>

        {/* BUDGET HEALTH */}
        <div className={dStyles.miniCard}>
          <div className={dStyles.miniLabel}>Budget health</div>
          {budgetHealth.total === 0 ? (
            <div className={dStyles.miniSub} style={{ marginTop: 8 }}>No budgets set</div>
          ) : (
            <>
              <div className={dStyles.budgetDots}>
                {budgetHealth.ok > 0 && <span className={dStyles.budgetDot} style={{ background: 'var(--accent)' }}>{budgetHealth.ok} ok</span>}
                {budgetHealth.warning > 0 && <span className={dStyles.budgetDot} style={{ background: 'var(--amber)' }}>{budgetHealth.warning} near</span>}
                {budgetHealth.over > 0 && <span className={dStyles.budgetDot} style={{ background: 'var(--red)' }}>{budgetHealth.over} over</span>}
              </div>
              <div className={dStyles.miniSub}>
                {budgetHealth.over > 0 ? `${budgetHealth.over} budget${budgetHealth.over > 1 ? 's' : ''} exceeded` : budgetHealth.warning > 0 ? 'Some budgets nearing limit' : 'All budgets on track'}
              </div>
            </>
          )}
        </div>
      </div>

      {/* SAVINGS GOALS */}
      {data.goals.length > 0 && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>
            Savings goals
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)' }}>{savingsPct}% funded</span>
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5, color: 'var(--text3)' }}>
              <span>{fmt(savingsTotal, s)} saved</span>
              <span>{fmt(savingsTarget, s)} target</span>
            </div>
            <div style={{ height: 8, background: 'var(--surface3)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${savingsPct}%`, background: 'var(--accent)', borderRadius: 4, transition: 'width 0.5s' }} />
            </div>
          </div>
          {data.goals.slice(0, 3).map(g => {
            const pct = Math.min(100, Math.round(((g.current || 0) / (g.target || 1)) * 100))
            return (
              <div key={g._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderTop: '1px solid var(--border)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', marginBottom: 3 }}>{g.name}</div>
                  <div style={{ height: 4, background: 'var(--surface3)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? 'var(--accent)' : 'var(--blue)', borderRadius: 2 }} />
                  </div>
                </div>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)', flexShrink: 0 }}>{pct}%</div>
              </div>
            )
          })}
        </div>
      )}

      {/* TOP SPENDING + RECENT */}
      <div className={dStyles.twoCol}>
        {/* TOP CATEGORY */}
        {topCat && (
          <div className={dStyles.miniCard}>
            <div className={dStyles.miniLabel}>Top expense</div>
            <div className={dStyles.miniCat}>{topCat[0]}</div>
            <div className={dStyles.miniVal} style={{ color: 'var(--red)', fontSize: 16 }}>{fmt(topCat[1], s)}</div>
          </div>
        )}

        {/* SAVINGS RATE */}
        <div className={dStyles.miniCard}>
          <div className={dStyles.miniLabel}>Savings rate</div>
          <div className={dStyles.miniVal} style={{ color: mIncome > 0 && mNet > 0 ? 'var(--accent)' : 'var(--text3)' }}>
            {mIncome > 0 ? `${Math.max(0, Math.round((mNet / mIncome) * 100))}%` : '—'}
          </div>
          <div className={dStyles.miniSub}>of income this month</div>
        </div>
      </div>

      {/* RECENT TRANSACTIONS */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Recent transactions</div>
        {!recent.length ? (
          <div className={styles.empty}>No transactions yet.</div>
        ) : recent.map((t, i) => (
          <div key={t._id + i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: TYPE_BG[t.txType], color: TYPE_COLOR[t.txType], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
              {TYPE_SIGN[t.txType]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.desc}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{t.cat} · {t.date}</div>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: TYPE_COLOR[t.txType], flexShrink: 0 }}>
              {TYPE_SIGN[t.txType]}{fmt(t.amount, s)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
