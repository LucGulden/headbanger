import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

/* ─── Reusable scroll-triggered wrapper ─── */
function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ─── SVG Vinyl Record ─── */
function VinylRecord({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Outer disc */}
      <circle cx="200" cy="200" r="195" fill="#111" />
      <circle cx="200" cy="200" r="190" fill="#1a1a1a" />

      {/* Grooves */}
      {[170, 155, 140, 125, 110, 95, 80].map((r) => (
        <circle
          key={r}
          cx="200"
          cy="200"
          r={r}
          fill="none"
          stroke="#2a2a2a"
          strokeWidth="0.8"
          opacity="0.6"
        />
      ))}
      {[180, 165, 150, 135, 120, 105, 90].map((r) => (
        <circle
          key={r}
          cx="200"
          cy="200"
          r={r}
          fill="none"
          stroke="#222"
          strokeWidth="0.5"
          opacity="0.4"
        />
      ))}

      {/* Shine highlight */}
      <ellipse
        cx="160"
        cy="140"
        rx="80"
        ry="120"
        fill="url(#vinyl-shine)"
        opacity="0.08"
        transform="rotate(-30 160 140)"
      />

      {/* Label */}
      <circle cx="200" cy="200" r="60" fill="#E67E22" />
      <circle cx="200" cy="200" r="58" fill="url(#label-gradient)" />

      {/* Label texture rings */}
      <circle cx="200" cy="200" r="50" fill="none" stroke="#D67118" strokeWidth="0.5" opacity="0.3" />
      <circle cx="200" cy="200" r="40" fill="none" stroke="#D67118" strokeWidth="0.5" opacity="0.3" />

      {/* Center hole */}
      <circle cx="200" cy="200" r="8" fill="#1A1A1A" />
      <circle cx="200" cy="200" r="6" fill="#111" />

      {/* Label text */}
      <text
        x="200"
        y="188"
        textAnchor="middle"
        fill="#1A1A1A"
        fontSize="11"
        fontWeight="800"
        fontFamily="'Outfit', sans-serif"
        letterSpacing="3"
      >
        HEADBANGER
      </text>
      <text
        x="200"
        y="204"
        textAnchor="middle"
        fill="#1A1A1A"
        fontSize="7"
        fontWeight="500"
        fontFamily="'Outfit', sans-serif"
        letterSpacing="1"
        opacity="0.7"
      >
        SOCIAL VINYL CLUB
      </text>
      <line x1="170" y1="194" x2="230" y2="194" stroke="#1A1A1A" strokeWidth="0.5" opacity="0.3" />

      <defs>
        <radialGradient id="vinyl-shine">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="label-gradient" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#F4A460" />
          <stop offset="100%" stopColor="#E67E22" />
        </radialGradient>
      </defs>
    </svg>
  )
}

/* ─── Feature Card ─── */
function FeatureCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode
  title: string
  description: string
  delay: number
}) {
  return (
    <Reveal delay={delay}>
      <div className="group relative overflow-hidden rounded-2xl border border-[var(--background-lighter)]/50 bg-[var(--background-light)]/60 p-8 backdrop-blur-sm transition-all duration-500 hover:border-[var(--primary)]/40 hover:bg-[var(--background-light)]">
        {/* Hover glow */}
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[var(--primary)] opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-10" />

        <div className="relative z-10">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            {icon}
          </div>
          <h3 className="mb-3 text-xl font-semibold text-[var(--foreground)]">{title}</h3>
          <p className="text-[15px] leading-relaxed text-[var(--foreground-muted)]">{description}</p>
        </div>
      </div>
    </Reveal>
  )
}

/* ─── Stat Counter ─── */
function StatItem({ value, label, delay }: { value: string; label: string; delay: number }) {
  return (
    <Reveal delay={delay} className="text-center">
      <div className="text-gradient-warm font-display text-4xl font-bold sm:text-5xl">{value}</div>
      <div className="mt-2 text-sm font-medium tracking-wide text-[var(--foreground-muted)]">
        {label}
      </div>
    </Reveal>
  )
}

/* ─── Testimonial ─── */
function Testimonial({
  quote,
  name,
  handle,
  delay,
}: {
  quote: string
  name: string
  handle: string
  delay: number
}) {
  return (
    <Reveal delay={delay}>
      <div className="rounded-2xl border border-[var(--background-lighter)]/50 bg-[var(--background-light)]/40 p-6 backdrop-blur-sm">
        <p className="mb-4 text-[15px] leading-relaxed text-[var(--foreground)]/90">
          &ldquo;{quote}&rdquo;
        </p>
        <div>
          <div className="text-sm font-semibold text-[var(--foreground)]">{name}</div>
          <div className="text-xs text-[var(--foreground-muted)]">{handle}</div>
        </div>
      </div>
    </Reveal>
  )
}

