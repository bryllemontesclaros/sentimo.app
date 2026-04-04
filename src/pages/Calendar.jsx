import { useState, useMemo } from 'react'
import { fsAdd, fsDel, fsUpdate } from '../lib/firestore'
import { fmt, today, RECUR_OPTIONS } from '../lib/utils'
import { getProjectedTransactions } from '../lib/recurrence'
import { buildForecast, getForecastColor, getEndOfMonthBalance, getTransactionImpact } from '../lib/forecast'
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
  const [modalType, setModalType] = useState('income')
  const [editTx, setEditTx] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editGoalId, setEditGoalId] = useState(null)
  const [goalInput, setGoalInput] = useState('')

  const todayStr = today()
  const label = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevDays = new Date(year, month, 0).getDate()

  const projected = useMemo(() =>
    getProjectedTransactions(data.income, data.expenses, year, month),
    [data.income, data.expenses, year, month]
  )

  const allIncome = useMemo(() => [
    ...data.income.filter(t => t.date?.startsWith(`${year}-${String(month+1).padStart(2,'0')}`)),
    ...projected.filter(t => t.type === 'income'),
  ], [data.income, projected, year, month])

  const allExpenses = useMemo(() => [
    ...data.expenses.filter(t => t.date?.startsWith(`${year}-${String(month+1).padStart(2,'0')}`)),
    ...projected.filter(t => t.type === 'expense'),
  ], [data.expenses, projected, year, month])

  function prev() { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  function next() { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function dateStr(d) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  function getDayData(d) {
    const ds = dateStr(d)
    return {
      income: allIncome.filter(t => t.date === ds),
      expenses: allExpenses.filter(t => t.date === ds),
    }
  }

  function openAdd(date, type = modalType) {
    setEditTx(null)
    setModalType(type)
    const cat = type === 'income' ? 'Salary' : 'Food & Dining'
    setForm({ ...EMPTY_FORM, type, cat })
    setSelected(date)
    setShowModal(true)
  }

  function openEdit(tx) {
    setEditTx(tx)
    setModalType(tx.type)
    setForm({ desc: tx.desc || '', amount: tx.amount || '', type: tx.type || 'income', cat: tx.cat || '', recur: tx.recur || '' })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.desc || !form.amount) return alert('Please fill all fields')
    const amount = parseFloat(form.amount)
    if (editTx) {
      const col = editTx.type === 'income' ? 'income' : 'expenses'
      await fsUpdate(user.uid, col, editTx._id, { desc: form.desc, amount, cat: form.cat, recur: form.recur })
    } else {
      const col = modalType === 'income' ? 'income' : 'expenses'
      await fsAdd(user.uid, col, { desc: form.desc, amount, date: selected, cat: form.cat, recur: form.recur, type: modalType })
    }
    setShowModal(false); setEditTx(null); setForm(EMPTY_FORM)
  }

  async function handleDelete(tx) {
    if (tx._projected) return alert('This is a recurring projection. Delete the original transaction to remove it.')
    await fsDel(user.uid, tx.type === 'income' ? 'income' : 'expenses', tx._id)
  }

  async function handleGoalUpdate(goal) {
    const val = parseFloat(goalInput)
    if (isNaN(val)) return
    await fsUpdate(user.uid, 'goals', goal._id, { current: Math.min(goal.target, val) })
    setEditGoalId(null); setGoalInput('')
  }

  const selectedIncome = selected ? allIncome.filter(t => t.date === selected) : []
  const selectedExpenses = selected ? allExpenses.filter(t => t.date === selected) : []

  const mIncome = allIncome.reduce((a, t) => a + (t.amount || 0), 0)
  const mExpense = allExpenses.reduce((a, t) => a + (t.amount || 0), 0)
  const totalSavings = data.goals.reduce((a, g) => a + (g.current || 0), 0)
  const net = mIncome - mExpense

  // Starting balance = account balances + cumulative net of all months BEFORE the viewed month
  const baseBalance = data.accounts.reduce((s, a) => s + (a.balance || 0), 0)

  const startingBalance = useMemo(() => {
    // Sum all income and expenses from months strictly before the viewed month
    const viewedYm = `${year}-${String(month + 1).padStart(2, '0')}`
    const priorIncome = data.income
      .filter(t => t.date && t.date.slice(0, 7) < viewedYm)
      .reduce((s, t) => s + (t.amount || 0), 0)
    const priorExpense = data.expenses
      .filter(t => t.date && t.date.slice(0, 7) < viewedYm)
      .reduce((s, t) => s + (t.amount || 0), 0)
    return baseBalance + priorIncome - priorExpense
  }, [data.income, data.expenses, year, month, baseBalance])

  // Build forecast map for this month — starting from cumulative balance
  const forecastMap = useMemo(() =>
    buildForecast(allIncome, allExpenses, year, month, startingBalance),
    [allIncome, allExpenses, year, month, startingBalance]
  )

  const endOfMonthBalance = getEndOfMonthBalance(forecastMap)

  // Impact preview for current form
  const formImpact = useMemo(() => {
    if (!selected || !form.amount || !parseFloat(form.amount)) return null
    return getTransactionImpact(forecastMap, selected, parseFloat(form.amount), modalType)
  }, [forecastMap, selected, form.amount, modalType])

  const isIncome = modalType === 'income'
  const cats = isIncome ? CATS_INCOME : CATS_EXPENSE

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>Calendar</div>
        <div className={styles.sub}>Tap a day to view transactions</div>
      </div>

      <div className={styles.card}>
        {/* HEADER */}
        <div className={calStyles.calHeader}>
          <div className={calStyles.nav}>
            <button className={calStyles.navBtn} onClick={prev}>←</button>
            <div className={calStyles.monthLabel}>{label}</div>
            <button className={calStyles.navBtn} onClick={next}>→</button>
          </div>
          <div className={calStyles.addBtns}>
            <button className={calStyles.addBtnIncome} onClick={() => openAdd(selected || todayStr, 'income')}>+ Income</button>
            <button className={calStyles.addBtnExpense} onClick={() => openAdd(selected || todayStr, 'expense')}>− Expense</button>
          </div>
        </div>

        {/* DAY NAMES */}
        <div className={calStyles.dayNames}>
          {['S','M','T','W','T','F','S'].map((d, i) => <div key={i} className={calStyles.dayName}>{d}</div>)}
        </div>

        {/* CALENDAR GRID */}
        <div className={calStyles.grid}>
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={`p${i}`} className={`${calStyles.cell} ${calStyles.otherMonth}`}>
              <div className={calStyles.dateNum}>{prevDays - firstDay + 1 + i}</div>
            </div>
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const d = i + 1
            const ds = dateStr(d)
            const { income, expenses } = getDayData(d)
            const hasIncome = income.length > 0
            const hasExpense = expenses.length > 0
            const isSelected = selected === ds
            const isToday = ds === todayStr
            const forecast = forecastMap[ds]
            const fColor = forecast ? getForecastColor(forecast.status) : null
            return (
              <div key={d}
                className={`${calStyles.cell} ${isToday ? calStyles.today : ''} ${isSelected ? calStyles.selectedCell : ''} ${(hasIncome || hasExpense) ? calStyles.hasData : ''}`}
                style={fColor?.bg && !isToday ? { background: fColor.bg, borderColor: fColor.border } : {}}
                onClick={() => setSelected(ds === selected ? null : ds)}
              >
                <div className={calStyles.dateNum} style={fColor?.text && !isToday ? { color: fColor.text } : {}}>{d}</div>
                {(hasIncome || hasExpense) && (
                  <div className={calStyles.dots}>
                    {hasIncome && <div className={`${calStyles.dot} ${calStyles.dotIncome}`} />}
                    {hasExpense && <div className={`${calStyles.dot} ${calStyles.dotExpense}`} />}
                  </div>
                )}
                {forecast && forecast.status !== 'neutral' && (
                  <div className={calStyles.forecastBal} style={{ color: fColor.text }}>
                    {fmt(forecast.runningBalance, s)}
                  </div>
                )}
              </div>
            )
          })}
          {Array.from({ length: (7 - (firstDay + daysInMonth) % 7) % 7 }, (_, i) => (
            <div key={`n${i}`} className={`${calStyles.cell} ${calStyles.otherMonth}`}>
              <div className={calStyles.dateNum}>{i + 1}</div>
            </div>
          ))}
        </div>

        {/* SUMMARY STRIP */}
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
            <span className={calStyles.stripLabel}>Net</span>
            <span className={calStyles.stripVal} style={{ color: net >= 0 ? 'var(--blue)' : 'var(--red)' }}>{net >= 0 ? '+' : ''}{fmt(net, s)}</span>
          </div>
          <div className={calStyles.stripDivider} />
          <div className={calStyles.stripItem}>
            <span className={calStyles.stripLabel}>End of month</span>
            <span className={calStyles.stripVal} style={{ color: endOfMonthBalance >= 0 ? 'var(--accent)' : 'var(--red)', fontWeight: 700 }}>
              {fmt(endOfMonthBalance, s)}
            </span>
          </div>
        </div>
        {/* FORECAST LEGEND */}
        {startingBalance > 0 && (
          <div className={calStyles.forecastLegend}>
            <span className={calStyles.legendItem}><span className={calStyles.legendDot} style={{ background: 'var(--accent)' }} />Healthy</span>
            <span className={calStyles.legendItem}><span className={calStyles.legendDot} style={{ background: 'var(--amber)' }} />Tight</span>
            <span className={calStyles.legendItem}><span className={calStyles.legendDot} style={{ background: 'var(--red)' }} />Negative</span>
            <span style={{ fontSize: 10, color: 'var(--text3)', marginLeft: 'auto' }}>Balance: {fmt(startingBalance, s)}</span>
          </div>
        )}
      </div>

      {/* DAY PANEL — bottom sheet on mobile, card on desktop */}
      {selected && (
        <>
          {/* Mobile overlay backdrop */}
          <div className={calStyles.dayPanelOverlay} onClick={() => setSelected(null)} />
          <div className={calStyles.dayPanel}>
            <div className={calStyles.dayPanelHandle} />
            <div className={calStyles.dayPanelHeader}>
              <div>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>{selected}</span>
                {forecastMap[selected] && forecastMap[selected].status !== 'neutral' && (
                  <div style={{ fontSize: 11, color: getForecastColor(forecastMap[selected].status).text, marginTop: 2 }}>
                    Projected balance: {fmt(forecastMap[selected].runningBalance, s)}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button className={calStyles.addBtnIncome} style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => openAdd(selected, 'income')}>+ Income</button>
                <button className={calStyles.addBtnExpense} style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => openAdd(selected, 'expense')}>− Expense</button>
                <button onClick={() => setSelected(null)} className={calStyles.dayPanelClose}>✕</button>
              </div>
            </div>

          {/* INCOME */}
          {selectedIncome.length > 0 && (
            <div className={calStyles.daySection}>
              <div className={calStyles.daySectionLabel} style={{ color: 'var(--accent)' }}>Income</div>
              {selectedIncome.map(t => <DayTxRow key={t._id} t={t} s={s} onEdit={openEdit} onDelete={handleDelete} />)}
            </div>
          )}

          {/* EXPENSES */}
          {selectedExpenses.length > 0 && (
            <div className={calStyles.daySection}>
              <div className={calStyles.daySectionLabel} style={{ color: 'var(--red)' }}>Expenses</div>
              {selectedExpenses.map(t => <DayTxRow key={t._id} t={t} s={s} onEdit={openEdit} onDelete={handleDelete} />)}
            </div>
          )}

          {selectedIncome.length === 0 && selectedExpenses.length === 0 && (
            <div className={styles.empty}>No transactions on this day. Use the buttons above to add.</div>
          )}

          {/* DAY SUMMARY */}
          {(selectedIncome.length > 0 || selectedExpenses.length > 0) && (
            <div className={calStyles.daySummary}>
              <span style={{ color: 'var(--accent)' }}>+{fmt(selectedIncome.reduce((a, t) => a + (t.amount || 0), 0), s)}</span>
              <span style={{ color: 'var(--text3)' }}>·</span>
              <span style={{ color: 'var(--red)' }}>−{fmt(selectedExpenses.reduce((a, t) => a + (t.amount || 0), 0), s)}</span>
              <span style={{ color: 'var(--text3)' }}>·</span>
              <span style={{ color: net >= 0 ? 'var(--blue)' : 'var(--red)', fontWeight: 600 }}>
                Net {fmt(selectedIncome.reduce((a, t) => a + (t.amount || 0), 0) - selectedExpenses.reduce((a, t) => a + (t.amount || 0), 0), s)}
              </span>
            </div>
          )}

          {/* SAVINGS GOALS */}
          {data.goals.length > 0 && (
            <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
              <div className={calStyles.daySectionLabel} style={{ color: 'var(--blue)', marginBottom: 10 }}>Savings Goals</div>
              {data.goals.map(g => {
                const pct = Math.min(100, Math.round(((g.current || 0) / (g.target || 1)) * 100))
                const isEditing = editGoalId === g._id
                return (
                  <div key={g._id} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{g.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)' }}>{fmt(g.current || 0, s)}</span>
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>/ {fmt(g.target, s)}</span>
                        <button onClick={() => { setEditGoalId(isEditing ? null : g._id); setGoalInput(String(g.current || 0)) }} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 'var(--radius-sm)', padding: '2px 8px', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                          {isEditing ? 'Cancel' : 'Edit'}
                        </button>
                      </div>
                    </div>
                    <div style={{ height: 5, background: 'var(--surface3)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct >= 80 ? 'var(--amber)' : 'var(--accent)', borderRadius: 3, transition: 'width 0.4s' }} />
                    </div>
                    {isEditing && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        <input type="number" min="0" value={goalInput} onChange={e => setGoalInput(e.target.value)} placeholder="New total saved"
                          style={{ flex: 1, padding: '6px 10px', background: 'var(--surface2)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 12, outline: 'none', fontFamily: 'var(--font-body)' }} />
                        <button onClick={() => handleGoalUpdate(g)} style={{ padding: '6px 12px', background: 'var(--accent)', color: '#0a0a0f', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Save</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
        </>
      )}

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className={calStyles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) { setShowModal(false); setEditTx(null) } }}>
          <div className={calStyles.modal}>
            <div className={calStyles.modalHeader}>
              <div className={calStyles.modalTitle}>
                {editTx ? 'Edit transaction' : `Add ${isIncome ? 'Income' : 'Expense'}`}
                {selected && !editTx && <span style={{ fontSize: 13, color: 'var(--text3)', marginLeft: 8 }}>{selected}</span>}
              </div>
              <button onClick={() => { setShowModal(false); setEditTx(null) }} className={calStyles.modalClose}>✕</button>
            </div>

            {/* TYPE TOGGLE */}
            {!editTx && (
              <div className={calStyles.typeToggle}>
                <button className={`${calStyles.typeBtn} ${isIncome ? calStyles.typeBtnIncome : ''}`} onClick={() => { setModalType('income'); set('cat', 'Salary') }}>
                  <span className={calStyles.typeBtnSign}>+</span><span>Income</span>
                </button>
                <button className={`${calStyles.typeBtn} ${!isIncome ? calStyles.typeBtnExpense : ''}`} onClick={() => { setModalType('expense'); set('cat', 'Food & Dining') }}>
                  <span className={calStyles.typeBtnSign}>−</span><span>Expense</span>
                </button>
              </div>
            )}

            {/* AMOUNT */}
            <div className={calStyles.amountField}>
              <span className={calStyles.amountSign} style={{ color: isIncome ? 'var(--accent)' : 'var(--red)' }}>
                {isIncome ? '+' : '−'}
              </span>
              <span className={calStyles.amountSymbol}>{s}</span>
              <input className={calStyles.amountInput} type="number" min="0" placeholder="0.00"
                value={form.amount} onChange={e => set('amount', e.target.value)}
                style={{ color: isIncome ? 'var(--accent)' : 'var(--red)' }} />
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
                  {cats.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>

            {/* RECURRENCE */}
            <div className={styles.formGroup} style={{ marginBottom: '1.25rem' }}>
              <label>Recurrence</label>
              <div className={calStyles.recurGrid}>
                {RECUR_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => set('recur', opt.value)}
                    className={`${calStyles.recurChip} ${form.recur === opt.value ? calStyles.recurChipActive : ''}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* IMPACT PREVIEW */}
            {formImpact && (
              <div className={calStyles.impactPreview} style={{
                background: formImpact.level === 'negative' ? 'var(--red-dim)' : formImpact.level === 'tight' ? 'var(--amber-dim)' : 'var(--accent-glow)',
                borderColor: formImpact.level === 'negative' ? 'var(--red)' : formImpact.level === 'tight' ? 'var(--amber)' : 'var(--accent)',
                color: formImpact.level === 'negative' ? 'var(--red)' : formImpact.level === 'tight' ? 'var(--amber)' : 'var(--accent)',
              }}>
                {formImpact.msg}
              </div>
            )}

            <div className={calStyles.modalActions}>
              <button onClick={() => { setShowModal(false); setEditTx(null) }} className={calStyles.btnCancel}>Cancel</button>
              <button onClick={handleSave} className={calStyles.btnSave}
                style={{ background: isIncome ? 'var(--accent)' : 'var(--red)', color: isIncome ? '#0a0a0f' : '#fff' }}>
                {editTx ? 'Save changes' : isIncome ? '+ Add income' : '− Add expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DayTxRow({ t, s, onEdit, onDelete }) {
  const isIncome = t.type === 'income'
  return (
    <div className={calStyles.txRow}>
      <div className={calStyles.txLeft}>
        <div className={calStyles.txIcon} style={{ background: isIncome ? 'var(--accent-glow)' : 'var(--red-dim)', color: isIncome ? 'var(--accent)' : 'var(--red)' }}>
          {isIncome ? '+' : '−'}
        </div>
        <div>
          <div className={calStyles.txDesc}>
            {t.desc}
            {t._projected && <span className={calStyles.projBadge}>recurring</span>}
          </div>
          <div className={calStyles.txMeta}>
            {t.cat}
            {t.recur && <span className={calStyles.recurBadge}>{t.recur}</span>}
          </div>
        </div>
      </div>
      <div className={calStyles.txRight}>
        <div className={calStyles.txAmount} style={{ color: isIncome ? 'var(--accent)' : 'var(--red)' }}>
          {isIncome ? '+' : '−'}{fmt(t.amount, s)}
        </div>
        <div className={calStyles.txActions}>
          {!t._projected && <button className={calStyles.editBtn} onClick={() => onEdit(t)}>Edit</button>}
          <button className={calStyles.delBtnSm} onClick={() => onDelete(t)}>✕</button>
        </div>
      </div>
    </div>
  )
}
