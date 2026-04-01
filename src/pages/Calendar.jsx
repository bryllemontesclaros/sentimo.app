import { useState } from 'react'
import { fsAdd, fsDel, fsUpdate } from '../lib/firestore'
import { fmt, today, RECUR_OPTIONS } from '../lib/utils'
import styles from './Page.module.css'
import calStyles from './Calendar.module.css'

const CATS_INCOME = ['Salary','Freelance','Business','Investment','13th Month','Bonus','Other']
const CATS_EXPENSE = ['Food & Dining','Transport','Shopping','Health','Entertainment','Personal Care','Bills','Education','Other']
const EMPTY_FORM = { desc: '', amount: '', type: 'income', cat: 'Salary', recur: '' }

export default function Calendar({ user, data, symbol }) {
  const s = symbol || '₱'
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selected, setSelected] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editTx, setEditTx] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const todayStr = today()
  const label = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevDays = new Date(year, month, 0).getDate()

  function prev() { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  function next() { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  function set(k, v) {
    setForm(f => {
      const updated = { ...f, [k]: v }
      if (k === 'type') updated.cat = v === 'income' ? 'Salary' : 'Food & Dining'
      return updated
    })
  }

  function dateStr(d) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  function getDayTx(d) {
    const ds = dateStr(d)
    return {
      income: data.income.filter(t => t.date === ds),
      expenses: data.expenses.filter(t => t.date === ds),
      bills: data.bills.filter(t => t.due === d),
    }
  }

  function openAdd(date) {
    setEditTx(null)
    setForm({ ...EMPTY_FORM })
    setSelected(date)
    setShowModal(true)
  }

  function openEdit(tx) {
    setEditTx(tx)
    setForm({ desc: tx.desc || '', amount: tx.amount || '', type: tx.type || 'income', cat: tx.cat || '', recur: tx.recur || '' })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.desc || !form.amount) return alert('Please fill all fields')
    if (editTx) {
      const origCol = editTx.type === 'income' ? 'income' : 'expenses'
      await fsUpdate(user.uid, origCol, editTx._id, { desc: form.desc, amount: parseFloat(form.amount), cat: form.cat, recur: form.recur })
    } else {
      const col = form.type === 'income' ? 'income' : 'expenses'
      await fsAdd(user.uid, col, { desc: form.desc, amount: parseFloat(form.amount), date: selected, cat: form.cat, recur: form.recur, type: form.type })
    }
    setShowModal(false); setEditTx(null); setForm(EMPTY_FORM)
  }

  async function handleDelete(tx) {
    const col = tx.type === 'income' ? 'income' : 'expenses'
    await fsDel(user.uid, col, tx._id)
  }

  const selectedTx = selected
    ? [...data.income.filter(t => t.date === selected), ...data.expenses.filter(t => t.date === selected)]
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
    : []

  const cats = form.type === 'income' ? CATS_INCOME : CATS_EXPENSE

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>Calendar</div>
        <div className={styles.sub}>Click a day to view · Double-click to add</div>
      </div>

      <div className={styles.card}>
        <div className={calStyles.calHeader}>
          <div className={calStyles.nav}>
            <button className={calStyles.navBtn} onClick={prev}>← Prev</button>
            <div className={calStyles.monthLabel}>{label}</div>
            <button className={calStyles.navBtn} onClick={next}>Next →</button>
          </div>
          <button className={styles.btnAdd} style={{ width: 'auto', padding: '8px 18px' }} onClick={() => openAdd(todayStr)}>+ Add transaction</button>
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
              <div key={d}
                className={`${calStyles.cell} ${ds === todayStr ? calStyles.today : ''} ${selected === ds ? calStyles.selectedCell : ''}`}
                onClick={() => setSelected(ds)}
                onDoubleClick={() => openAdd(ds)}
              >
                <div className={calStyles.dateNum}>{d}</div>
                <div className={calStyles.dots}>
                  {income.length > 0 && <div className={`${calStyles.dot} ${calStyles.dotIncome}`} />}
                  {expenses.length > 0 && <div className={`${calStyles.dot} ${calStyles.dotExpense}`} />}
                  {bills.length > 0 && <div className={`${calStyles.dot} ${calStyles.dotBill}`} />}
                </div>
                {hasAny && <div className={calStyles.amount}>{total >= 0 ? '+' : ''}{fmt(total, s)}</div>}
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

      {/* DAY PANEL */}
      {selected && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>{selected}</span>
            <button className={styles.btnAdd} style={{ width: 'auto', padding: '6px 14px', fontSize: 12 }} onClick={() => openAdd(selected)}>+ Add</button>
          </div>
          {!selectedTx.length
            ? <div className={styles.empty}>No transactions on this day. Click + Add to add one.</div>
            : selectedTx.map(t => (
              <div key={t._id} className={calStyles.txRow}>
                <div className={calStyles.txLeft}>
                  <div className={calStyles.txIcon} style={{ background: t.type === 'income' ? 'var(--accent-glow)' : 'var(--red-dim)', color: t.type === 'income' ? 'var(--accent)' : 'var(--red)' }}>
                    {t.type === 'income' ? '↑' : '↓'}
                  </div>
                  <div>
                    <div className={calStyles.txDesc}>{t.desc}</div>
                    <div className={calStyles.txMeta}>
                      {t.cat}
                      {t.recur && <span className={calStyles.recurBadge}>{t.recur}</span>}
                    </div>
                  </div>
                </div>
                <div className={calStyles.txRight}>
                  <div className={calStyles.txAmount} style={{ color: t.type === 'income' ? 'var(--accent)' : 'var(--red)' }}>
                    {t.type === 'income' ? '+' : '-'}{fmt(t.amount, s)}
                  </div>
                  <div className={calStyles.txActions}>
                    <button className={calStyles.editBtn} onClick={() => openEdit(t)}>Edit</button>
                    <button className={calStyles.delBtnSm} onClick={() => handleDelete(t)}>✕</button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', width: '100%', maxWidth: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--text)' }}>
                {editTx ? 'Edit transaction' : `Add — ${selected}`}
              </div>
              <button onClick={() => { setShowModal(false); setEditTx(null) }} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            {!editTx && (
              <div className={`${styles.formRow} ${styles.col2}`} style={{ marginBottom: 12 }}>
                <div className={styles.formGroup}>
                  <label>Type</label>
                  <select value={form.type} onChange={e => set('type', e.target.value)}>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Category</label>
                  <select value={form.cat} onChange={e => set('cat', e.target.value)}>
                    {cats.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            )}

            {editTx && (
              <div className={styles.formGroup} style={{ marginBottom: 12 }}>
                <label>Category</label>
                <select value={form.cat} onChange={e => set('cat', e.target.value)}>
                  {(editTx.type === 'income' ? CATS_INCOME : CATS_EXPENSE).map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            )}

            <div className={`${styles.formRow} ${styles.col2}`} style={{ marginBottom: 12 }}>
              <div className={styles.formGroup}>
                <label>Description</label>
                <input placeholder="What is this?" value={form.desc} onChange={e => set('desc', e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label>Amount (₱)</label>
                <input type="number" min="0" placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)} />
              </div>
            </div>

            <div className={styles.formGroup} style={{ marginBottom: '1.25rem' }}>
              <label>Recurrence</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                {RECUR_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => set('recur', opt.value)} style={{
                    padding: '5px 14px', borderRadius: 20, border: '1px solid',
                    borderColor: form.recur === opt.value ? 'var(--purple)' : 'var(--border)',
                    background: form.recur === opt.value ? 'var(--purple-dim)' : 'none',
                    color: form.recur === opt.value ? 'var(--purple)' : 'var(--text2)',
                    fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)',
                  }}>{opt.label}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setShowModal(false); setEditTx(null) }} style={{ flex: 1, padding: '9px', background: 'none', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} className={styles.btnAdd} style={{ flex: 2 }}>{editTx ? 'Save changes' : 'Add transaction'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
