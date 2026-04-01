import { useState } from 'react'
import { fsAdd } from '../lib/firestore'
import { today } from '../lib/utils'
import ReceiptScanner from '../components/ReceiptScanner'
import styles from './QuickAdd.module.css'

const QUICK_EXPENSE = [
  { label: 'Food', cat: 'Food & Dining', icon: '🍜' },
  { label: 'Transport', cat: 'Transport', icon: '🚗' },
  { label: 'Shopping', cat: 'Shopping', icon: '🛍' },
  { label: 'Health', cat: 'Health', icon: '💊' },
  { label: 'Coffee', cat: 'Food & Dining', icon: '☕' },
  { label: 'Bills', cat: 'Bills', icon: '📄' },
  { label: 'Entertainment', cat: 'Entertainment', icon: '🎮' },
  { label: 'Personal', cat: 'Personal Care', icon: '✂️' },
]

const QUICK_INCOME = [
  { label: 'Salary', cat: 'Salary', icon: '💼' },
  { label: 'Freelance', cat: 'Freelance', icon: '💻' },
  { label: 'Business', cat: 'Business', icon: '🏪' },
  { label: 'Bonus', cat: 'Bonus', icon: '🎁' },
]

export default function QuickAdd({ user, symbol, onClose, defaultType = 'expense', defaultDate }) {
  const s = symbol || '₱'
  const [type, setType] = useState(defaultType)
  const [amount, setAmount] = useState('')
  const [desc, setDesc] = useState('')
  const [cat, setCat] = useState(defaultType === 'income' ? 'Salary' : 'Food & Dining')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const quickCats = type === 'income' ? QUICK_INCOME : QUICK_EXPENSE

  function selectCat(item) {
    setCat(item.cat)
    if (!desc) setDesc(item.label)
  }

  // Numpad input
  function numPress(val) {
    if (val === 'C') { setAmount(''); return }
    if (val === '⌫') { setAmount(a => a.slice(0, -1)); return }
    if (val === '.' && amount.includes('.')) return
    if (amount === '0' && val !== '.') { setAmount(String(val)); return }
    if (amount.split('.')[1]?.length >= 2) return
    setAmount(a => a + val)
  }

  async function handleSave() {
    if (!amount || parseFloat(amount) <= 0) return
    setSaving(true)
    const col = type === 'income' ? 'income' : 'expenses'
    await fsAdd(user.uid, col, {
      desc: desc || cat,
      amount: parseFloat(amount),
      date: defaultDate || today(),
      cat,
      recur: '',
      type,
    })
    setDone(true)
    setTimeout(() => {
      setAmount(''); setDesc(''); setDone(false); setSaving(false)
      if (onClose) onClose()
    }, 600)
  }

  const [showScanner, setShowScanner] = useState(false)

  function handleReceiptResult(parsed) {
    if (parsed.amount) setAmount(String(parsed.amount))
    if (parsed.desc) setDesc(parsed.desc)
    if (parsed.cat) setCat(parsed.cat)
    setType('expense')
    setShowScanner(false)
  }
  const color = isIncome ? 'var(--accent)' : 'var(--red)'
  const bgColor = isIncome ? 'var(--accent-glow)' : 'var(--red-dim)'

  if (showScanner) return <ReceiptScanner onResult={handleReceiptResult} onClose={() => setShowScanner(false)} />

  return (
    <div className={styles.wrap}>
      {/* TYPE TOGGLE */}
      <div className={styles.typeRow}>
        <button className={`${styles.typeTab} ${!isIncome ? styles.typeTabExpense : ''}`} onClick={() => { setType('expense'); setCat('Food & Dining'); setDesc('') }}>
          − Expense
        </button>
        <button className={`${styles.typeTab} ${isIncome ? styles.typeTabIncome : ''}`} onClick={() => { setType('income'); setCat('Salary'); setDesc('') }}>
          + Income
        </button>
      </div>

      {/* AMOUNT DISPLAY */}
      <div className={styles.amountDisplay} style={{ color }}>
        <span className={styles.currencySign}>{s}</span>
        <span className={styles.amountVal}>{amount || '0'}</span>
      </div>

      {/* QUICK CATEGORY PILLS */}
      <div className={styles.quickCats}>
        {quickCats.map(item => (
          <button
            key={item.label}
            className={`${styles.quickCat} ${cat === item.cat && (desc === item.label || desc === '') ? styles.quickCatActive : ''}`}
            style={cat === item.cat && (desc === item.label || desc === '') ? { borderColor: color, background: bgColor, color } : {}}
            onClick={() => selectCat(item)}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* DESCRIPTION */}
      <div className={styles.descRow}>
        <input
          className={styles.descInput}
          placeholder="Description (optional)"
          value={desc}
          onChange={e => setDesc(e.target.value)}
        />
        <button className={styles.scanBtn} onClick={() => setShowScanner(true)} title="Scan receipt">🧾</button>
      </div>

      {/* NUMPAD */}
      <div className={styles.numpad}>
        {[7,8,9,'C',4,5,6,'⌫',1,2,3,'.',0,'00',''].map((k, i) => (
          k === '' ? <div key={i} /> :
          <button
            key={i}
            className={`${styles.numKey} ${k === 'C' ? styles.numKeyClear : ''} ${k === '⌫' ? styles.numKeyBack : ''}`}
            onClick={() => numPress(k)}
          >
            {k}
          </button>
        ))}
      </div>

      {/* SAVE */}
      <button
        className={styles.saveBtn}
        style={{ background: done ? 'var(--accent)' : color, color: isIncome || done ? '#0a0a0f' : '#fff' }}
        onClick={handleSave}
        disabled={saving || !amount}
      >
        {done ? '✓ Saved!' : saving ? 'Saving...' : `${isIncome ? '+ Add Income' : '− Add Expense'} · ${s}${amount || '0'}`}
      </button>
    </div>
  )
}
