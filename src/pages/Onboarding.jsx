import { useState } from 'react'
import { fsSetProfile } from '../lib/firestore'
import { CURRENCIES, PAY_SCHEDULES } from '../lib/utils'
import styles from './Onboarding.module.css'

const STEPS = ['welcome', 'salary', 'currency', 'done']

export default function Onboarding({ user, onDone }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ salary: '', paySchedule: 'semi-monthly', currency: 'PHP' })
  const [saving, setSaving] = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleFinish() {
    setSaving(true)
    try {
      await fsSetProfile(user.uid, {
        salary: parseFloat(form.salary) || 0,
        paySchedule: form.paySchedule,
        currency: form.currency,
      })
    } catch (e) { console.error(e) }
    setSaving(false)
    onDone()
  }

  const name = user.displayName?.split(' ')[0] || 'there'
  const curr = CURRENCIES.find(c => c.code === form.currency)

  return (
    <div className={styles.screen}>
      <div className={styles.card}>

        {/* PROGRESS DOTS */}
        <div className={styles.dots}>
          {STEPS.map((_, i) => (
            <div key={i} className={`${styles.dot} ${i <= step ? styles.dotActive : ''}`} />
          ))}
        </div>

        {/* STEP 0 — WELCOME */}
        {step === 0 && (
          <div className={styles.stepWrap}>
            <div className={styles.logo}>Sentimo</div>
            <div className={styles.stepTitle}>Welcome, {name}! 👋</div>
            <div className={styles.stepSub}>
              Let's set up your profile so Sentimo can accurately track your finances.
              Takes less than a minute.
            </div>
            <div className={styles.featureList}>
              <div className={styles.feature}><span className={styles.featureIcon}>📅</span><span>Calendar-based expense tracking</span></div>
              <div className={styles.feature}><span className={styles.featureIcon}>📊</span><span>Spending breakdown & charts</span></div>
              <div className={styles.feature}><span className={styles.featureIcon}>🎯</span><span>Budget limits & savings goals</span></div>
            </div>
            <button className={styles.btnNext} onClick={() => setStep(1)}>Get started →</button>
          </div>
        )}

        {/* STEP 1 — SALARY */}
        {step === 1 && (
          <div className={styles.stepWrap}>
            <div className={styles.stepEmoji}>💼</div>
            <div className={styles.stepTitle}>What's your monthly salary?</div>
            <div className={styles.stepSub}>This helps Sentimo calculate your savings rate and track income accurately.</div>
            <div className={styles.inputGroup}>
              <label>Monthly salary</label>
              <input type="number" min="0" placeholder="e.g. 23000" value={form.salary} onChange={e => set('salary', e.target.value)} autoFocus />
            </div>
            <div className={styles.inputGroup}>
              <label>Pay schedule</label>
              <select value={form.paySchedule} onChange={e => set('paySchedule', e.target.value)}>
                {PAY_SCHEDULES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className={styles.btnRow}>
              <button className={styles.btnSkip} onClick={() => setStep(2)}>Skip</button>
              <button className={styles.btnNext} onClick={() => setStep(2)}>Next →</button>
            </div>
          </div>
        )}

        {/* STEP 2 — CURRENCY */}
        {step === 2 && (
          <div className={styles.stepWrap}>
            <div className={styles.stepEmoji}>💱</div>
            <div className={styles.stepTitle}>Choose your currency</div>
            <div className={styles.stepSub}>All amounts across the app will use this currency.</div>
            <div className={styles.currencyGrid}>
              {CURRENCIES.map(c => (
                <button
                  key={c.code}
                  className={`${styles.currencyBtn} ${form.currency === c.code ? styles.currencyBtnActive : ''}`}
                  onClick={() => set('currency', c.code)}
                >
                  <span className={styles.currencySymbol}>{c.symbol}</span>
                  <span className={styles.currencyCode}>{c.code}</span>
                </button>
              ))}
            </div>
            <div className={styles.btnRow}>
              <button className={styles.btnSkip} onClick={() => setStep(1)}>← Back</button>
              <button className={styles.btnNext} onClick={() => setStep(3)}>Next →</button>
            </div>
          </div>
        )}

        {/* STEP 3 — DONE */}
        {step === 3 && (
          <div className={styles.stepWrap}>
            <div className={styles.stepEmoji}>✅</div>
            <div className={styles.stepTitle}>You're all set!</div>
            <div className={styles.stepSub}>Here's your profile summary:</div>
            <div className={styles.summary}>
              {form.salary && (
                <div className={styles.summaryRow}>
                  <span>Monthly salary</span>
                  <span>{curr?.symbol}{parseFloat(form.salary).toLocaleString()}</span>
                </div>
              )}
              <div className={styles.summaryRow}>
                <span>Pay schedule</span>
                <span>{PAY_SCHEDULES.find(p => p.value === form.paySchedule)?.label}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Currency</span>
                <span>{curr?.symbol} — {curr?.label}</span>
              </div>
            </div>
            <button className={styles.btnFinish} onClick={handleFinish} disabled={saving}>
              {saving ? 'Setting up...' : 'Start using Sentimo →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
