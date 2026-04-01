import styles from './LandingPage.module.css'

const FEATURES = [
  { icon: '📅', title: 'Calendar-based tracking', desc: 'See every peso in and out on a visual calendar. Know exactly where your money went each day.' },
  { icon: '⚡', title: 'Log expenses in seconds', desc: 'Tap a day, enter amount, pick category. Done. No complicated forms, no friction.' },
  { icon: '📊', title: 'Spending breakdown', desc: 'Pie charts and monthly comparisons show exactly where your money goes every month.' },
  { icon: '🎯', title: 'Budget limits', desc: 'Set category budgets. Get warned before you overspend on food, transport, or shopping.' },
  { icon: '🔔', title: 'Smart alerts', desc: 'Notifications for bills due, budget warnings, and savings milestones — guided, not spammy.' },
  { icon: '☁️', title: 'Syncs across devices', desc: 'Your data lives in the cloud. Log on your phone, review on your laptop. Always in sync.' },
]

export default function LandingPage({ onGetStarted }) {
  return (
    <div className={styles.page}>
      {/* NAV */}
      <nav className={styles.nav}>
        <div className={styles.navLogo}>Sentimo</div>
        <button className={styles.navCta} onClick={onGetStarted}>Get started free</button>
      </nav>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>Personal finance · Made for Filipinos</div>
        <h1 className={styles.heroTitle}>
          Bawat piso,<br />sinusubaybayan.
        </h1>
        <p className={styles.heroSub}>
          Track your income and expenses on a calendar. Know exactly where every peso goes.
          Built for Filipinos, free to use.
        </p>
        <div className={styles.heroBtns}>
          <button className={styles.btnPrimary} onClick={onGetStarted}>Start tracking for free</button>
          <div className={styles.heroNote}>No credit card · Free forever</div>
        </div>

        {/* MOCK STATS */}
        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <div className={styles.heroStatVal}>₱0</div>
            <div className={styles.heroStatLabel}>Cost to use</div>
          </div>
          <div className={styles.heroStatDiv} />
          <div className={styles.heroStat}>
            <div className={styles.heroStatVal}>2 taps</div>
            <div className={styles.heroStatLabel}>To log expense</div>
          </div>
          <div className={styles.heroStatDiv} />
          <div className={styles.heroStat}>
            <div className={styles.heroStatVal}>100%</div>
            <div className={styles.heroStatLabel}>Your data, secured</div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className={styles.features}>
        <div className={styles.sectionLabel}>Features</div>
        <h2 className={styles.sectionTitle}>Everything you need to manage your money</h2>
        <div className={styles.featureGrid}>
          {FEATURES.map((f, i) => (
            <div key={i} className={styles.featureCard}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <div className={styles.featureTitle}>{f.title}</div>
              <div className={styles.featureDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className={styles.howItWorks}>
        <div className={styles.sectionLabel}>How it works</div>
        <h2 className={styles.sectionTitle}>Simple by design</h2>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNum}>1</div>
            <div className={styles.stepText}>
              <div className={styles.stepTitle}>Sign up in seconds</div>
              <div className={styles.stepDesc}>Use your Google account or email. No forms, no hassle.</div>
            </div>
          </div>
          <div className={styles.stepArrow}>→</div>
          <div className={styles.step}>
            <div className={styles.stepNum}>2</div>
            <div className={styles.stepText}>
              <div className={styles.stepTitle}>Log income & expenses</div>
              <div className={styles.stepDesc}>Tap any day on the calendar. Add in 2 taps.</div>
            </div>
          </div>
          <div className={styles.stepArrow}>→</div>
          <div className={styles.step}>
            <div className={styles.stepNum}>3</div>
            <div className={styles.stepText}>
              <div className={styles.stepTitle}>See where money goes</div>
              <div className={styles.stepDesc}>Charts, breakdowns, and alerts keep you on track.</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <h2 className={styles.ctaTitle}>Ready to take control of your finances?</h2>
        <p className={styles.ctaSub}>Join thousands of Filipinos tracking their pesos with Sentimo.</p>
        <button className={styles.btnPrimary} onClick={onGetStarted}>Start for free →</button>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerLogo}>Sentimo</div>
        <div className={styles.footerTagline}>Bawat piso, sinusubaybayan.</div>
        <div className={styles.footerLinks}>
          <span onClick={onGetStarted} style={{ cursor: 'pointer' }}>Log in</span>
          <span>·</span>
          <span onClick={onGetStarted} style={{ cursor: 'pointer' }}>Sign up</span>
        </div>
        <div className={styles.footerCopy}>© {new Date().getFullYear()} Sentimo. Free personal finance tracker.</div>
      </footer>
    </div>
  )
}
