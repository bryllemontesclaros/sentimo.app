import { useState, useEffect } from 'react'
import { fsDel, fsSetProfile } from '../lib/firestore'
import { fmt, CURRENCIES, PAY_SCHEDULES } from '../lib/utils'
import { generateMonthlyReport } from '../lib/report'
import styles from './Page.module.css'
import settStyles from './Settings.module.css'

const VERSION = '1.0.0'

export default function Settings({ user, data, profile, symbol }) {
  const s = symbol || '₱'
  const [profileForm, setProfileForm] = useState({ salary: '', paySchedule: 'semi-monthly', currency: 'PHP' })
  const [profileSaved, setProfileSaved] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const [exportDone, setExportDone] = useState(false)
  const [rates, setRates] = useState(null)
  const [ratesLoading, setRatesLoading] = useState(false)

  useEffect(() => {
    if (profile && Object.keys(profile).length > 0) {
      setProfileForm({
        salary: profile.salary || '',
        paySchedule: profile.paySchedule || 'semi-monthly',
        currency: profile.currency || 'PHP',
      })
    }
  }, [profile])

  async function fetchRates() {
    setRatesLoading(true)
    try {
      const res = await fetch('https://api.exchangerate-api.com/v4/latest/PHP')
      const json = await res.json()
      setRates(json.rates)
    } catch {
      setRates(null)
    } finally { setRatesLoading(false) }
  }

  function setPF(k, v) { setProfileForm(f => ({ ...f, [k]: v })) }

  async function handleSaveProfile() {
    await fsSetProfile(user.uid, profileForm)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 3000)
  }

  function exportCSV() {
    const rows = [
      ['Type', 'Description', 'Category', 'Amount', 'Date', 'Recurring'],
      ...data.income.map(t => ['Income', t.desc, t.cat, t.amount, t.date, t.recur || '']),
      ...data.expenses.map(t => ['Expense', t.desc, t.cat, t.amount, t.date, t.recur || '']),
      ...data.bills.map(t => ['Bill', t.name, t.cat, t.amount, `Day ${t.due}`, t.freq]),
    ]
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sentimo-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setExportDone(true)
    setTimeout(() => setExportDone(false), 3000)
  }

  function exportJSON() {
    const payload = { income: data.income, expenses: data.expenses, bills: data.bills, goals: data.goals, profile, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sentimo-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleReset() {
    const confirmed = window.confirm('Reset ALL data? This permanently deletes all transactions, bills, and savings goals. Cannot be undone.')
    if (!confirmed) return
    setResetting(true)
    try {
      for (const item of data.income) await fsDel(user.uid, 'income', item._id)
      for (const item of data.expenses) await fsDel(user.uid, 'expenses', item._id)
      for (const item of data.bills) await fsDel(user.uid, 'bills', item._id)
      for (const item of data.goals) await fsDel(user.uid, 'goals', item._id)
      setResetDone(true)
      setTimeout(() => setResetDone(false), 4000)
    } catch (e) {
      alert('Reset failed. Please try again.')
    } finally { setResetting(false) }
  }

  const totalTx = data.income.length + data.expenses.length
  const savingsTotal = data.goals.reduce((sum, g) => sum + (g.current || 0), 0)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>Settings</div>
        <div className={styles.sub}>Manage your salary profile, currency, and data</div>
      </div>

      {/* SALARY PROFILE */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Salary & Pay Schedule</div>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
          Set your monthly salary and pay schedule so Sentimo can accurately track your income and savings rate.
        </p>

        <div className={`${styles.formRow} ${styles.col2}`} style={{ marginBottom: 12 }}>
          <div className={styles.formGroup}>
            <label>Monthly Salary</label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 23000"
              value={profileForm.salary}
              onChange={e => setPF('salary', e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Pay Schedule</label>
            <select value={profileForm.paySchedule} onChange={e => setPF('paySchedule', e.target.value)}>
              {PAY_SCHEDULES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>

        <div className={styles.formGroup} style={{ marginBottom: '1.25rem' }}>
          <label>Currency</label>
          <select value={profileForm.currency} onChange={e => setPF('currency', e.target.value)}>
            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} — {c.label}</option>)}
          </select>
        </div>

        {profileSaved && (
          <div style={{ background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, marginBottom: '1rem' }}>
            ✓ Profile saved successfully.
          </div>
        )}

        <button className={styles.btnAdd} style={{ width: 'auto', padding: '9px 24px' }} onClick={handleSaveProfile}>
          Save profile
        </button>
      </div>

      {/* DATA SUMMARY */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Your data</div>
        <div className={settStyles.summaryGrid}>
          <div className={settStyles.summaryItem}><div className={settStyles.summaryVal}>{data.income.length}</div><div className={settStyles.summaryLabel}>Income entries</div></div>
          <div className={settStyles.summaryItem}><div className={settStyles.summaryVal}>{data.expenses.length}</div><div className={settStyles.summaryLabel}>Expenses</div></div>
          <div className={settStyles.summaryItem}><div className={settStyles.summaryVal}>{data.bills.length}</div><div className={settStyles.summaryLabel}>Bills</div></div>
          <div className={settStyles.summaryItem}><div className={settStyles.summaryVal}>{data.goals.length}</div><div className={settStyles.summaryLabel}>Savings goals</div></div>
          <div className={settStyles.summaryItem}><div className={settStyles.summaryVal} style={{ color: 'var(--accent)' }}>{fmt(savingsTotal, s)}</div><div className={settStyles.summaryLabel}>Total saved</div></div>
          <div className={settStyles.summaryItem}><div className={settStyles.summaryVal}>{totalTx}</div><div className={settStyles.summaryLabel}>Total transactions</div></div>
        </div>
      </div>

      {/* EXPORT */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Export data</div>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: '1rem', lineHeight: 1.6 }}>
          Download a copy of all your transactions, bills, and savings goals.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className={settStyles.btnExport} onClick={exportCSV}>{exportDone ? '✓ Downloaded' : '↓ Export as CSV'}</button>
          <button className={settStyles.btnExport} onClick={exportJSON}>↓ Export as JSON</button>
          <button className={settStyles.btnExport} onClick={() => {
            const now = new Date()
            generateMonthlyReport(data, profile, now.getFullYear(), now.getMonth(), s)
          }}>🖨 Monthly Report PDF</button>
        </div>
      </div>

      {/* RESET */}
      <div className={styles.card} style={{ borderColor: 'rgba(255,83,112,0.3)' }}>
        <div className={styles.cardTitle} style={{ color: 'var(--red)' }}>Reset data</div>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: '1rem', lineHeight: 1.6 }}>
          Permanently delete all transactions, bills, and savings goals. Your account stays active but all financial data will be erased. <strong style={{ color: 'var(--red)' }}>This cannot be undone.</strong>
        </p>
        {resetDone && (
          <div style={{ background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, marginBottom: '1rem' }}>
            ✓ All data has been reset successfully.
          </div>
        )}
        <button className={settStyles.btnReset} onClick={handleReset} disabled={resetting}>
          {resetting ? 'Resetting...' : 'Reset all data'}
        </button>
      </div>

      {/* EXCHANGE RATES */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>
          Live Exchange Rates
          <button className={settStyles.btnExport} onClick={fetchRates} disabled={ratesLoading} style={{ fontSize: 12, padding: '5px 12px' }}>
            {ratesLoading ? 'Loading...' : '↻ Refresh'}
          </button>
        </div>
        {!rates ? (
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>
            Click Refresh to load current PHP exchange rates.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
            {['USD','EUR','GBP','JPY','SGD','AUD','CAD','HKD','KRW','CNY'].map(code => (
              rates[code] && (
                <div key={code} style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>1 PHP →</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
                    {rates[code].toFixed(4)} {code}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>Source: exchangerate-api.com · Rates are indicative</div>
      </div>

      {/* ABOUT */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>About</div>
        <div className={settStyles.aboutBlock}>
          <div className={settStyles.aboutLogo}>Sentimo</div>
          <div className={settStyles.aboutTagline}>Bawat piso, sinusubaybayan.</div>
          <div className={settStyles.aboutMeta}>Version {VERSION}</div>
          <div className={settStyles.aboutDesc}>
            A personal finance tracker built for Filipinos. Track your salary, expenses, bills, and savings goals — all synced in real-time across devices.
          </div>
          <div className={settStyles.aboutUser}>Logged in as <strong>{user.displayName || user.email}</strong></div>
        </div>
      </div>
    </div>
  )
}
