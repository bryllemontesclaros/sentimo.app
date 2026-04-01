import { useState } from 'react'
import { fsAdd } from '../lib/firestore'
import { fmt, today } from '../lib/utils'
import styles from './Page.module.css'
import calStyles from './Calendar.module.css'

export default function Calendar({ user, data }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selected, setSelected] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ desc: '', amount: '', type: 'income', cat: 'Salary', recur: '' })

  const todayStr = today()
  const label = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevDays = new Date(year, month, 0).getDate()

  function prev() { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  function next() { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  function dateStr(d) { return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` }

  function getDayTx(d) {
    const ds = dateStr(d)
    return {
      income: data.income.filter(t => t.date === ds),
      expenses: data.expenses.filter(t => t.date === ds),
      bills: data.bills.filter(t => t.due === d),
    }
  }

  async function handleAdd() {
    if (!form.desc || !form.amount) return alert('Please fill all fields')
    const col = form.type === 'income' ? 'income' : 'expenses'
    await fsAdd(user.uid, col, { ...form, amount: parseFloat(form.amount), date: selected, type: form.type })
    setForm(f => ({ ...f, desc: '', amount: '' }))
    setShowModal(false)
  }

  const selectedTx = selected ? [...(data.income.filter(t => t.date === selected)), ...(data.expenses.filter(t => t.date === selected))] : []

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>Calendar</div>
        <div className={styles.sub}>Click any day to view or add transactions</div>
      </div>
      <div className={styles.card}>
        <div className={calStyles.calHeader}>
          <div className={calStyles.nav}>
            <button className={calStyles.navBtn} onClick={prev}>← Prev</button>
            <div className={calStyles.monthLabel}>{label}</div>
            <button className={calStyles.navBtn} onClick={next}>Next →</button>
          </div>
          <button className={styles.btnAdd} style={{ width: 'auto', padding: '8px 18px' }} onClick={() => { setSelected(todayStr); setShowModal(true) }}>+ Add transaction</button>
        </div>

        <div className={calStyles.dayNames}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className={calStyles.dayName}>{d}</div>)}
        </div>

        <div className={calStyles.grid}>
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={`prev-${i}`} className={`${calStyles.cell} ${calStyles.otherMonth}`}>
              <div className={calStyles.dateNum}>{prevDays - firstDay + 1 + i}</div>
            </div>
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const d = i + 1
            const ds = dateStr(d)
            const { income, expenses, bills } = getDayTx(d)
            const total = income.reduce((s, t) => s + (t.amount || 0), 0) - expenses.reduce((s, t) => s + (t.amount || 0), 0)
            const hasAny = income.length || expenses.length
            return (
              <div key={d} className={`${calStyles.cell} ${ds === todayStr ? calStyles.today : ''} ${selected === ds ? calStyles.selectedCell : ''}`} onClick={() => setSelected(ds)}>
                <div className={calStyles.dateNum}>{d}</div>
                <div className={calStyles.dots}>
                  {income.length > 0 && <div className={`${calStyles.dot} ${calStyles.dotIncome}`} />}
                  {expenses.length > 0 && <div className={`${calStyles.dot} ${calStyles.dotExpense}`} />}
                  {bills.length > 0 && <div className={`${calStyles.dot} ${calStyles.dotBill}`} />}
                </div>
                {hasAny && <div className={calStyles.amount}>{total >= 0 ? '+' : ''}{fmt(total)}</div>}
              </div>
            )
          })}
          {Array.from({ length: (7 - (firstDay + daysInMonth) % 7) % 7 }, (_, i) => (
            <div key={`next-${i}`} className={`${calStyles.cell} ${calStyles.otherMonth}`}>
              <div className={calStyles.dateNum}>{i + 1}</div>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>
            {selected}
            <button className={styles.btnAdd} style={{ width: 'auto', padding: '6px 14px', fontSize: 12 }} onClick={() => setShowModal(true)}>+ Add</button>
          </div>
          {!selectedTx.length
            ? <div className={styles.empty}>No transactions on this day.</div>
            : selectedTx.map(t => (
              <div key={t._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: t.type === 'income' ? 'var(--accent-glow)' : 'var(--red-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.type === 'income' ? 'var(--accent)' : 'var(--red)' }}>{t.type === 'income' ? '↑' : '↓'}</div>
                  <div><div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{t.desc}</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>{t.cat}</div></div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: t.type === 'income' ? 'var(--accent)' : 'var(--red)' }}>{t.type === 'income' ? '+' : '-'}{fmt(t.amount)}</div>
              </div>
            ))}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', width: '100%', maxWidth: 480 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--text)' }}>Add transaction — {selected}</div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div className={`${styles.formRow} ${styles.col2}`}>
              <div className={styles.formGroup}><label>Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div className={styles.formGroup}><label>Category</label>
                <select value={form.cat} onChange={e => setForm(f => ({ ...f, cat: e.target.value }))}>
                  {['Salary','Freelance','Food & Dining','Transport','Shopping','Bills','Health','Other'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div className={`${styles.formRow} ${styles.col2}`}>
              <div className={styles.formGroup}><label>Description</label><input placeholder="What is this?" value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} /></div>
              <div className={styles.formGroup}><label>Amount (₱)</label><input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: '1.25rem' }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '9px', background: 'none', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAdd} className={styles.btnAdd} style={{ flex: 2 }}>Save transaction</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
