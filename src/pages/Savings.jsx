import { useState } from 'react'
import { fsAdd, fsDel, fsUpdate } from '../lib/firestore'
import { fmt, today, confirmDelete, validateAmount } from '../lib/utils'
import styles from './Page.module.css'

export default function Savings({ user, data, symbol }) {
  const s = symbol || '₱'
  const [form, setForm] = useState({ name: '', target: '', current: '', date: '' })
  const [contribs, setContribs] = useState({})
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleAdd() {
    if (!form.name || !form.target) return alert('Please fill required fields')
    await fsAdd(user.uid, 'goals', {
      name: form.name,
      target: parseFloat(form.target),
      current: parseFloat(form.current) || 0,
      date: form.date,
    })
    setForm({ name: '', target: '', current: '', date: '' })
  }

  async function handleContrib(g) {
    const val = parseFloat(contribs[g._id] || 0)
    if (!val) return
    const newVal = Math.min(g.target, (g.current || 0) + val)
    await fsUpdate(user.uid, 'goals', g._id, { current: newVal })
    setContribs(c => ({ ...c, [g._id]: '' }))
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>Savings Goals</div>
        <div className={styles.sub}>Track progress toward your financial goals</div>
      </div>

      <div className={styles.formCard}>
        <div className={styles.cardTitle}>New savings goal</div>
        <div className={`${styles.formRow} ${styles.col3}`}>
          <div className={styles.formGroup}><label>Goal name</label><input placeholder="e.g. Emergency fund" value={form.name} onChange={e => set('name', e.target.value)} /></div>
          <div className={styles.formGroup}><label>Target amount ({s})</label><input type="number" min="0" placeholder="0.00" value={form.target} onChange={e => set('target', e.target.value)} /></div>
          <div className={styles.formGroup}><label>Target date</label><input type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>
        </div>
        <div className={`${styles.formRow} ${styles.col2}`}>
          <div className={styles.formGroup}><label>Current saved ({s})</label><input type="number" min="0" placeholder="0.00" value={form.current} onChange={e => set('current', e.target.value)} /></div>
          <div className={styles.formGroup} style={{ justifyContent: 'flex-end' }}>
            <button className={styles.btnAdd} onClick={handleAdd}>Add goal</button>
          </div>
        </div>
      </div>

      {!data.goals.length
        ? <div className={styles.empty}>No savings goals yet. Add your first goal above.</div>
        : data.goals.map(g => {
          const pct = Math.min(100, Math.round(((g.current || 0) / (g.target || 1)) * 100))
          return (
            <div key={g._id} className={styles.goalCard}>
              <div className={styles.goalHeader}>
                <div className={styles.goalName}>{g.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>{pct}%</span>
                  <button className={styles.delBtn} onClick={() => confirmDelete(g.name) && fsDel(user.uid, 'goals', g._id)}>✕</button>
                </div>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={`${styles.progressFill} ${pct >= 80 ? styles.almost : ''}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className={styles.goalMeta}>
                <span className={styles.goalSaved}>{fmt(g.current || 0, s)} saved</span>
                <span>of {fmt(g.target, s)}</span>
                {g.date && <span>{g.date}</span>}
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <input
                  type="number"
                  min="0"
                  placeholder={`Add contribution (${s})`}
                  value={contribs[g._id] || ''}
                  onChange={e => setContribs(c => ({ ...c, [g._id]: e.target.value }))}
                  style={{
                    flex: 1, padding: '7px 10px',
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', color: 'var(--text)',
                    fontSize: 12, outline: 'none', fontFamily: 'var(--font-body)',
                  }}
                />
                <button
                  onClick={() => handleContrib(g)}
                  style={{
                    padding: '7px 14px', background: 'var(--accent)', color: '#0a0a0f',
                    border: 'none', borderRadius: 'var(--radius-sm)',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >Add</button>
              </div>
            </div>
          )
        })}
    </div>
  )
}
