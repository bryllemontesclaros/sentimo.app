import { useState } from 'react'
import { fsAdd, fsDel } from '../lib/firestore'
import { fmt, today } from '../lib/utils'
import styles from './Page.module.css'

export default function Income({ user, data }) {
  const [form, setForm] = useState({ desc: '', amount: '', date: today(), cat: 'Salary', recur: '' })
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleAdd() {
    if (!form.desc || !form.amount || !form.date) return alert('Please fill all fields')
    await fsAdd(user.uid, 'income', { ...form, amount: parseFloat(form.amount), type: 'income' })
    setForm(f => ({ ...f, desc: '', amount: '' }))
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>Income</div>
        <div className={styles.sub}>Salary, freelance, and other income sources</div>
      </div>
      <div className={styles.formCard}>
        <div className={styles.cardTitle}>Add income</div>
        <div className={`${styles.formRow} ${styles.col3}`}>
          <div className={styles.formGroup}><label>Description</label><input placeholder="e.g. Monthly salary" value={form.desc} onChange={e => set('desc', e.target.value)} /></div>
          <div className={styles.formGroup}><label>Amount (₱)</label><input type="number" placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)} /></div>
          <div className={styles.formGroup}><label>Date</label><input type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>
        </div>
        <div className={`${styles.formRow} ${styles.col3}`}>
          <div className={styles.formGroup}><label>Category</label>
            <select value={form.cat} onChange={e => set('cat', e.target.value)}>
              {['Salary','Freelance','Business','Investment','13th Month','Bonus','Other'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className={styles.formGroup}><label>Recurring</label>
            <select value={form.recur} onChange={e => set('recur', e.target.value)}>
              <option value="">One-time</option>
              <option value="weekly">Weekly</option>
              <option value="semi-monthly">Semi-monthly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className={styles.formGroup} style={{ justifyContent: 'flex-end' }}>
            <button className={styles.btnAdd} onClick={handleAdd}>Add income</button>
          </div>
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.cardTitle}>Income entries</div>
        <div className={styles.tableWrap}>
          <table>
            <thead><tr><th>Description</th><th>Category</th><th>Date</th><th>Recurring</th><th>Amount</th><th></th></tr></thead>
            <tbody>
              {!data.income.length
                ? <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text3)', padding: '2rem' }}>No income entries yet</td></tr>
                : data.income.map(r => (
                  <tr key={r._id}>
                    <td style={{ color: 'var(--text)' }}>{r.desc}</td>
                    <td><span className={`${styles.badge} ${styles.badgeIncome}`}>{r.cat}</span></td>
                    <td>{r.date}</td>
                    <td>{r.recur ? <span className={`${styles.badge} ${styles.badgeRecurring}`}>{r.recur}</span> : '—'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{fmt(r.amount)}</td>
                    <td><button className={styles.delBtn} onClick={() => fsDel(user.uid, 'income', r._id)}>✕</button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
