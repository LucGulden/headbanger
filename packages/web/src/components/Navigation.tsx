import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useNotificationsStore } from '../stores/notificationsStore'
import { useUserStore } from '../stores/userStore'
import { useAuthStore } from '../stores/useAuthStore'
import '../styles/nav.css'

function getAvatarHue(username: string): number {
  let hash = 0
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % 360
}

function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase()
}

export default function Navigation() {
  const { user, signOut } = useAuthStore()
  const { appUser } = useUserStore()
  const { unreadCount } = useNotificationsStore()
  const navigate = useNavigate()

  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)

  const username = appUser?.username || ''
  const avatarHue = getAvatarHue(username)
  const initials = getInitials(username)

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const handleSignOut = async () => {
    try {
      await signOut()
      setDropdownOpen(false)
      setMobileOpen(false)
      navigate('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const closeMobile = () => setMobileOpen(false)

  return (
    <>
      <header className="nav nav--scrolled" id="nav">
        <div className="nav__inner">
          {/* Logo */}
          <Link to="/" className="nav__logo" aria-label="HeadBanger Home">
            <svg className="nav__logo-icon" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <circle cx="20" cy="20" r="19" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="20" cy="20" r="13" stroke="currentColor" strokeWidth="1" />
              <circle cx="20" cy="20" r="7" stroke="currentColor" strokeWidth="0.75" />
              <circle cx="20" cy="20" r="2.5" fill="currentColor" />
              <line
                x1="20"
                y1="1"
                x2="20"
                y2="7"
                stroke="currentColor"
                strokeWidth="0.5"
                opacity="0.4"
              />
              <line
                x1="33"
                y1="20"
                x2="39"
                y2="20"
                stroke="currentColor"
                strokeWidth="0.5"
                opacity="0.4"
              />
            </svg>
            <span className="nav__logo-text">HeadBanger</span>
          </Link>

          {/* Desktop nav */}
          <nav className="nav__links" id="navLinks" aria-label="Main navigation">
            {user ? (
              <>
                {/* Search */}
                <Link to="/search" className="nav__action" aria-label="Search">
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <circle cx="8.5" cy="8.5" r="5.5" />
                    <line x1="12.5" y1="12.5" x2="17" y2="17" />
                  </svg>
                </Link>

                {/* Notifications */}
                <Link to="/notifications" className="nav__action" aria-label="Notifications">
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <path d="M10 2a5 5 0 015 5c0 5 2 6.5 2 6.5H3S5 12 5 7a5 5 0 015-5z" />
                    <path d="M7.5 15.5a2.5 2.5 0 005 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="nav__action-badge">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                <span className="nav__divider" />

                {/* User dropdown */}
                <div className="nav__user-wrap" ref={dropdownRef}>
                  <button
                    className={`nav__user ${dropdownOpen ? 'is-open' : ''}`}
                    onClick={() => setDropdownOpen((v) => !v)}
                    aria-haspopup="true"
                    aria-expanded={dropdownOpen}
                    style={{ '--avatar-hue': avatarHue } as React.CSSProperties}
                  >
                    <span className="nav__user-avatar">{initials}</span>
                    <span className="nav__user-name">{username}</span>
                    <svg
                      className="nav__user-chevron"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <polyline points="4,6 8,10 12,6" />
                    </svg>
                  </button>

                  <div
                    className={`nav__dropdown ${dropdownOpen ? 'is-open' : ''}`}
                    role="menu"
                    aria-label="User menu"
                    style={{ '--avatar-hue': avatarHue } as React.CSSProperties}
                  >
                    <div className="nav__dropdown-header">
                      <span className="nav__dropdown-avatar">{initials}</span>
                      <div className="nav__dropdown-info">
                        <span className="nav__dropdown-name">{username}</span>
                        <span className="nav__dropdown-handle">@{username}</span>
                      </div>
                    </div>

                    <Link
                      to={`/profile/${username}`}
                      className="nav__dropdown-link"
                      role="menuitem"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        aria-hidden="true"
                      >
                        <circle cx="8" cy="5.5" r="3.2" />
                        <path d="M1.5 15c0-3 2.9-5 6.5-5s6.5 2 6.5 5" />
                      </svg>
                      My Profile
                    </Link>

                    <Link
                      to="/settings"
                      className="nav__dropdown-link"
                      role="menuitem"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        aria-hidden="true"
                      >
                        <circle cx="8" cy="8" r="2.5" />
                        <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.3 3.3l1.4 1.4M11.3 11.3l1.4 1.4M3.3 12.7l1.4-1.4M11.3 4.7l1.4-1.4" />
                      </svg>
                      Settings
                    </Link>

                    <div className="nav__dropdown-divider" />

                    <button
                      className="nav__dropdown-link nav__dropdown-link--danger"
                      role="menuitem"
                      onClick={handleSignOut}
                    >
                      <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        aria-hidden="true"
                      >
                        <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3" />
                        <polyline points="10,11 14,8 10,5" />
                        <line x1="14" y1="8" x2="6" y2="8" />
                      </svg>
                      Log Out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/search" className="nav__link">
                  <svg
                    className="nav__link-icon"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <circle cx="8.5" cy="8.5" r="5.5" />
                    <line x1="12.5" y1="12.5" x2="17" y2="17" />
                  </svg>
                  Search
                </Link>
                <Link to="/login" className="nav__link">
                  Log in
                </Link>
                <Link to="/signup" className="nav__cta">
                  Sign up
                </Link>
              </>
            )}
          </nav>

          {/* Burger */}
          <button
            className={`nav__burger ${mobileOpen ? 'is-active' : ''}`}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <div className={`mobile-menu ${mobileOpen ? 'is-open' : ''}`} aria-hidden={!mobileOpen}>
        <nav className="mobile-menu__nav">
          {user ? (
            <>
              <div
                className="mobile-menu__user"
                style={{ '--avatar-hue': avatarHue } as React.CSSProperties}
              >
                <span className="mobile-menu__user-avatar">{initials}</span>
                <div className="mobile-menu__user-info">
                  <span className="mobile-menu__user-name">{username}</span>
                  <span className="mobile-menu__user-handle">@{username}</span>
                </div>
              </div>
              <Link to="/" className="mobile-menu__link" onClick={closeMobile}>
                Feed
              </Link>
              <Link to="/search" className="mobile-menu__link" onClick={closeMobile}>
                Search
              </Link>
              <Link to="/notifications" className="mobile-menu__link" onClick={closeMobile}>
                Notifications
              </Link>
              <Link to={`/profile/${username}`} className="mobile-menu__link" onClick={closeMobile}>
                My Profile
              </Link>
              <Link to="/settings" className="mobile-menu__link" onClick={closeMobile}>
                Settings
              </Link>
              <button
                className="mobile-menu__link mobile-menu__link--danger"
                onClick={handleSignOut}
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link to="/search" className="mobile-menu__link" onClick={closeMobile}>
                Search
              </Link>
              <Link to="/login" className="mobile-menu__link" onClick={closeMobile}>
                Log in
              </Link>
              <Link to="/signup" className="mobile-menu__link" onClick={closeMobile}>
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </>
  )
}
