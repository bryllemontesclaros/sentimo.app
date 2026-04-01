import { useState } from 'react'
import { fsAdd, fsDel, fsUpdate } from '../lib/firestore'
import { fmt } from '../lib/utils'
import styles from './Page.module.css'
import accStyles from './Accounts.module.css'

const ACCOUNT_TYPES = ['Cash', 'Bank', 'E-wallet', 'Credit Card', 'Investment', 'Other']
const ACCOUNT_ICONS = { Cash: '💵', Bank: '🏦', 'E-wallet': '📱', 'Credit Card': '💳', Investment: '📈', Other: '🏷' }
const COLORS = [
  { name: 'Green', value: '#22d87a' },
  { name: 'Blue', value: '#6eb5ff' },
  { name: 'Amber', value: '#ffb347' },
  { name: 'Red', value: '#ff5370' },
  { name: 'Purple', value: '#b48eff' },
  { name: 'Teal', value: '#2dd4bf' },
  { name: 'Pink', value: '#f472b6' },
  { name: 'Gray', value: '#9090b0' },
]

const EMPTY_FORM = { name: '', type: 'Cash', balance: '', color: '#22d87a', notes: '' }

export default function Accounts({ user, data, symbol }) {
  const s = symbol || '₱'
  const accounts = data.accounts || []
  const [form, setForm] = useState(EMPTY_FORM)
  const [editAccount, setEditAccount] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editBalance, setEditBalance] = useState({})

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function openAdd() { setEditAccount(null); setForm(EMPTY_FORM); setShowModal(true) }
  function openEdit(acc) {
    setEditAccount(acc)
    setForm({ name: acc.name, type: acc.type, balance: acc.balance, color: acc.color || '#22d87a', notes: acc.notes || '' })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name || form.balance === '') return alert('Please fill all fields')
    const payload = { name: form.name, type: form.type, balance: parseFloat(form.balance) || 0, color: form.color, notes: form.notes }
    if (editAccount) {
      await fsUpdate(user.uid, 'accounts', editAccount._id, payload)
    } else {
      await fsAdd(user.uid, 'accounts', payload)
    }
    setShowModal(false); setEditAccount(null); setForm(EMPTY_FORM)
  }

  async function handleDel(id) { await fsDel(user.uid, 'accounts', id) }

  async function handleBalanceUpdate(acc) {
    const val = parseFloat(editBalance[acc._id])
    if (isNaN(val)) return
    await fsUpdate(user.uid, 'accounts', acc._id, { balance: val })
    setEditBalance(b => ({ ...b, [acc._id]: '' }))
  }

  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>Accounts</div>
        <div className={styles.sub}>Track your cash, bank, and e-wallet balances</div>
      </div>

      {/* TOTAL */}
      <div className={accStyles.totalCard}>
        <div className={accStyles.totalLabel}>Total Balance</div>
        <div className={accStyles.totalVal}>{fmt(totalBalance, s)}</div>
        <div className={accStyles.totalSub}>{accounts.length} account{accounts.length !== 1 ? 's' : ''}</div>
      </div>

      {/* ADD BUTTON */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className={styles.btnAdd} style={{ width: 'auto', padding: '9px 20px' }} onClick={openAdd}>+ Add account</button>
      </div>

      {/* ACCOUNTS LIST */}
      {!accounts.length
        ? <div className={styles.empty} style={{ padding: '3rem 0' }}>
            No accounts yet. Add your first account above.
          </div>
        : <div className={accStyles.accountsGrid}>
            {accounts.map(acc => (
              <div key={acc._id} className={accStyles.accountCard}>
                <div className={accStyles.accountTop}>
                  <div className={accStyles.accountIcon} style={{ background: (acc.color || '#22d87a') + '22', color: acc.color || '#22d87a' }}>
                    {ACCOUNT_ICONS[acc.type] || '🏷'}
                  </div>
                  <div className={accStyles.accountInfo}>
                    <div className={accStyles.accountName}>{acc.name}</div>
                    <div className={accStyles.accountType}>
                      <span className={accStyles.typeDot} style={{ background: acc.color || '#22d87a' }} />
                      {acc.type}
                    </div>
                  </div>
                  <div className={accStyles.accountActions}>
                    <button className={accStyles.editBtn} onClick={() => openEdit(acc)}>Edit</button>
                    <button className={accStyles.delBtn} onClick={() => handleDel(acc._id)}>✕</button>
                  </div>
                </div>

                <div className={accStyles.accountBalance} style={{ color: acc.color || 'var(--accent)' }}>
                  {fmt(acc.balance || 0, s)}
                </div>

                {acc.notes && <div className={accStyles.accountNotes}>{acc.notes}</div>}

                {/* QUICK BALANCE UPDATE */}
                <div className={accStyles.quickUpdate}>
                  <input
                    type="number"
                    placeholder="Update balance"
                    value={editBalance[acc._id] || ''}
                    onChange={e => setEditBalance(b => ({ ...b, [acc._id]: e.target.value }))}
                    className={accStyles.quickInput}
                  />
                  <button className={accStyles.quickBtn} onClick={() => handleBalanceUpdate(acc)}>Update</button>
                </div>
              </div>
            ))}
          </div>
      }

      {/* MODAL */}
      {showModal && (
        <div className={accStyles.overlay} onClick={e => { if (e.target === e.currentTarget) { setShowModal(false); setEditAccount(null) } }}>
          <div className={accStyles.modal}>
            <div className={accStyles.modalHeader}>
              <div className={accStyles.modalTitle}>{editAccount ? 'Edit account' : 'Add account'}</div>
              <button onClick={() => { setShowModal(false); setEditAccount(null) }} className={accStyles.modalClose}>✕</button>
            </div>

            <div className={`${styles.formRow} ${styles.col2}`} style={{ marginBottom: 12 }}>
              <div className={styles.formGroup}>
                <label>Account name</label>
                <input placeholder="e.g. BDO Savings" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label>Type</label>
                <select value={form.type} onChange={e => set('type', e.target.value)}>
                  {ACCOUNT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className={`${styles.formRow} ${styles.col2}`} style={{ marginBottom: 12 }}>
              <div className={styles.formGroup}>
                <label>Current balance ({s})</label>
                <input type="number" min="0" placeholder="0.00" value={form.balance} onChange={e => set('balance', e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label>Notes (optional)</label>
                <input placeholder="e.g. Emergency only" value={form.notes} onChange={e => set('notes', e.target.value)} />
              </div>
            </div>

            <div className={styles.formGroup} style={{ marginBottom: '1.25rem' }}>
              <label>Color</label>
              <div className={accStyles.colorGrid}>
                {COLORS.map(c => (
                  <button key={c.value} onClick={() => set('color', c.value)} className={`${accStyles.colorBtn} ${form.color === c.value ? accStyles.colorBtnActive : ''}`} style={{ background: c.value }} title={c.name} />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setShowModal(false); setEditAccount(null) }} className={accStyles.btnCancel}>Cancel</button>
              <button onClick={handleSave} className={styles.btnAdd} style={{ flex: 2 }}>{editAccount ? 'Save changes' : 'Add account'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