/* ━━━━━━━━━━━━━━━━━━ LANDING PAGE ━━━━━━━━━━━━━━━━━━ */
export default function Landing() {
  return (
    <div className="relative overflow-hidden bg-[var(--background)]">
      {/* ─── HERO ─── */}
      <section className="grain-overlay relative min-h-[90vh] overflow-hidden px-6 pb-20 pt-16 sm:pt-24">
        {/* Background elements */}
        <div className="pointer-events-none absolute inset-0">
          {/* Radial gradient */}
          <div className="absolute left-1/2 top-0 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[var(--primary)] opacity-[0.04] blur-[120px]" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(var(--foreground-muted) 1px, transparent 1px), linear-gradient(90deg, var(--foreground-muted) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
            {/* Left: Copy */}
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/5 px-4 py-1.5"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
                <span className="text-xs font-medium tracking-wide text-[var(--primary)]">
                  LE RESEAU SOCIAL DU VINYLE
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-[var(--foreground)] sm:text-6xl lg:text-7xl"
              >
                Votre collection,
                <br />
                <span className="text-gradient-warm">votre communaute.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.35 }}
                className="mt-6 max-w-lg text-lg leading-relaxed text-[var(--foreground-muted)] sm:text-xl"
              >
                Cataloguez vos vinyles, partagez vos trouvailles et connectez-vous avec des
                passionnes qui vivent la musique autrement.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-10 flex flex-wrap items-center gap-4"
              >
                <Link
                  to="/signup"
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-[var(--primary)] px-8 py-4 text-base font-semibold text-white transition-all hover:shadow-lg hover:shadow-[var(--primary)]/25"
                >
                  <span className="relative z-10">Rejoindre HeadBanger</span>
                  <svg
                    className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary-hover)] to-[var(--primary)] opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>

                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--foreground)]/10 px-8 py-4 text-base font-medium text-[var(--foreground)] transition-all hover:border-[var(--foreground)]/25 hover:bg-[var(--background-light)]"
                >
                  Se connecter
                </Link>
              </motion.div>
            </div>

            {/* Right: Vinyl illustration */}
            <div className="relative flex items-center justify-center lg:justify-end">
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: -30 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                {/* Glow behind vinyl */}
                <div className="absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--primary)] opacity-[0.08] blur-[80px]" />

                {/* Spinning vinyl */}
                <div className="animate-vinyl-spin-slow relative h-[320px] w-[320px] sm:h-[420px] sm:w-[420px]">
                  <VinylRecord className="h-full w-full drop-shadow-2xl" />
                </div>

                {/* Floating badge - top right */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.9, type: 'spring' }}
                  className="absolute -right-2 top-8 rounded-xl border border-[var(--background-lighter)] bg-[var(--background-light)]/90 px-4 py-3 shadow-xl backdrop-blur-md sm:right-0 sm:top-12"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]/15 text-sm">
                      <svg className="h-4 w-4 text-[var(--primary)]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[var(--foreground)]">+2.4k vinyles</div>
                      <div className="text-[10px] text-[var(--foreground-muted)]">cette semaine</div>
                    </div>
                  </div>
                </motion.div>

                {/* Floating badge - bottom left */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 1.1, type: 'spring' }}
                  className="absolute -left-4 bottom-12 rounded-xl border border-[var(--background-lighter)] bg-[var(--background-light)]/90 px-4 py-3 shadow-xl backdrop-blur-md sm:bottom-16 sm:left-0"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {['#E67E22', '#3498db', '#2ecc71'].map((color) => (
                        <div
                          key={color}
                          className="h-7 w-7 rounded-full border-2 border-[var(--background-light)]"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[var(--foreground)]">Communaute active</div>
                      <div className="text-[10px] text-[var(--foreground-muted)]">8k+ collectionneurs</div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF BAR ─── */}
      <section className="border-y border-[var(--background-lighter)]/50 bg-[var(--background-light)]/30 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <StatItem value="12k+" label="Collectionneurs" delay={0} />
            <StatItem value="84k+" label="Vinyles catalogues" delay={0.1} />
            <StatItem value="320k+" label="Partages" delay={0.2} />
            <StatItem value="4.9" label="Note moyenne" delay={0.3} />
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="relative px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
                Fonctionnalites
              </span>
              <h2 className="font-display mt-4 text-3xl font-bold text-[var(--foreground)] sm:text-5xl">
                Tout pour vivre votre passion
              </h2>
              <p className="mt-4 text-[var(--foreground-muted)]">
                Des outils penses par et pour les collectionneurs de vinyles.
              </p>
            </div>
          </Reveal>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              delay={0.1}
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              }
              title="Collection digitale"
              description="Cataloguez chaque vinyle avec ses details : artiste, album, annee, etat, pressage. Votre collection, toujours accessible."
            />
            <FeatureCard
              delay={0.2}
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              }
              title="Communaute passionnee"
              description="Suivez d'autres collectionneurs, commentez leurs trouvailles et partagez vos coups de coeur avec ceux qui comprennent."
            />
            <FeatureCard
              delay={0.3}
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              }
              title="Wishlist & decouvertes"
              description="Creez votre liste d'envies, explorez les collections des autres et trouvez votre prochaine pepite musicale."
            />
            <FeatureCard
              delay={0.4}
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
              }
              title="Partages & discussions"
              description="Publiez vos acquisitions, racontez l'histoire derriere chaque vinyle et echangez avec la communaute."
            />
            <FeatureCard
              delay={0.5}
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              }
              title="Recherche intelligente"
              description="Trouvez n'importe quel artiste, album ou vinyle en un instant. Filtrez par genre, annee ou rarete."
            />
            <FeatureCard
              delay={0.6}
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              }
              title="Notifications en temps reel"
              description="Soyez alerte des nouveaux likes, commentaires et quand vos collectionneurs preferes ajoutent un vinyle."
            />
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="relative border-y border-[var(--background-lighter)]/50 bg-[var(--background-light)]/20 px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
                Comment ca marche
              </span>
              <h2 className="font-display mt-4 text-3xl font-bold text-[var(--foreground)] sm:text-5xl">
                Trois etapes, c'est tout.
              </h2>
            </div>
          </Reveal>

          <div className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Creez votre profil',
                desc: 'Inscrivez-vous en quelques secondes et personnalisez votre profil de collectionneur.',
              },
              {
                step: '02',
                title: 'Ajoutez vos vinyles',
                desc: 'Recherchez et ajoutez vos vinyles a votre collection ou votre wishlist.',
              },
              {
                step: '03',
                title: 'Partagez & decouvrez',
                desc: 'Publiez vos trouvailles, suivez des collectionneurs et explorez de nouvelles pepites.',
              },
            ].map((item, i) => (
              <Reveal key={item.step} delay={i * 0.15}>
                <div className="relative text-center">
                  <div className="font-display mx-auto mb-4 text-6xl font-bold text-[var(--primary)] opacity-20">
                    {item.step}
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-[var(--foreground)]">{item.title}</h3>
                  <p className="text-[15px] text-[var(--foreground-muted)]">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
                Temoignages
              </span>
              <h2 className="font-display mt-4 text-3xl font-bold text-[var(--foreground)] sm:text-5xl">
                Ils en parlent mieux que nous
              </h2>
            </div>
          </Reveal>

          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Testimonial
              delay={0.1}
              quote="Depuis que j'utilise HeadBanger, j'ai decouvert plus de vinyles en un mois qu'en un an de brocantes. La communaute est incroyable."
              name="Marie L."
              handle="@marievinyle"
            />
            <Testimonial
              delay={0.2}
              quote="Enfin un reseau social qui comprend les collectionneurs. Pouvoir partager mes trouvailles et voir celles des autres, c'est exactement ce qu'il manquait."
              name="Thomas D."
              handle="@thomaswax"
            />
            <Testimonial
              delay={0.3}
              quote="La wishlist est geniale. J'ai reussi a trouver trois pressages originaux grâce aux recommandations de la communaute HeadBanger."
              name="Sophie R."
              handle="@sophierecords"
            />
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="relative px-6 py-24 sm:py-32">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[500px] w-[500px] rounded-full bg-[var(--primary)] opacity-[0.04] blur-[120px]" />
        </div>

        <Reveal>
          <div className="relative mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-8 h-20 w-20 animate-vinyl-spin-slow">
              <VinylRecord className="h-full w-full" />
            </div>

            <h2 className="font-display text-4xl font-bold text-[var(--foreground)] sm:text-6xl">
              Pret a faire tourner
              <br />
              <span className="text-gradient-warm">le vinyle ?</span>
            </h2>

            <p className="mx-auto mt-6 max-w-lg text-lg text-[var(--foreground-muted)]">
              Rejoignez des milliers de passionnes qui partagent deja leur amour pour les vinyles sur
              HeadBanger.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/signup"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-[var(--primary)] px-10 py-4 text-lg font-semibold text-white transition-all hover:shadow-lg hover:shadow-[var(--primary)]/25"
              >
                <span className="relative z-10">Creer un compte gratuit</span>
                <svg
                  className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary-hover)] to-[var(--primary)] opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>

              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--foreground)]/10 px-10 py-4 text-lg font-medium text-[var(--foreground)] transition-all hover:border-[var(--foreground)]/25 hover:bg-[var(--background-light)]"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
