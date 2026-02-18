import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__top">
          <div className="footer__brand">
            <Link to="/" className="nav__logo" aria-label="HeadBanger Home">
              <svg className="nav__logo-icon" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <circle cx="20" cy="20" r="19" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="20" cy="20" r="13" stroke="currentColor" strokeWidth="1" />
                <circle cx="20" cy="20" r="7" stroke="currentColor" strokeWidth="0.75" />
                <circle cx="20" cy="20" r="2.5" fill="currentColor" />
              </svg>
              <span className="nav__logo-text">HeadBanger</span>
            </Link>
            <p className="footer__tagline">Your vinyl collection, social.</p>
          </div>

          <div className="footer__columns">
            <div className="footer__col">
              <h4 className="footer__col-title">Community</h4>
              <ul className="footer__list">
                <li>
                  <a href="#discord">Discord</a>
                </li>
                <li>
                  <a href="#blog">Blog</a>
                </li>
                <li>
                  <a href="#contact">Contact</a>
                </li>
              </ul>
            </div>
            <div className="footer__col">
              <h4 className="footer__col-title">Product</h4>
              <ul className="footer__list">
                <li>
                  <a href="#mobile-app">Mobile App</a>
                </li>
                <li>
                  <Link to="/search">Search</Link>
                </li>
              </ul>
            </div>
            <div className="footer__col">
              <h4 className="footer__col-title">Legal</h4>
              <ul className="footer__list">
                <li>
                  <a href="#privacy">Privacy Policy</a>
                </li>
                <li>
                  <a href="#terms">Terms of Service</a>
                </li>
                <li>
                  <a href="#cookies">Cookies</a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <span className="footer__copy">
            &copy; {new Date().getFullYear()} HeadBanger. All rights reserved.
          </span>
          <div className="footer__socials">
            <a href="#twitter" className="footer__social" aria-label="Twitter / X">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="#instagram" className="footer__social" aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a href="#discord" className="footer__social" aria-label="Discord">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
