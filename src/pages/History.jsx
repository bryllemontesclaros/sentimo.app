import { useState, useMemo } from 'react'
import { fsDel } from '../lib/firestore'
import { fmt, confirmDelete, RECUR_OPTIONS } from '../lib/utils'
import styles from './Page.module.css'
import hStyles from './History.module.css'

const ALL_CATS = ['All categories','Salary','Freelance','Business','Investment','13th Month','Bonus','Food & Dining','Transport','Shopping','Health','Entertainment','Personal Care','Education','Bills','Other']
const TYPES = ['All types', 'Income', 'Expense', 'Bill']

export default function History({ user, data, symbol }) {
  const s = symbol || '₱'
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('All types')
  const [filterCat, setFilterCat] = useState('All categories')
  const [filterMonth, setFilterMonth] = useState('')
  const [sortBy, setSortBy] = useState('date-desc')

  const allTx = useMemo(() => {
    const income = data.income.map(t => ({ ...t, type: 'income' }))
    const expenses = data.expenses.map(t => ({ ...t, type: 'expense' }))
    const bills = data.bills.map(b => ({ ...b, _id: b._id, desc: b.name, cat: b.cat, type: 'bill', date: null }))
    return [...income, ...expenses, ...bills]
  }, [data])

  const filtered = useMemo(() => {
    let list = allTx

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t => (t.desc || t.name || '').toLowerCase().includes(q) || (t.cat || '').toLowerCase().includes(q))
    }
    if (filterType !== 'All types') {
      list = list.filter(t => t.type === filterType.toLowerCase())
    }
    if (filterCat !== 'All categories') {
      list = list.filter(t => t.cat === filterCat)
    }
    if (filterMonth) {
      list = list.filter(t => t.date?.startsWith(filterMonth))
    }

    list = [...list].sort((a, b) => {
      if (sortBy === 'date-desc') return (b.date || '').localeCompare(a.date || '')
      if (sortBy === 'date-asc') return (a.date || '').localeCompare(b.date || '')
      if (sortBy === 'amount-desc') return (b.amount || 0) - (a.amount || 0)
      if (sortBy === 'amount-asc') return (a.amount || 0) - (b.amount || 0)
      return 0
    })

    return list
  }, [allTx, search, filterType, filterCat, filterMonth, sortBy])

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0)
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0)

  async function handleDelete(tx) {
    if (!confirmDelete(tx.desc || tx.name)) return
    if (tx.type === 'income') await fsDel(user.uid, 'income', tx._id)
    else if (tx.type === 'expense') await fsDel(user.uid, 'expenses', tx._id)
    else if (tx.type === 'bill') await fsDel(user.uid, 'bills', tx._id)
  }

  const typeColor = { income: 'var(--accent)', expense: 'var(--red)', bill: 'var(--amber)' }
  const typeBg = { income: 'var(--accent-glow)', expense: 'var(--red-dim)', bill: 'var(--amber-dim)' }
  const typeSign = { income: '+', expense: '−', bill: '◷' }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>Transaction History</div>
        <div className={styles.sub}>{filtered.length} transactions</div>
      </div>

      {/* SEARCH */}
      <div className={hStyles.searchRow}>
        <input
          className={hStyles.searchInput}
          placeholder="Search transactions..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && <button className={hStyles.clearSearch} onClick={() => setSearch('')}>✕</button>}
      </div>

      {/* FILTERS */}
      <div className={hStyles.filters}>
        <select className={hStyles.filter} value={filterType} onChange={e => setFilterType(e.target.value)}>
          {TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className={hStyles.filter} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          {ALL_CATS.map(c => <option key={c}>{c}</option>)}
        </select>
        <input className={hStyles.filter} type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} />
        <select className={hStyles.filter} value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="amount-desc">Highest amount</option>
          <option value="amount-asc">Lowest amount</option>
        </select>
      </div>

      {/* SUMMARY */}
      {filtered.length > 0 && (
        <div className={hStyles.summary}>
          <span style={{ color: 'var(--accent)' }}>+{fmt(totalIncome, s)}</span>
          <span style={{ color: 'var(--text3)' }}>·</span>
          <span style={{ color: 'var(--red)' }}>−{fmt(totalExpense, s)}</span>
          <span style={{ color: 'var(--text3)' }}>·</span>
          <span style={{ color: totalIncome - totalExpense >= 0 ? 'var(--blue)' : 'var(--red)', fontWeight: 600 }}>
            Net {fmt(totalIncome - totalExpense, s)}
          </span>
        </div>
      )}

      {/* LIST */}
      <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
        {!filtered.length ? (
          <div className={styles.empty} style={{ padding: '2rem' }}>
            {search || filterType !== 'All types' || filterCat !== 'All categories' || filterMonth
              ? 'No transactions match your filters.'
              : 'No transactions yet.'}
          </div>
        ) : filtered.map((t, i) => (
          <div key={t._id + i} className={hStyles.txRow}>
            <div className={hStyles.txIcon} style={{ background: typeBg[t.type], color: typeColor[t.type] }}>
              {typeSign[t.type]}
            </div>
            <div className={hStyles.txInfo}>
              <div className={hStyles.txDesc}>{t.desc || t.name}</div>
              <div className={hStyles.txMeta}>
                <span className={hStyles.txCat}>{t.cat}</span>
                {t.date && <span className={hStyles.txDate}>{t.date}</span>}
                {(t.recur || t.freq) && (
                  <span className={hStyles.txRecur}>{RECUR_OPTIONS.find(o => o.value === (t.recur || t.freq))?.label || t.recur || t.freq}</span>
                )}
              </div>
            </div>
            <div className={hStyles.txRight}>
              <div className={hStyles.txAmount} style={{ color: typeColor[t.type] }}>
                {typeSign[t.type]}{fmt(t.amount, s)}
              </div>
              <button className={hStyles.delBtn} onClick={() => handleDelete(t)}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
