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
  const [editGoalId, setEditGoalId] = useState(null)
  const [goalInput, setGoalInput] = useState('')

  const todayStr = today()
  const label = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevDays = new Date(year, month, 0).getDate()

  function prev() { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  function next() { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  function setType(type) {
    setForm(f => ({ ...f, type, cat: type === 'income' ? 'Salary' : 'Food & Dining' }))
  }
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

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
    setEditTx(null); setForm({ ...EMPTY_FORM }); setSelected(date); setShowModal(true)
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
    await fsDel(user.uid, tx.type === 'income' ? 'income' : 'expenses', tx._id)
  }

  async function handleGoalUpdate(goal) {
    const val = parseFloat(goalInput)
    if (isNaN(val)) return
    await fsUpdate(user.uid, 'goals', goal._id, { current: Math.min(goal.target, val) })
    setEditGoalId(null); setGoalInput('')
  }

  const selectedTx = selected
    ? [...data.income.filter(t => t.date === selected), ...data.expenses.filter(t => t.date === selected)]
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
    : []

  const cats = form.type === 'income' ? CATS_INCOME : CATS_EXPENSE
  const isIncome = form.type === 'income'

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>Calendar</div>
        <div className={styles.sub}>Tap a day to view · Double-tap to add</div>
      </div>

      <div className={styles.card}>
        <div className={calStyles.calHeader}>
          <div className={calStyles.nav}>
            <button className={calStyles.navBtn} onClick={prev}>←</button>
            <div className={calStyles.monthLabel}>{label}</div>
            <button className={calStyles.navBtn} onClick={next}>→</button>
          </div>
          <button className={styles.btnAdd} style={{ width: 'auto', padding: '8px 16px' }} onClick={() => openAdd(todayStr)}>+ Add</button>
        </div>

        <div className={calStyles.dayNames}>
          {['S','M','T','W','T','F','S'].map((d, i) => <div key={i} className={calStyles.dayName}>{d}</div>)}
        </div>

        <div className={calStyles.grid}>
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={`p${i}`} className={`${calStyles.cell} ${calStyles.otherMonth}`}>
              <div className={calStyles.dateNum}>{prevDays - firstDay + 1 + i}</div>
            </div>
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const d = i + 1
            const ds = dateStr(d)
            const { income, expenses, bills } = getDayTx(d)
            const total = income.reduce((a, t) => a + (t.amount || 0), 0) - expenses.reduce((a, t) => a + (t.amount || 0), 0)
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
                {hasAny && <div className={calStyles.amount} style={{ color: total >= 0 ? 'var(--accent)' : 'var(--red)' }}>{total >= 0 ? '+' : ''}{fmt(total, s)}</div>}
              </div>
            )
          })}
          {Array.from({ length: (7 - (firstDay + daysInMonth) % 7) % 7 }, (_, i) => (
            <div key={`n${i}`} className={`${calStyles.cell} ${calStyles.otherMonth}`}>
              <div className={calStyles.dateNum}>{i + 1}</div>
            </div>
          ))}
        </div>

        {/* MONTHLY SAVINGS SUMMARY STRIP */}
        {(() => {
          const ym = `${year}-${String(month + 1).padStart(2, '0')}`
          const mIncome = data.income.filter(t => t.date?.startsWith(ym)).reduce((a, t) => a + (t.amount || 0), 0)
          const mExpense = data.expenses.filter(t => t.date?.startsWith(ym)).reduce((a, t) => a + (t.amount || 0), 0)
          const totalSavings = data.goals.reduce((a, g) => a + (g.current || 0), 0)
          return (
            <div className={calStyles.summaryStrip}>
              <div className={calStyles.stripItem}>
                <span className={calStyles.stripLabel}>Income</span>
                <span className={calStyles.stripVal} style={{ color: 'var(--accent)' }}>+{fmt(mIncome, s)}</span>
              </div>
              <div className={calStyles.stripDivider} />
              <div className={calStyles.stripItem}>
                <span className={calStyles.stripLabel}>Expenses</span>
                <span className={calStyles.stripVal} style={{ color: 'var(--red)' }}>−{fmt(mExpense, s)}</span>
              </div>
              <div className={calStyles.stripDivider} />
              <div className={calStyles.stripItem}>
                <span className={calStyles.stripLabel}>Total Savings</span>
                <span className={calStyles.stripVal} style={{ color: 'var(--blue)' }}>{fmt(totalSavings, s)}</span>
              </div>
            </div>
          )
        })()}
      </div>

      {/* DAY PANEL */}
      {selected && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>{selected}</span>
            <button className={styles.btnAdd} style={{ width: 'auto', padding: '6px 14px', fontSize: 12 }} onClick={() => openAdd(selected)}>+ Add</button>
          </div>
          {!selectedTx.length
            ? <div className={styles.empty}>No transactions. Tap + Add to add one.</div>
            : selectedTx.map(t => (
              <div key={t._id} className={calStyles.txRow}>
                <div className={calStyles.txLeft}>
                  <div className={calStyles.txIcon} style={{ background: t.type === 'income' ? 'var(--accent-glow)' : 'var(--red-dim)', color: t.type === 'income' ? 'var(--accent)' : 'var(--red)' }}>
                    {t.type === 'income' ? '+' : '−'}
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
                    {t.type === 'income' ? '+' : '−'}{fmt(t.amount, s)}
                  </div>
                  <div className={calStyles.txActions}>
                    <button className={calStyles.editBtn} onClick={() => openEdit(t)}>Edit</button>
                    <button className={calStyles.delBtnSm} onClick={() => handleDelete(t)}>✕</button>
                  </div>
                </div>
              </div>
            ))}

          {/* SAVINGS SECTION IN DAY PANEL */}
          {data.goals.length > 0 && (
            <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Savings Goals</div>
              {data.goals.map(g => {
                const pct = Math.min(100, Math.round(((g.current || 0) / (g.target || 1)) * 100))
                const isEditing = editGoalId === g._id
                return (
                  <div key={g._id} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{g.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)' }}>{fmt(g.current || 0, s)}</span>
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>/ {fmt(g.target, s)}</span>
                        <button onClick={() => { setEditGoalId(isEditing ? null : g._id); setGoalInput(String(g.current || 0)) }} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 'var(--radius-sm)', padding: '2px 8px', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                          {isEditing ? 'Cancel' : 'Edit'}
                        </button>
                      </div>
                    </div>
                    <div style={{ height: 5, background: 'var(--surface3)', borderRadius: 3, overflow: 'hidden', marginBottom: isEditing ? 8 : 0 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct >= 80 ? 'var(--amber)' : 'var(--accent)', borderRadius: 3, transition: 'width 0.4s' }} />
                    </div>
                    {isEditing && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        <input
                          type="number" min="0"
                          value={goalInput}
                          onChange={e => setGoalInput(e.target.value)}
                          placeholder="New total saved"
                          style={{ flex: 1, padding: '6px 10px', background: 'var(--surface2)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 12, outline: 'none', fontFamily: 'var(--font-body)' }}
                        />
                        <button onClick={() => handleGoalUpdate(g)} style={{ padding: '6px 12px', background: 'var(--accent)', color: '#0a0a0f', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Save</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className={calStyles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) { setShowModal(false); setEditTx(null) } }}>
          <div className={calStyles.modal}>
            <div className={calStyles.modalHeader}>
              <div className={calStyles.modalTitle}>{editTx ? 'Edit transaction' : `Add — ${selected}`}</div>
              <button onClick={() => { setShowModal(false); setEditTx(null) }} className={calStyles.modalClose}>✕</button>
            </div>

            {/* +/- TOGGLE — only on add mode */}
            {!editTx && (
              <div className={calStyles.typeToggle}>
                <button
                  className={`${calStyles.typeBtn} ${isIncome ? calStyles.typeBtnIncome : ''}`}
                  onClick={() => setType('income')}
                >
                  <span className={calStyles.typeBtnSign}>+</span>
                  <span>Income</span>
                </button>
                <button
                  className={`${calStyles.typeBtn} ${!isIncome ? calStyles.typeBtnExpense : ''}`}
                  onClick={() => setType('expense')}
                >
                  <span className={calStyles.typeBtnSign}>−</span>
                  <span>Expense</span>
                </button>
              </div>
            )}

            {/* EDIT TYPE BADGE */}
            {editTx && (
              <div style={{ marginBottom: 12 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: editTx.type === 'income' ? 'var(--accent-glow)' : 'var(--red-dim)',
                  color: editTx.type === 'income' ? 'var(--accent)' : 'var(--red)',
                }}>
                  {editTx.type === 'income' ? '+' : '−'} {editTx.type === 'income' ? 'Income' : 'Expense'}
                </span>
              </div>
            )}

            {/* AMOUNT — big and prominent */}
            <div className={calStyles.amountField}>
              <span className={calStyles.amountSign} style={{ color: isIncome ? 'var(--accent)' : 'var(--red)' }}>
                {isIncome ? '+' : '−'}
              </span>
              <span className={calStyles.amountSymbol}>{s}</span>
              <input
                className={calStyles.amountInput}
                type="number" min="0" placeholder="0.00"
                value={form.amount}
                onChange={e => set('amount', e.target.value)}
                style={{ color: isIncome ? 'var(--accent)' : 'var(--red)' }}
              />
            </div>

            {/* DESC + CATEGORY */}
            <div className={calStyles.modalFields}>
              <div className={styles.formGroup}>
                <label>Description</label>
                <input placeholder="What is this for?" value={form.desc} onChange={e => set('desc', e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label>Category</label>
                <select value={form.cat} onChange={e => set('cat', e.target.value)}>
                  {(editTx ? (editTx.type === 'income' ? CATS_INCOME : CATS_EXPENSE) : cats).map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>

            {/* RECURRENCE */}
            <div className={styles.formGroup} style={{ marginBottom: '1.25rem' }}>
              <label>Recurrence</label>
              <div className={calStyles.recurGrid}>
                {RECUR_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => set('recur', opt.value)} className={`${calStyles.recurChip} ${form.recur === opt.value ? calStyles.recurChipActive : ''}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={calStyles.modalActions}>
              <button onClick={() => { setShowModal(false); setEditTx(null) }} className={calStyles.btnCancel}>Cancel</button>
              <button onClick={handleSave} className={calStyles.btnSave} style={{ background: isIncome ? 'var(--accent)' : 'var(--red)', color: isIncome ? '#0a0a0f' : '#fff' }}>
                {editTx ? 'Save changes' : (isIncome ? '+ Add income' : '− Add expense')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
