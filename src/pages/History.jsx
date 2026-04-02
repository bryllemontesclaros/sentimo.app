import { useState, useMemo } from 'react'
import { fsDel, fsUpdate } from '../lib/firestore'
import { fmt, confirmDelete, validateAmount, RECUR_OPTIONS } from '../lib/utils'
import styles from './Page.module.css'
import hStyles from './History.module.css'

const ALL_CATS = ['All categories','Salary','Freelance','Business','Investment','13th Month','Bonus','Food & Dining','Transport','Shopping','Health','Entertainment','Personal Care','Education','Bills','Other']
const CATS_INCOME = ['Salary','Freelance','Business','Investment','13th Month','Bonus','Other']
const CATS_EXPENSE = ['Food & Dining','Transport','Shopping','Health','Entertainment','Personal Care','Bills','Education','Other']
const TYPES = ['All types', 'Income', 'Expense']

export default function History({ user, data, symbol }) {
  const s = symbol || '₱'
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('All types')
  const [filterCat, setFilterCat] = useState('All categories')
  const [filterMonth, setFilterMonth] = useState('')
  const [sortBy, setSortBy] = useState('date-desc')
  const [showFilters, setShowFilters] = useState(false)
  const [editTx, setEditTx] = useState(null)
  const [editForm, setEditForm] = useState({ desc: '', amount: '', cat: '' })

  const hasActiveFilters = filterType !== 'All types' || filterCat !== 'All categories' || filterMonth

  const allTx = useMemo(() => {
    const income = data.income.map(t => ({ ...t, type: 'income' }))
    const expenses = data.expenses.map(t => ({ ...t, type: 'expense' }))
    return [...income, ...expenses]
  }, [data])

  const filtered = useMemo(() => {
    let list = allTx
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t => (t.desc || '').toLowerCase().includes(q) || (t.cat || '').toLowerCase().includes(q))
    }
    if (filterType !== 'All types') list = list.filter(t => t.type === filterType.toLowerCase())
    if (filterCat !== 'All categories') list = list.filter(t => t.cat === filterCat)
    if (filterMonth) list = list.filter(t => t.date?.startsWith(filterMonth))
    return [...list].sort((a, b) => {
      if (sortBy === 'date-desc') return (b.date || '').localeCompare(a.date || '')
      if (sortBy === 'date-asc') return (a.date || '').localeCompare(b.date || '')
      if (sortBy === 'amount-desc') return (b.amount || 0) - (a.amount || 0)
      if (sortBy === 'amount-asc') return (a.amount || 0) - (b.amount || 0)
      return 0
    })
  }, [allTx, search, filterType, filterCat, filterMonth, sortBy])

  // Group by date
  const grouped = useMemo(() => {
    const map = {}
    filtered.forEach(t => {
      const key = t.date || 'No date'
      if (!map[key]) map[key] = []
      map[key].push(t)
    })
    return Object.entries(map).sort((a, b) => {
      if (sortBy === 'date-asc') return a[0].localeCompare(b[0])
      return b[0].localeCompare(a[0])
    })
  }, [filtered, sortBy])

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0)
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0)
  const net = totalIncome - totalExpense

  function clearFilters() {
    setFilterType('All types')
    setFilterCat('All categories')
    setFilterMonth('')
    setSortBy('date-desc')
  }

  async function handleDelete(tx) {
    if (!confirmDelete(tx.desc)) return
    const col = tx.type === 'income' ? 'income' : 'expenses'
    await fsDel(user.uid, col, tx._id)
  }

  function openEdit(tx) {
    setEditTx(tx)
    setEditForm({ desc: tx.desc || '', amount: String(tx.amount || ''), cat: tx.cat || '' })
  }

  async function handleSaveEdit() {
    const err = validateAmount(editForm.amount)
    if (err) return alert(err)
    if (!editForm.desc) return alert('Description is required.')
    const col = editTx.type === 'income' ? 'income' : 'expenses'
    await fsUpdate(user.uid, col, editTx._id, {
      desc: editForm.desc,
      amount: parseFloat(editForm.amount),
      cat: editForm.cat,
    })
    setEditTx(null)
  }

  const typeColor = { income: 'var(--accent)', expense: 'var(--red)' }
  const typeBg = { income: 'var(--accent-glow)', expense: 'var(--red-dim)' }
  const typeSign = { income: '+', expense: '−' }

  const editCats = editTx?.type === 'income' ? CATS_INCOME : CATS_EXPENSE

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>History</div>
        <div className={styles.sub}>{filtered.length} transactions</div>
      </div>

      {/* SEARCH + FILTER BUTTON */}
      <div className={hStyles.searchRow}>
        <input
          className={hStyles.searchInput}
          placeholder="Search by description or category..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && <button className={hStyles.clearSearch} onClick={() => setSearch('')}>✕</button>}
        <button
          className={`${hStyles.filterBtn} ${hasActiveFilters ? hStyles.filterBtnActive : ''}`}
          onClick={() => setShowFilters(f => !f)}
        >
          {hasActiveFilters ? '● Filter' : 'Filter'}
        </button>
      </div>

      {/* COLLAPSIBLE FILTERS */}
      {showFilters && (
        <div className={hStyles.filterPanel}>
          <div className={hStyles.filterGrid}>
            <div className={hStyles.filterGroup}>
              <label>Type</label>
              <select value={filterType} onChange={e => setFilterType(e.target.value)}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className={hStyles.filterGroup}>
              <label>Category</label>
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                {ALL_CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className={hStyles.filterGroup}>
              <label>Month</label>
              <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} />
            </div>
            <div className={hStyles.filterGroup}>
              <label>Sort by</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="date-desc">Newest first</option>
                <option value="date-asc">Oldest first</option>
                <option value="amount-desc">Highest amount</option>
                <option value="amount-asc">Lowest amount</option>
              </select>
            </div>
          </div>
          {hasActiveFilters && (
            <button className={hStyles.clearFiltersBtn} onClick={clearFilters}>✕ Clear all filters</button>
          )}
        </div>
      )}

      {/* TOTALS — prominent */}
      {filtered.length > 0 && (
        <div className={hStyles.totalsBar}>
          <div className={hStyles.totalItem}>
            <div className={hStyles.totalLabel}>Income</div>
            <div className={hStyles.totalVal} style={{ color: 'var(--accent)' }}>+{fmt(totalIncome, s)}</div>
          </div>
          <div className={hStyles.totalDivider} />
          <div className={hStyles.totalItem}>
            <div className={hStyles.totalLabel}>Expenses</div>
            <div className={hStyles.totalVal} style={{ color: 'var(--red)' }}>−{fmt(totalExpense, s)}</div>
          </div>
          <div className={hStyles.totalDivider} />
          <div className={hStyles.totalItem}>
            <div className={hStyles.totalLabel}>Net</div>
            <div className={hStyles.totalVal} style={{ color: net >= 0 ? 'var(--blue)' : 'var(--red)', fontWeight: 700 }}>
              {net >= 0 ? '+' : ''}{fmt(net, s)}
            </div>
          </div>
        </div>
      )}

      {/* GROUPED LIST */}
      {!filtered.length ? (
        <div className={styles.card}>
          <div className={styles.empty}>
            {hasActiveFilters || search
              ? <><div>No transactions match your filters.</div><button className={hStyles.clearFiltersBtn} style={{ marginTop: 12 }} onClick={() => { clearFilters(); setSearch('') }}>Clear filters</button></>
              : 'No transactions yet. Add income or expenses from the Calendar.'
            }
          </div>
        </div>
      ) : grouped.map(([date, txs]) => {
        const dayIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0)
        const dayExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0)
        const dayNet = dayIncome - dayExpense
        return (
          <div key={date} className={hStyles.dateGroup}>
            <div className={hStyles.dateHeader}>
              <span className={hStyles.dateLabel}>{date}</span>
              <span className={hStyles.dateSummary} style={{ color: dayNet >= 0 ? 'var(--accent)' : 'var(--red)' }}>
                {dayNet >= 0 ? '+' : ''}{fmt(dayNet, s)}
              </span>
            </div>
            <div className={styles.card} style={{ padding: 0, overflow: 'hidden', marginBottom: 0 }}>
              {txs.map((t, i) => (
                <div key={t._id + i} className={hStyles.txRow}>
                  <div className={hStyles.txIcon} style={{ background: typeBg[t.type], color: typeColor[t.type] }}>
                    {typeSign[t.type]}
                  </div>
                  <div className={hStyles.txInfo}>
                    <div className={hStyles.txDesc}>{t.desc}</div>
                    <div className={hStyles.txMeta}>
                      <span className={hStyles.txCat}>{t.cat}</span>
                      {(t.recur) && (
                        <span className={hStyles.txRecur}>{RECUR_OPTIONS.find(o => o.value === t.recur)?.label || t.recur}</span>
                      )}
                    </div>
                  </div>
                  <div className={hStyles.txRight}>
                    <div className={hStyles.txAmount} style={{ color: typeColor[t.type] }}>
                      {typeSign[t.type]}{fmt(t.amount, s)}
                    </div>
                    <div className={hStyles.txActions}>
                      <button className={hStyles.editBtn} onClick={() => openEdit(t)}>Edit</button>
                      <button className={hStyles.delBtn} onClick={() => handleDelete(t)}>✕</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* EDIT MODAL */}
      {editTx && (
        <div className={hStyles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) setEditTx(null) }}>
          <div className={hStyles.modal}>
            <div className={hStyles.modalHeader}>
              <div className={hStyles.modalTitle}>Edit transaction</div>
              <button onClick={() => setEditTx(null)} className={hStyles.modalClose}>✕</button>
            </div>
            <div className={styles.formGroup} style={{ marginBottom: 12 }}>
              <label>Description</label>
              <input value={editForm.desc} onChange={e => setEditForm(f => ({ ...f, desc: e.target.value }))} placeholder="Description" />
            </div>
            <div className={`${styles.formRow} ${styles.col2}`} style={{ marginBottom: 12 }}>
              <div className={styles.formGroup}>
                <label>Amount ({s})</label>
                <input type="number" min="0" value={editForm.amount} onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label>Category</label>
                <select value={editForm.cat} onChange={e => setEditForm(f => ({ ...f, cat: e.target.value }))}>
                  {editCats.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEditTx(null)} className={hStyles.btnCancel}>Cancel</button>
              <button onClick={handleSaveEdit} className={styles.btnAdd} style={{ flex: 2 }}>Save changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
