import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import SearchAlbumsTab from '../components/SearchAlbumsTab'
import SearchArtistsTab from '../components/SearchArtistsTab'
import SearchUsersTab from '../components/SearchUsersTab'
import { useAnimFade } from '../hooks/useAnimFade'
import '../styles/search.css'

type SearchTab = 'albums' | 'artists' | 'users'

const HINTS = ['Radiohead', 'Kind of Blue', 'Daft Punk', 'Björk']

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [activeTab, setActiveTab] = useState<SearchTab>('albums')
  const [counts, setCounts] = useState<{
    albums: number | null
    artists: number | null
    users: number | null
  }>({ albums: null, artists: null, users: null })
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  const inputRef = useRef<HTMLInputElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useAnimFade()

  const hasQuery = query.trim().length > 0
  const allLoaded = counts.albums !== null && counts.artists !== null && counts.users !== null
  const totalResults = (counts.albums ?? 0) + (counts.artists ?? 0) + (counts.users ?? 0)
  const showNoResults = hasQuery && allLoaded && totalResults === 0

  const handleInput = (val: string) => {
    setInputValue(val)
    setCounts({ albums: null, artists: null, users: null })
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setQuery(val), 150)
  }

  const handleClear = () => {
    setInputValue('')
    setCounts({ albums: null, artists: null, users: null })
    setQuery('')
    inputRef.current?.focus()
  }

  const handleHint = (hint: string) => {
    setInputValue(hint)
    setCounts({ albums: null, artists: null, users: null })
    setQuery(hint)
    inputRef.current?.focus()
  }

  // Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const displayTab = useMemo<SearchTab>(() => {
    if (!allLoaded) return activeTab
    if ((counts[activeTab] ?? 0) > 0) return activeTab
    if ((counts.albums ?? 0) > 0) return 'albums'
    if ((counts.artists ?? 0) > 0) return 'artists'
    if ((counts.users ?? 0) > 0) return 'users'
    return activeTab
  }, [counts, allLoaded, activeTab])

  const positionIndicator = useCallback((btn: HTMLButtonElement) => {
    if (!tabsRef.current) return
    const parentRect = tabsRef.current.getBoundingClientRect()
    const btnRect = btn.getBoundingClientRect()
    setIndicatorStyle({ left: btnRect.left - parentRect.left, width: btnRect.width })
  }, [])

  useEffect(() => {
    if (!tabsRef.current) return
    const activeBtn = tabsRef.current.querySelector<HTMLButtonElement>('.search-tab.is-active')
    if (activeBtn) positionIndicator(activeBtn)
  }, [displayTab, positionIndicator])

  useEffect(() => {
    const handleResize = () => {
      if (!tabsRef.current) return
      const activeBtn = tabsRef.current.querySelector<HTMLButtonElement>('.search-tab.is-active')
      if (activeBtn) positionIndicator(activeBtn)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [positionIndicator])

  const switchTab = (tab: SearchTab, btn: HTMLButtonElement) => {
    setActiveTab(tab)
    positionIndicator(btn)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const tabs: SearchTab[] = ['albums', 'artists', 'users']
    const currentIndex = tabs.indexOf(displayTab)
    let nextIndex = -1
    if (e.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length
    else if (e.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') nextIndex = 0
    else if (e.key === 'End') nextIndex = tabs.length - 1
    if (nextIndex >= 0) {
      e.preventDefault()
      const btns = tabsRef.current?.querySelectorAll<HTMLButtonElement>('.search-tab')
      if (btns?.[nextIndex]) {
        btns[nextIndex].focus()
        switchTab(tabs[nextIndex], btns[nextIndex])
      }
    }
  }

  return (
    <main className="search-page">
      {/* HERO */}
      <section className="search-hero">
        <div className="search-hero__bg" aria-hidden="true">
          <div className="search-hero__glow search-hero__glow--1" />
          <div className="search-hero__glow search-hero__glow--2" />
          <div className="search-hero__grooves" />
        </div>
        <div className="search-hero__inner">
          <h1 className="search-hero__title anim-fade" data-delay="0">
            <span>Explore the</span>
            <span className="search-hero__title-accent">collection.</span>
          </h1>
          <p className="search-hero__subtitle anim-fade" data-delay="1">
            Find albums, discover artists, and connect with collectors who share your taste.
          </p>
          <div className="search-bar anim-fade" data-delay="2">
            <div className="search-bar__inner">
              <svg
                className="search-bar__icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <circle cx="10.5" cy="10.5" r="7" />
                <line x1="15.5" y1="15.5" x2="21" y2="21" />
              </svg>
              <input
                ref={inputRef}
                className="search-bar__input"
                type="search"
                value={inputValue}
                onChange={(e) => handleInput(e.target.value)}
                placeholder="Search albums, artists, or users..."
                autoComplete="off"
                aria-label="Search HeadBanger"
              />
              {inputValue && (
                <button
                  className="search-bar__clear"
                  onClick={handleClear}
                  aria-label="Clear search"
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <line x1="5" y1="5" x2="15" y2="15" />
                    <line x1="15" y1="5" x2="5" y2="15" />
                  </svg>
                </button>
              )}
            </div>
            <div className="search-bar__glow" />
          </div>
        </div>
      </section>

      {/* RESULTS */}
      <section className="search-results">
        {/* Tabs */}
        <div className="search-tabs-wrap">
          <div
            className="search-tabs"
            ref={tabsRef}
            role="tablist"
            aria-label="Search categories"
            onKeyDown={handleKeyDown}
          >
            {(
              [
                {
                  id: 'albums',
                  label: 'Albums',
                  icon: (
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      aria-hidden="true"
                    >
                      <circle cx="10" cy="10" r="8" />
                      <circle cx="10" cy="10" r="3" />
                      <circle cx="10" cy="10" r="1" fill="currentColor" stroke="none" />
                    </svg>
                  ),
                },
                {
                  id: 'artists',
                  label: 'Artists',
                  icon: (
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      aria-hidden="true"
                    >
                      <circle cx="10" cy="8" r="4" />
                      <path d="M2 18c0-4 3.5-7 8-7s8 3 8 7" />
                    </svg>
                  ),
                },
                {
                  id: 'users',
                  label: 'Users',
                  icon: (
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      aria-hidden="true"
                    >
                      <circle cx="7" cy="8" r="3.5" />
                      <circle cx="14" cy="8" r="3.5" />
                      <path d="M0 18c0-3.5 2.5-6 7-6 1.5 0 3 .5 4 1.5" />
                      <path d="M10 18c0-3.5 2-6 4-6s4 2.5 4 6" />
                    </svg>
                  ),
                },
              ] as { id: SearchTab; label: string; icon: React.ReactNode }[]
            ).map((tab) => (
              <button
                key={tab.id}
                className={`search-tab ${displayTab === tab.id ? 'is-active' : ''}`}
                role="tab"
                aria-selected={displayTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                id={`tab-${tab.id}`}
                onClick={(e) => switchTab(tab.id, e.currentTarget)}
              >
                {tab.icon}
                {tab.label}
                <span className="search-tab__count">{counts[tab.id] ?? 0}</span>
              </button>
            ))}
            <div
              className="search-tab__indicator"
              style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
            />
          </div>
        </div>

        {/* Empty state — pas de query */}
        {!hasQuery && (
          <div className="search-empty">
            <div className="search-empty__inner">
              <div className="search-empty__vinyl">
                <div className="search-empty__disc">
                  <div className="search-empty__disc-groove" />
                  <div className="search-empty__disc-groove search-empty__disc-groove--2" />
                  <div className="search-empty__disc-label" />
                </div>
              </div>
              <h2 className="search-empty__title">Start typing to explore</h2>
              <p className="search-empty__desc">
                Search through thousands of albums, artists, and collectors in the HeadBanger
                community.
              </p>
              <div className="search-empty__hints">
                {HINTS.map((hint) => (
                  <button
                    key={hint}
                    className="search-empty__hint"
                    onClick={() => handleHint(hint)}
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* No results */}
        {showNoResults && (
          <div className="search-no-results">
            <div className="search-no-results__inner">
              <svg
                className="search-no-results__icon"
                viewBox="0 0 48 48"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <circle cx="20" cy="20" r="14" />
                <line x1="30" y1="30" x2="42" y2="42" />
                <line x1="15" y1="16" x2="25" y2="24" opacity="0.4" />
                <line x1="25" y1="16" x2="15" y2="24" opacity="0.4" />
              </svg>
              <h2 className="search-no-results__title">No results found</h2>
              <p className="search-no-results__desc">
                Try adjusting your search or check for typos.
              </p>
            </div>
          </div>
        )}

        {/* Panels — toujours montés quand il y a une query */}
        {hasQuery && (
          <>
            <div
              className={`search-panel ${displayTab === 'albums' ? 'is-active' : ''}`}
              role="tabpanel"
              id="panel-albums"
              aria-labelledby="tab-albums"
              hidden={displayTab !== 'albums'}
            >
              <div className="search-panel__inner">
                <SearchAlbumsTab
                  query={query}
                  onCountChange={(count) => setCounts((prev) => ({ ...prev, albums: count }))}
                />
              </div>
            </div>

            <div
              className={`search-panel ${displayTab === 'artists' ? 'is-active' : ''}`}
              role="tabpanel"
              id="panel-artists"
              aria-labelledby="tab-artists"
              hidden={displayTab !== 'artists'}
            >
              <div className="search-panel__inner">
                <SearchArtistsTab
                  query={query}
                  onCountChange={(count) => setCounts((prev) => ({ ...prev, artists: count }))}
                />
              </div>
            </div>

            <div
              className={`search-panel ${displayTab === 'users' ? 'is-active' : ''}`}
              role="tabpanel"
              id="panel-users"
              aria-labelledby="tab-users"
              hidden={displayTab !== 'users'}
            >
              <div className="search-panel__inner">
                <SearchUsersTab
                  query={query}
                  onCountChange={(count) => setCounts((prev) => ({ ...prev, users: count }))}
                />
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
