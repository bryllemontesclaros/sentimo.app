import { useState, useMemo } from 'react'
import { fsAdd, fsDel, fsUpdate } from '../lib/firestore'
import { fmt, today } from '../lib/utils'
import styles from './Page.module.css'
import bStyles from './Budget.module.css'

const EXPENSE_CATS = ['Food & Dining','Transport','Shopping','Health','Entertainment','Personal Care','Education','Bills','Other']

export default function Budget({ user, data, symbol }) {
  const s = symbol || '₱'
  const now = new Date()
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [form, setForm] = useState({ cat: 'Food & Dining', limit: '' })
  const budgets = data.budgets || []

  const ym = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`
  const monthLabel = new Date(viewYear, viewMonth).toLocaleString('default', { month: 'long', year: 'numeric' })

  function prevMonth() { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) } else setViewMonth(m => m - 1) }
  function nextMonth() { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) } else setViewMonth(m => m + 1) }

  // Spending per category this month
  const spending = useMemo(() => {
    const map = {}
    data.expenses.filter(t => t.date?.startsWith(ym)).forEach(t => {
      map[t.cat] = (map[t.cat] || 0) + (t.amount || 0)
    })
    return map
  }, [data.expenses, ym])

  const totalExpenses = Object.values(spending).reduce((s, v) => s + v, 0)
  const totalBudget = budgets.reduce((s, b) => s + (b.limit || 0), 0)
  const totalRemaining = totalBudget - totalExpenses

  async function handleAddBudget() {
    if (!form.cat || !form.limit) return alert('Please fill all fields')
    const existing = budgets.find(b => b.cat === form.cat)
    if (existing) {
      await fsUpdate(user.uid, 'budgets', existing._id, { limit: parseFloat(form.limit) })
    } else {
      await fsAdd(user.uid, 'budgets', { cat: form.cat, limit: parseFloat(form.limit) })
    }
    setForm(f => ({ ...f, limit: '' }))
  }

  async function handleDelBudget(id) { await fsDel(user.uid, 'budgets', id) }

  // Build budget items — set budgets + unbudgeted spending
  const budgetItems = useMemo(() => {
    const items = budgets.map(b => {
      const spent = spending[b.cat] || 0
      const remaining = b.limit - spent
      const pct = Math.min(100, Math.round((spent / b.limit) * 100))
      const status = pct >= 100 ? 'over' : pct >= 80 ? 'warning' : 'ok'
      return { ...b, spent, remaining, pct, status }
    })
    return items.sort((a, b) => b.pct - a.pct)
  }, [budgets, spending])

  // Unbudgeted spending
  const unbudgeted = useMemo(() => {
    const budgetedCats = new Set(budgets.map(b => b.cat))
    const map = {}
    data.expenses.filter(t => t.date?.startsWith(ym) && !budgetedCats.has(t.cat)).forEach(t => {
      map[t.cat] = (map[t.cat] || 0) + (t.amount || 0)
    })
    return Object.entries(map).map(([cat, amount]) => ({ cat, amount })).sort((a, b) => b.amount - a.amount)
  }, [data.expenses, budgets, ym])

  const statusColor = { ok: 'var(--accent)', warning: 'var(--amber)', over: 'var(--red)' }
  const statusBg = { ok: 'var(--accent-glow)', warning: 'var(--amber-dim)', over: 'var(--red-dim)' }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>Budget</div>
        <div className={styles.sub}>Set limits, track spending, stay on track</div>
      </div>

      {/* MONTH NAV */}
      <div className={bStyles.monthNav}>
        <button className={bStyles.navBtn} onClick={prevMonth}>←</button>
        <div className={bStyles.monthLabel}>{monthLabel}</div>
        <button className={bStyles.navBtn} onClick={nextMonth}>→</button>
      </div>

      {/* OVERVIEW */}
      <div className={styles.statsGrid} style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Total budget</div>
          <div className={`${styles.statVal} ${styles.blue}`}>{fmt(totalBudget, s)}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Spent</div>
          <div className={`${styles.statVal} ${styles.red}`}>{fmt(totalExpenses, s)}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Remaining</div>
          <div className={styles.statVal} style={{ color: totalRemaining >= 0 ? 'var(--accent)' : 'var(--red)' }}>{fmt(totalRemaining, s)}</div>
        </div>
      </div>

      {/* OVERALL PROGRESS */}
      {totalBudget > 0 && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>Overall budget usage</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
            <span style={{ color: 'var(--text2)' }}>{fmt(totalExpenses, s)} spent</span>
            <span style={{ color: 'var(--text3)' }}>{fmt(totalBudget, s)} budget</span>
          </div>
          <div style={{ height: 10, background: 'var(--surface3)', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, Math.round((totalExpenses / totalBudget) * 100))}%`,
              background: totalExpenses > totalBudget ? 'var(--red)' : totalExpenses / totalBudget > 0.8 ? 'var(--amber)' : 'var(--accent)',
              borderRadius: 5, transition: 'width 0.4s'
            }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6, textAlign: 'right' }}>
            {Math.min(100, Math.round((totalExpenses / totalBudget) * 100))}% used
          </div>
        </div>
      )}

      {/* SET BUDGET */}
      <div className={styles.formCard}>
        <div className={styles.cardTitle}>Set category budget</div>
        <div className={`${styles.formRow} ${styles.col3}`}>
          <div className={styles.formGroup}>
            <label>Category</label>
            <select value={form.cat} onChange={e => setForm(f => ({ ...f, cat: e.target.value }))}>
              {EXPENSE_CATS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Monthly limit ({s})</label>
            <input type="number" min="0" placeholder="e.g. 5000" value={form.limit} onChange={e => setForm(f => ({ ...f, limit: e.target.value }))} />
          </div>
          <div className={styles.formGroup} style={{ justifyContent: 'flex-end' }}>
            <button className={styles.btnAdd} style={{ width: '100%' }} onClick={handleAddBudget}>Set budget</button>
          </div>
        </div>
      </div>

      {/* BUDGET ITEMS */}
      {!budgetItems.length
        ? <div className={styles.empty}>No budgets set. Add a category budget above.</div>
        : budgetItems.map(b => (
          <div key={b._id} className={bStyles.budgetCard} style={{ borderColor: b.status === 'over' ? 'rgba(255,83,112,0.4)' : b.status === 'warning' ? 'rgba(255,179,71,0.3)' : 'var(--border)' }}>
            {/* ALERT BANNER */}
            {b.status === 'over' && (
              <div className={bStyles.alertBanner} style={{ background: 'var(--red-dim)', color: 'var(--red)' }}>
                ⚠ Over budget by {fmt(Math.abs(b.remaining), s)}
              </div>
            )}
            {b.status === 'warning' && (
              <div className={bStyles.alertBanner} style={{ background: 'var(--amber-dim)', color: 'var(--amber)' }}>
                ⚡ {fmt(b.remaining, s)} remaining — almost at limit
              </div>
            )}

            <div className={bStyles.budgetHeader}>
              <div className={bStyles.budgetCat}>{b.cat}</div>
              <div style={{ display: 'flex', align: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: statusColor[b.status] }}>{fmt(b.spent, s)}</span>
                <span style={{ color: 'var(--text3)', fontSize: 12 }}>/ {fmt(b.limit, s)}</span>
                <button className={styles.delBtn} onClick={() => handleDelBudget(b._id)}>✕</button>
              </div>
            </div>

            <div style={{ height: 8, background: 'var(--surface3)', borderRadius: 4, overflow: 'hidden', margin: '8px 0' }}>
              <div style={{
                height: '100%', width: `${b.pct}%`,
                background: statusColor[b.status],
                borderRadius: 4, transition: 'width 0.4s'
              }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text3)' }}>
              <span>{b.pct}% used</span>
              <span style={{ color: b.remaining >= 0 ? statusColor[b.status] : 'var(--red)', fontWeight: 600 }}>
                {b.remaining >= 0 ? fmt(b.remaining, s) + ' left' : 'Over by ' + fmt(Math.abs(b.remaining), s)}
              </span>
            </div>
          </div>
        ))}

      {/* UNBUDGETED */}
      {unbudgeted.length > 0 && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>Unbudgeted spending</div>
          {unbudgeted.map((u, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
              <span style={{ color: 'var(--text2)' }}>{u.cat}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--red)' }}>{fmt(u.amount, s)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
