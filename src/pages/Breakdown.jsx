import { useState, useMemo } from 'react'
import { fmt } from '../lib/utils'
import styles from './Page.module.css'
import bStyles from './Breakdown.module.css'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const CAT_COLORS = {
  'Food & Dining': '#ff7043',
  'Transport': '#42a5f5',
  'Shopping': '#ab47bc',
  'Health': '#ef5350',
  'Entertainment': '#ff7043',
  'Personal Care': '#ec407a',
  'Education': '#26c6da',
  'Bills': '#ffb347',
  'Other': '#9090b0',
  'Salary': '#22d87a',
  'Freelance': '#6eb5ff',
  'Business': '#b48eff',
  'Investment': '#2dd4bf',
  '13th Month': '#22d87a',
  'Bonus': '#22d87a',
}

function getCatColor(cat) { return CAT_COLORS[cat] || '#9090b0' }

// Simple SVG Pie Chart
function PieChart({ data, size = 160 }) {
  if (!data.length) return <div className={bStyles.noData}>No data</div>
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <div className={bStyles.noData}>No data</div>

  const cx = size / 2, cy = size / 2, r = size / 2 - 8
  let angle = -Math.PI / 2
  const slices = data.map(d => {
    const sweep = (d.value / total) * 2 * Math.PI
    const x1 = cx + r * Math.cos(angle)
    const y1 = cy + r * Math.sin(angle)
    angle += sweep
    const x2 = cx + r * Math.cos(angle)
    const y2 = cy + r * Math.sin(angle)
    const large = sweep > Math.PI ? 1 : 0
    return { ...d, path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, pct: Math.round((d.value / total) * 100) }
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((sl, i) => (
        <path key={i} d={sl.path} fill={sl.color} opacity={0.9} />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.55} fill="var(--surface)" />
    </svg>
  )
}

// Simple bar chart
function BarChart({ months, income, expenses, symbol }) {
  const s = symbol || '₱'
  const max = Math.max(...income, ...expenses, 1)
  const barH = 80
  return (
    <div className={bStyles.barChart}>
      {months.map((m, i) => (
        <div key={i} className={bStyles.barGroup}>
          <div className={bStyles.bars}>
            <div className={bStyles.barIncome} style={{ height: `${(income[i] / max) * barH}px` }} title={`Income: ${fmt(income[i], s)}`} />
            <div className={bStyles.barExpense} style={{ height: `${(expenses[i] / max) * barH}px` }} title={`Expense: ${fmt(expenses[i], s)}`} />
          </div>
          <div className={bStyles.barLabel}>{m}</div>
        </div>
      ))}
    </div>
  )
}

export default function Breakdown({ data, symbol }) {
  const s = symbol || '₱'
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [tab, setTab] = useState('expenses') // 'expenses' | 'income'

  const ym = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`

  // Category breakdown for selected month
  const expenseCats = useMemo(() => {
    const map = {}
    data.expenses.filter(t => t.date?.startsWith(ym)).forEach(t => {
      map[t.cat] = (map[t.cat] || 0) + (t.amount || 0)
    })
    return Object.entries(map).map(([cat, value]) => ({ cat, value, color: getCatColor(cat) }))
      .sort((a, b) => b.value - a.value)
  }, [data.expenses, ym])

  const incomeCats = useMemo(() => {
    const map = {}
    data.income.filter(t => t.date?.startsWith(ym)).forEach(t => {
      map[t.cat] = (map[t.cat] || 0) + (t.amount || 0)
    })
    return Object.entries(map).map(([cat, value]) => ({ cat, value, color: getCatColor(cat) }))
      .sort((a, b) => b.value - a.value)
  }, [data.income, ym])

  const cats = tab === 'expenses' ? expenseCats : incomeCats
  const total = cats.reduce((s, c) => s + c.value, 0)

  // Monthly comparison — last 6 months
  const last6 = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      let m = viewMonth - 5 + i
      let y = viewYear
      while (m < 0) { m += 12; y-- }
      while (m > 11) { m -= 12; y++ }
      const ymStr = `${y}-${String(m + 1).padStart(2, '0')}`
      const inc = data.income.filter(t => t.date?.startsWith(ymStr)).reduce((s, t) => s + (t.amount || 0), 0)
      const exp = data.expenses.filter(t => t.date?.startsWith(ymStr)).reduce((s, t) => s + (t.amount || 0), 0)
      return { label: MONTHS[m], income: inc, expenses: exp, net: inc - exp }
    })
  }, [data, viewMonth, viewYear])

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const monthLabel = new Date(viewYear, viewMonth).toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>Spending Breakdown</div>
        <div className={styles.sub}>Where your money goes</div>
      </div>

      {/* MONTH NAV */}
      <div className={bStyles.monthNav}>
        <button className={bStyles.navBtn} onClick={prevMonth}>←</button>
        <div className={bStyles.monthLabel}>{monthLabel}</div>
        <button className={bStyles.navBtn} onClick={nextMonth}>→</button>
      </div>

      {/* TAB */}
      <div className={bStyles.tabRow}>
        <button className={`${bStyles.tabBtn} ${tab === 'expenses' ? bStyles.tabBtnActive : ''}`} onClick={() => setTab('expenses')}>Expenses</button>
        <button className={`${bStyles.tabBtn} ${tab === 'income' ? bStyles.tabBtnActive : ''}`} onClick={() => setTab('income')}>Income</button>
      </div>

      {/* PIE + LEGEND */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>
          {tab === 'expenses' ? 'Expense breakdown' : 'Income sources'}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: tab === 'expenses' ? 'var(--red)' : 'var(--accent)' }}>
            {tab === 'expenses' ? '−' : '+'}{fmt(total, s)}
          </span>
        </div>
        {!cats.length
          ? <div className={styles.empty}>No {tab} data for this month.</div>
          : (
            <div className={bStyles.pieSection}>
              <PieChart data={cats} size={160} />
              <div className={bStyles.legend}>
                {cats.map((c, i) => (
                  <div key={i} className={bStyles.legendItem}>
                    <div className={bStyles.legendDot} style={{ background: c.color }} />
                    <div className={bStyles.legendCat}>{c.cat}</div>
                    <div className={bStyles.legendVal} style={{ color: c.color }}>{fmt(c.value, s)}</div>
                    <div className={bStyles.legendPct}>{total ? Math.round((c.value / total) * 100) : 0}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>

      {/* MONTHLY BAR CHART */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>
          Last 6 months
          <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, background: 'var(--accent)', borderRadius: 2, display: 'inline-block' }} />Income</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, background: 'var(--red)', borderRadius: 2, display: 'inline-block' }} />Expenses</span>
          </div>
        </div>
        <BarChart months={last6.map(m => m.label)} income={last6.map(m => m.income)} expenses={last6.map(m => m.expenses)} symbol={s} />
        <div className={bStyles.monthSummary}>
          {last6.map((m, i) => (
            <div key={i} className={bStyles.monthSummaryItem}>
              <div className={bStyles.monthSummaryLabel}>{m.label}</div>
              <div className={bStyles.monthSummaryNet} style={{ color: m.net >= 0 ? 'var(--accent)' : 'var(--red)' }}>
                {m.net >= 0 ? '+' : ''}{fmt(m.net, s)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TOP SPENDING CATEGORIES */}
      {expenseCats.length > 0 && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>Top spending categories</div>
          {expenseCats.slice(0, 5).map((c, i) => {
            const pct = total ? Math.round((c.value / total) * 100) : 0
            return (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                    <span style={{ color: 'var(--text)' }}>{c.cat}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ color: 'var(--text3)', fontSize: 12 }}>{pct}%</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--red)', fontSize: 13 }}>{fmt(c.value, s)}</span>
                  </div>
                </div>
                <div style={{ height: 5, background: 'var(--surface3)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: c.color, borderRadius: 3, transition: 'width 0.4s' }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
