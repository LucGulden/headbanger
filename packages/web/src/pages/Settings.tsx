import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import EditProfileForm from '../components/EditProfileForm'
import { getCurrentUser } from '../lib/api/users'
import { useAnimFade } from '../hooks/useAnimFade'
import type { User } from '@headbanger/shared'
import '../styles/settings.css'

type SettingsSection = 'profile' | 'account' | 'notifications' | 'privacy'

const NAV_ITEMS: { id: SettingsSection; label: string; icon: React.ReactNode }[] = [
  {
    id: 'profile',
    label: 'Profile',
    icon: (
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        aria-hidden="true"
      >
        <circle cx="10" cy="7" r="4" />
        <path d="M2 18c0-3.3 3.6-6 8-6s8 2.7 8 6" />
      </svg>
    ),
  },
  {
    id: 'account',
    label: 'Account',
    icon: (
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        aria-hidden="true"
      >
        <circle cx="10" cy="10" r="3" />
        <path d="M10 1v1.5M10 17.5V19M1 10h1.5M17.5 10H19M3.05 3.05l1.06 1.06M15.89 15.89l1.06 1.06M3.05 16.95l1.06-1.06M15.89 4.11l1.06-1.06" />
      </svg>
    ),
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: (
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        aria-hidden="true"
      >
        <path d="M10 2a5 5 0 015 5c0 5 2 6.5 2 6.5H3S5 12 5 7a5 5 0 015-5z" />
        <path d="M7.5 15.5a2.5 2.5 0 005 0" />
      </svg>
    ),
  },
  {
    id: 'privacy',
    label: 'Privacy',
    icon: (
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        aria-hidden="true"
      >
        <rect x="3" y="9" width="14" height="9" rx="2" />
        <path d="M6 9V6a4 4 0 018 0v3" />
        <circle cx="10" cy="14" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
]

function PlaceholderSection({
  title,
  desc,
  icon,
}: {
  title: string
  desc: string
  icon: React.ReactNode
}) {
  return (
    <div className="settings__card anim-fade">
      <h2 className="settings__card-title">{title}</h2>
      <p className="settings__card-desc">{desc}</p>
      <div className="settings__placeholder">
        {icon}
        <span>Coming soon</span>
      </div>
    </div>
  )
}

export default function Settings() {
  const { user: authUser } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile')
  const [toast, setToast] = useState<{ visible: boolean; message: string; error?: boolean }>({
    visible: false,
    message: '',
  })

  useAnimFade([!loading])

  useEffect(() => {
    const loadUser = async () => {
      if (!authUser) {
        setLoading(false)
        return
      }
      const userData = await getCurrentUser()
      setUser(userData)
      setLoading(false)
    }
    loadUser()
  }, [authUser])

  const showToast = (message: string, error = false) => {
    setToast({ visible: true, message, error })
    setTimeout(() => setToast({ visible: false, message: '' }), 3500)
  }

  const handleSuccess = () => {
    showToast('Profile updated successfully.')
    setTimeout(() => window.location.reload(), 2000)
  }

  if (loading) {
    return (
      <main className="settings">
        <div className="settings__banner">
          <div className="settings__banner-bg" />
        </div>
      </main>
    )
  }

  if (!authUser || !user) return null

  return (
    <main className="settings">
      {/* BANNER */}
      <div className="settings__banner">
        <div className="settings__banner-bg" aria-hidden="true">
          <div className="settings__banner-grain" />
          <div className="settings__banner-glow settings__banner-glow--1" />
          <div className="settings__banner-glow settings__banner-glow--2" />
          <div className="settings__banner-grooves" />
        </div>
        <div className="settings__banner-content">
          <h1 className="settings__title anim-fade" data-delay="0">
            Settings
          </h1>
          <p className="settings__subtitle anim-fade" data-delay="1">
            Manage your profile and preferences
          </p>
        </div>
      </div>

      {/* CONTENT */}
      <div className="settings__content">
        <div className="settings__layout">
          {/* SIDEBAR */}
          <aside className="settings__sidebar anim-fade" data-delay="2">
            <nav className="settings__nav" aria-label="Settings sections">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  className={`settings__nav-link ${activeSection === item.id ? 'is-active' : ''}`}
                  onClick={() => setActiveSection(item.id)}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* MAIN */}
          <div className="settings__main">
            {/* PROFILE */}
            <section
              className={`settings__section ${activeSection === 'profile' ? 'is-active' : ''}`}
              aria-label="Profile settings"
              hidden={activeSection !== 'profile'}
            >
              <EditProfileForm
                user={user}
                onSuccess={handleSuccess}
                onError={(msg) => showToast(msg, true)}
              />
            </section>

            {/* ACCOUNT */}
            <section
              className={`settings__section ${activeSection === 'account' ? 'is-active' : ''}`}
              aria-label="Account settings"
              hidden={activeSection !== 'account'}
            >
              <PlaceholderSection
                title="Account Settings"
                desc="Manage your email, password, and connected accounts."
                icon={
                  <svg
                    viewBox="0 0 48 48"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    aria-hidden="true"
                  >
                    <circle cx="24" cy="24" r="10" />
                    <path d="M24 6v3M24 39v3M6 24h3M39 24h3M11.93 11.93l2.12 2.12M33.95 33.95l2.12 2.12M11.93 36.07l2.12-2.12M33.95 14.05l2.12-2.12" />
                  </svg>
                }
              />
            </section>

            {/* NOTIFICATIONS */}
            <section
              className={`settings__section ${activeSection === 'notifications' ? 'is-active' : ''}`}
              aria-label="Notification settings"
              hidden={activeSection !== 'notifications'}
            >
              <PlaceholderSection
                title="Notification Preferences"
                desc="Choose how and when you want to be notified."
                icon={
                  <svg
                    viewBox="0 0 48 48"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    aria-hidden="true"
                  >
                    <path d="M24 6a10 10 0 0110 10c0 10 4 13 4 13H10s4-3 4-13a10 10 0 0110-10z" />
                    <path d="M19 31a5 5 0 0010 0" />
                  </svg>
                }
              />
            </section>

            {/* PRIVACY */}
            <section
              className={`settings__section ${activeSection === 'privacy' ? 'is-active' : ''}`}
              aria-label="Privacy settings"
              hidden={activeSection !== 'privacy'}
            >
              <PlaceholderSection
                title="Privacy & Safety"
                desc="Control who can see your collection and interact with you."
                icon={
                  <svg
                    viewBox="0 0 48 48"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    aria-hidden="true"
                  >
                    <rect x="10" y="22" width="28" height="18" rx="4" />
                    <path d="M16 22v-6a8 8 0 0116 0v6" />
                    <circle cx="24" cy="32" r="3" fill="currentColor" stroke="none" />
                  </svg>
                }
              />
            </section>
          </div>
        </div>
      </div>

      {/* TOAST */}
      <div
        className={`settings__toast ${toast.visible ? 'is-visible' : ''}`}
        style={toast.error ? { borderColor: 'var(--wishlist)' } : undefined}
      >
        <svg
          className="settings__toast-icon"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          style={toast.error ? { color: 'var(--wishlist)' } : undefined}
        >
          {toast.error ? (
            <>
              <circle cx="10" cy="10" r="8" />
              <line x1="7" y1="7" x2="13" y2="13" />
              <line x1="13" y1="7" x2="7" y2="13" />
            </>
          ) : (
            <>
              <circle cx="10" cy="10" r="8" />
              <polyline points="6.5,10 9,12.5 13.5,7.5" />
            </>
          )}
        </svg>
        <span className="settings__toast-text">{toast.message}</span>
      </div>
    </main>
  )
}
