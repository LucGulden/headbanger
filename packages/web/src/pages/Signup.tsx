import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { validateUsername, checkUsernameAvailability } from '../lib/api/users'
import { useAuthStore } from '../stores/useAuthStore'
import { useAnimFade } from '../hooks/useAnimFade'
import '../styles/auth.css'

function getPasswordStrength(password: string): number {
  if (!password) return 0
  let score = 0
  if (password.length >= 8) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++
  return score === 0 && password.length > 0 ? 1 : score
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']

export default function SignupPage() {
  const navigate = useNavigate()
  const { signUp, error: authError, user } = useAuthStore()
  useAnimFade()

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [termsChecked, setTermsChecked] = useState(false)
  const [termsError, setTermsError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const passwordStrength = getPasswordStrength(formData.password)

  useEffect(() => {
    if (user) navigate('/')
  }, [user, navigate])

  const validateField = (name: string, value: string): string => {
    if (name === 'username') {
      if (!value) return 'Username is required'
      if (value.length < 3) return 'At least 3 characters'
      if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'Letters, numbers, hyphens and underscores only'
    }
    if (name === 'email') {
      if (!value) return 'Email is required'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address'
    }
    if (name === 'password') {
      if (!value) return 'Password is required'
      if (value.length < 8) return 'At least 8 characters required'
    }
    if (name === 'confirmPassword') {
      if (!value) return 'Please confirm your password'
      if (value !== formData.password) return 'Passwords do not match'
    }
    return ''
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const updated = { ...formData, [name]: value }
    setFormData(updated)
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }))
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const allTouched = { username: true, email: true, password: true }
    setTouched(allTouched)

    const newErrors = {
      username: validateField('username', formData.username),
      email: validateField('email', formData.email),
      password: validateField('password', formData.password),
      confirmPassword: validateField('confirmPassword', formData.confirmPassword),
    }
    setErrors(newErrors)

    if (!termsChecked) {
      setTermsError('You must agree to the terms')
    }

    if (Object.values(newErrors).some(Boolean) || !termsChecked) return

    try {
      setCheckingUsername(true)
      const available = await checkUsernameAvailability(formData.username)
      if (!available) {
        setErrors((prev) => ({ ...prev, username: 'This username is already taken' }))
        return
      }
    } catch {
      setErrors((prev) => ({ ...prev, username: 'Unable to check availability' }))
      return
    } finally {
      setCheckingUsername(false)
    }

    try {
      setLoading(true)
      await signUp({
        email: formData.email,
        username: formData.username,
        password: formData.password,
      })
    } catch (error) {
      console.error('Signup error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fieldState = (name: string) => {
    if (!touched[name]) return ''
    return errors[name] ? 'has-error' : 'has-success'
  }

  return (
    <main className="auth">
      {/* Decorative panel */}
      <aside className="auth__panel" aria-hidden="true">
        <div className="auth__panel-bg">
          <div className="auth__panel-grain" />
          <div className="auth__panel-glow auth__panel-glow--1" />
          <div className="auth__panel-glow auth__panel-glow--2" />
        </div>
        <div className="auth__panel-content">
          <div className="auth__panel-vinyl">
            <div className="auth__vinyl-disc">
              <div className="auth__vinyl-groove" />
              <div className="auth__vinyl-groove auth__vinyl-groove--2" />
              <div className="auth__vinyl-groove auth__vinyl-groove--3" />
              <div className="auth__vinyl-label">
                <div className="auth__vinyl-hole" />
              </div>
            </div>
          </div>
          <blockquote className="auth__panel-quote">
            <p>
              &ldquo;Join 42,000 collectors who track, share, and discover vinyl together.&rdquo;
            </p>
            <footer>
              <span className="auth__panel-stat">100% free</span>
              <span className="auth__panel-dot">&middot;</span>
              <span className="auth__panel-stat">No ads, ever</span>
            </footer>
          </blockquote>
        </div>
      </aside>

      {/* Signup form */}
      <section className="auth__form-section">
        <div className="auth__form-wrapper">
          <div className="auth__form-header anim-fade" data-delay="0">
            <h1 className="auth__title">Create your account</h1>
            <p className="auth__subtitle">Start building your collection — free forever</p>
          </div>

          {authError && (
            <div className="form-field has-error" style={{ marginBottom: '1rem' }}>
              <span className="form-field__error" style={{ opacity: 1, minHeight: 'auto' }}>
                {authError.message}
              </span>
            </div>
          )}

          <form className="auth__form anim-fade" data-delay="1" onSubmit={handleSubmit} noValidate>
            {/* Username */}
            <div className={`form-field ${fieldState('username')}`}>
              <label className="form-field__label" htmlFor="signup-username">
                Username
              </label>
              <div className="form-field__input-wrap">
                <svg
                  className="form-field__icon"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  aria-hidden="true"
                >
                  <circle cx="10" cy="7" r="4" />
                  <path d="M2 18c0-4 3.5-7 8-7s8 3 8 7" />
                </svg>
                <input
                  className="form-field__input"
                  type="text"
                  id="signup-username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="your-handle"
                  autoComplete="username"
                  required
                  minLength={3}
                  maxLength={24}
                />
              </div>
              <span className="form-field__hint">
                Letters, numbers, hyphens and underscores only
              </span>
              <span className="form-field__error" role="alert">
                {touched.username ? errors.username : ''}
              </span>
            </div>

            {/* Email */}
            <div className={`form-field ${fieldState('email')}`}>
              <label className="form-field__label" htmlFor="signup-email">
                Email address
              </label>
              <div className="form-field__input-wrap">
                <svg
                  className="form-field__icon"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  aria-hidden="true"
                >
                  <rect x="2" y="4" width="16" height="12" rx="2" />
                  <polyline points="2,4 10,11 18,4" />
                </svg>
                <input
                  className="form-field__input"
                  type="email"
                  id="signup-email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
              <span className="form-field__error" role="alert">
                {touched.email ? errors.email : ''}
              </span>
            </div>

            {/* Password */}
            <div className={`form-field ${fieldState('password')}`}>
              <label className="form-field__label" htmlFor="signup-password">
                Password
              </label>
              <div className="form-field__input-wrap">
                <svg
                  className="form-field__icon"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  aria-hidden="true"
                >
                  <rect x="3" y="9" width="14" height="9" rx="2" />
                  <path d="M6 9V6a4 4 0 018 0v3" />
                  <circle cx="10" cy="13.5" r="1.5" fill="currentColor" stroke="none" />
                </svg>
                <input
                  className="form-field__input"
                  type={showPassword ? 'text' : 'password'}
                  id="signup-password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className={`form-field__toggle ${showPassword ? 'is-visible' : ''}`}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  <svg
                    className="form-field__toggle-show"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  >
                    <path d="M1 10s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" />
                    <circle cx="10" cy="10" r="3" />
                  </svg>
                  <svg
                    className="form-field__toggle-hide"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  >
                    <path d="M1 10s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" />
                    <circle cx="10" cy="10" r="3" />
                    <line x1="3" y1="17" x2="17" y2="3" />
                  </svg>
                </button>
              </div>
              <div
                className="form-field__strength"
                data-level={formData.password ? passwordStrength : 0}
              >
                <div className="form-field__strength-bar">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <span className="form-field__strength-text">
                  {formData.password ? STRENGTH_LABELS[passwordStrength] : ''}
                </span>
              </div>
              <span className="form-field__error" role="alert">
                {touched.password ? errors.password : ''}
              </span>
            </div>

            {/* Confirm Password */}
            <div className={`form-field ${fieldState('confirmPassword')}`}>
              <label className="form-field__label" htmlFor="signup-confirm-password">
                Confirm password
              </label>
              <div className="form-field__input-wrap">
                <svg
                  className="form-field__icon"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  aria-hidden="true"
                >
                  <rect x="3" y="9" width="14" height="9" rx="2" />
                  <path d="M6 9V6a4 4 0 018 0v3" />
                  <circle cx="10" cy="13.5" r="1.5" fill="currentColor" stroke="none" />
                </svg>
                <input
                  className="form-field__input"
                  type="password"
                  id="signup-confirm-password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  required
                />
              </div>
              <span className="form-field__error" role="alert">
                {touched.confirmPassword ? errors.confirmPassword : ''}
              </span>
            </div>

            {/* Terms */}
            <div className={`form-field form-field--check ${termsError ? 'has-error' : ''}`}>
              <label className="form-check">
                <input
                  type="checkbox"
                  id="signup-terms"
                  name="terms"
                  checked={termsChecked}
                  onChange={(e) => {
                    setTermsChecked(e.target.checked)
                    if (e.target.checked) setTermsError('')
                  }}
                  required
                />
                <span className="form-check__box">
                  <svg
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="2.5,6 5,8.5 9.5,3.5" />
                  </svg>
                </span>
                <span className="form-check__text">
                  I agree to the <a href="#terms">Terms of Service</a> and{' '}
                  <a href="#privacy">Privacy Policy</a>
                </span>
              </label>
              <span
                className="form-field__error"
                role="alert"
                style={{ opacity: termsError ? 1 : 0, minHeight: '1.1rem' }}
              >
                {termsError}
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className={`auth__submit btn btn--primary btn--full ${loading || checkingUsername ? 'is-loading' : ''}`}
            >
              <span className="auth__submit-text">Create account</span>
              <span className="auth__submit-loader" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </button>
          </form>

          <div className="auth__divider anim-fade" data-delay="2">
            <span>or sign up with</span>
          </div>

          <div className="auth__socials anim-fade" data-delay="2">
            <button type="button" className="auth__social-btn">
              <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </button>
            <button type="button" className="auth__social-btn">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                width="20"
                height="20"
              >
                <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.18 0-.36-.02-.53-.06-.01-.18-.04-.56-.04-.95 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.32.06.65.06 1.02h.22zm3.44 16.42c-.26.6-.39.87-.73 1.4-.48.73-1.15 1.64-1.98 1.65-.74.01-1.17-.48-2.18-.48s-1.49.5-2.29.51c-.83.01-1.46-.99-1.94-1.72-1.34-2.05-1.48-4.46-.65-5.74.59-.9 1.51-1.43 2.39-1.43.89 0 1.45.5 2.19.5.71 0 1.14-.5 2.16-.5.78 0 1.58.42 2.16 1.16-1.9 1.04-1.59 3.76.37 4.55h-.5z" />
              </svg>
              Apple
            </button>
          </div>

          <p className="auth__switch anim-fade" data-delay="3">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </section>
    </main>
  )
}
