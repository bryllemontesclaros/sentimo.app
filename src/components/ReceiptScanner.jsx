import { useState, useRef } from 'react'
import rStyles from './ReceiptScanner.module.css'

// OCR.space free API — no key needed for basic usage
const OCR_API = 'https://api.ocr.space/parse/image'
const OCR_KEY = 'K81823456' // free tier key

function parseReceiptText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  // Extract amount — look for largest number with decimal
  let amount = null
  const amountPatterns = [
    /total[:\s]+[₱$]?([\d,]+\.?\d*)/i,
    /amount[:\s]+[₱$]?([\d,]+\.?\d*)/i,
    /[₱$]([\d,]+\.\d{2})/,
    /(\d{1,6}\.\d{2})/,
  ]
  for (const pat of amountPatterns) {
    for (const line of lines) {
      const m = line.match(pat)
      if (m) {
        const val = parseFloat(m[1].replace(',', ''))
        if (val > 0 && (!amount || val > amount)) amount = val
      }
    }
  }

  // Extract date
  let date = null
  const datePatterns = [
    /(\d{4}[-/]\d{2}[-/]\d{2})/,
    /(\d{2}[-/]\d{2}[-/]\d{4})/,
    /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/,
  ]
  for (const pat of datePatterns) {
    for (const line of lines) {
      const m = line.match(pat)
      if (m) {
        try {
          const d = new Date(m[1])
          if (!isNaN(d)) { date = d.toISOString().split('T')[0]; break }
        } catch {}
      }
    }
    if (date) break
  }

  // Extract merchant/description — first non-empty, non-number line
  let desc = null
  for (const line of lines) {
    if (line.length > 2 && !/^[\d\s₱$.,:-]+$/.test(line) && line.length < 60) {
      desc = line; break
    }
  }

  // Guess category from keywords
  const text_lower = text.toLowerCase()
  let cat = 'Other'
  if (/restaurant|food|meal|dining|cafe|coffee|pizza|burger|kfc|jollibee|mcdonald/i.test(text_lower)) cat = 'Food & Dining'
  else if (/grab|uber|taxi|bus|train|toll|parking|fuel|gas|petrol/i.test(text_lower)) cat = 'Transport'
  else if (/mall|shop|store|market|supermarket|sm|robinson|puregold|savemore/i.test(text_lower)) cat = 'Shopping'
  else if (/hospital|clinic|pharmacy|drugstore|medicine|health/i.test(text_lower)) cat = 'Health'
  else if (/meralco|electric|water|internet|pldt|globe|smart|telco/i.test(text_lower)) cat = 'Bills'
  else if (/salon|barber|spa|beauty|personal/i.test(text_lower)) cat = 'Personal Care'

  return { amount, date, desc, cat }
}

export default function ReceiptScanner({ onResult, onClose }) {
  const [status, setStatus] = useState('idle') // idle | loading | done | error
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const fileRef = useRef(null)
  const cameraRef = useRef(null)

  async function processImage(file) {
    if (!file) return
    setStatus('loading')
    setPreview(URL.createObjectURL(file))

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('apikey', OCR_KEY)
      formData.append('language', 'eng')
      formData.append('isOverlayRequired', 'false')

      const res = await fetch(OCR_API, { method: 'POST', body: formData })
      const json = await res.json()

      if (json.IsErroredOnProcessing || !json.ParsedResults?.length) {
        throw new Error(json.ErrorMessage?.[0] || 'OCR failed')
      }

      const text = json.ParsedResults[0].ParsedText
      const parsed = parseReceiptText(text)
      setResult(parsed)
      setStatus('done')
    } catch (e) {
      setErrorMsg('Could not read receipt. Try a clearer photo.')
      setStatus('error')
    }
  }

  function handleFile(e) { if (e.target.files[0]) processImage(e.target.files[0]) }

  function handleUse() {
    if (result && onResult) onResult(result)
  }

  function retry() { setStatus('idle'); setPreview(null); setResult(null); setErrorMsg('') }

  return (
    <div className={rStyles.wrap}>
      <div className={rStyles.header}>
        <div className={rStyles.title}>Scan Receipt</div>
        <button className={rStyles.closeBtn} onClick={onClose}>✕</button>
      </div>

      {status === 'idle' && (
        <div className={rStyles.uploadArea}>
          <div className={rStyles.uploadIcon}>🧾</div>
          <div className={rStyles.uploadTitle}>Take a photo or upload a receipt</div>
          <div className={rStyles.uploadSub}>Amount, date, and category will be auto-detected</div>
          <div className={rStyles.btnRow}>
            <button className={rStyles.btnCamera} onClick={() => cameraRef.current?.click()}>
              📷 Camera
            </button>
            <button className={rStyles.btnUpload} onClick={() => fileRef.current?.click()}>
              📂 Upload
            </button>
          </div>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: 'none' }} />
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
        </div>
      )}

      {status === 'loading' && (
        <div className={rStyles.loadingArea}>
          {preview && <img src={preview} className={rStyles.preview} alt="Receipt" />}
          <div className={rStyles.loadingText}>
            <div className={rStyles.spinner} />
            Reading receipt...
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className={rStyles.errorArea}>
          {preview && <img src={preview} className={rStyles.preview} alt="Receipt" />}
          <div className={rStyles.errorMsg}>⚠ {errorMsg}</div>
          <button className={rStyles.btnRetry} onClick={retry}>Try again</button>
        </div>
      )}

      {status === 'done' && result && (
        <div className={rStyles.resultArea}>
          {preview && <img src={preview} className={rStyles.preview} alt="Receipt" />}
          <div className={rStyles.resultTitle}>Receipt detected</div>
          <div className={rStyles.resultFields}>
            <div className={rStyles.resultField}>
              <span className={rStyles.fieldLabel}>Amount</span>
              <span className={rStyles.fieldVal} style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>
                {result.amount ? result.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 }) : 'Not detected'}
              </span>
            </div>
            <div className={rStyles.resultField}>
              <span className={rStyles.fieldLabel}>Date</span>
              <span className={rStyles.fieldVal}>{result.date || 'Not detected'}</span>
            </div>
            <div className={rStyles.resultField}>
              <span className={rStyles.fieldLabel}>Merchant</span>
              <span className={rStyles.fieldVal}>{result.desc || 'Not detected'}</span>
            </div>
            <div className={rStyles.resultField}>
              <span className={rStyles.fieldLabel}>Category</span>
              <span className={rStyles.fieldVal}>{result.cat}</span>
            </div>
          </div>
          <div className={rStyles.resultNote}>Review before saving — OCR may not be 100% accurate.</div>
          <div className={rStyles.btnRow}>
            <button className={rStyles.btnRetry} onClick={retry}>Retake</button>
            <button className={rStyles.btnUse} onClick={handleUse} disabled={!result.amount}>
              Use this receipt →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
