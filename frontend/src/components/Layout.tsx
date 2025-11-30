import { useEffect, useState, useRef, useCallback, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import type { AuthUser, RecentSessionRecord } from '../services/supabaseApi'
import { getCurrentUser, signInWithGoogle, signOut, fetchRecentSessions, getUserAvatarUrl } from '../services/supabaseApi'
import { useTranslation } from '../context/LanguageContext'
import ThemeToggle from './ThemeToggle'
import LanguageToggle from './LanguageToggle'
import PWAInstallButton from './PWAInstallButton'

const DESKTOP_SIDEBAR_WIDTH = 260

const Layout = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false)
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false)
  const [recentVideos, setRecentVideos] = useState<RecentSessionRecord[]>([])
  const [isLoadingVideos, setIsLoadingVideos] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const loadMoreRef = useRef<HTMLLIElement | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(min-width: 768px)')
    const handleViewportChange = (target: MediaQueryList | MediaQueryListEvent) => {
      const matches = target.matches
      setIsDesktop(matches)
      if (!matches) {
        setIsSidebarOpen(false)
      }
    }

    handleViewportChange(mediaQuery)
    mediaQuery.addEventListener('change', handleViewportChange)

    return () => {
      mediaQuery.removeEventListener('change', handleViewportChange)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    // Use getSession() first (faster, from cache) instead of getUser() (makes API call)
    const initAuth = async () => {
      try {
        // Try to get session from cache first (no API call)
        const { data: sessionData } = await supabase.auth.getSession()
        if (isMounted && sessionData?.session?.user) {
          setUser(sessionData.session.user as AuthUser)
          setIsAuthLoading(false)
          return
        }
        
        // Only call getUser() if no session in cache (rare case)
        if (!sessionData?.session) {
          const currentUser = await getCurrentUser()
          if (isMounted) {
            setUser(currentUser)
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching current user', error)
      } finally {
        if (isMounted) {
          setIsAuthLoading(false)
        }
      }
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser((session?.user as AuthUser) ?? null)
      setIsAuthLoading(false)
    })

    void initAuth()

    return () => {
      isMounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  const loadMoreVideos = useCallback(async () => {
    if (!user || isLoadingVideos || !hasMore) return

    try {
      setIsLoadingVideos(true)
      const sessions = await fetchRecentSessions(20, offset, user.id)
      
      if (sessions.length === 0) {
        setHasMore(false)
        return
      }

      setRecentVideos((prev) => [...prev, ...sessions])
      setOffset((prev) => prev + sessions.length)
      
      // Nếu số lượng trả về ít hơn limit, không còn data nữa
      if (sessions.length < 20) {
        setHasMore(false)
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching recent videos', error)
    } finally {
      setIsLoadingVideos(false)
    }
  }, [user, isLoadingVideos, hasMore, offset])

  useEffect(() => {
    if (!user) {
      setRecentVideos([])
      setOffset(0)
      setHasMore(true)
      return
    }

    // Reset và load initial data
    setRecentVideos([])
    setOffset(0)
    setHasMore(true)
    
    let isMounted = true

    const loadInitialVideos = async () => {
      try {
        setIsLoadingVideos(true)
        const sessions = await fetchRecentSessions(20, 0, user.id)
        
        if (isMounted) {
          setRecentVideos(sessions)
          setOffset(sessions.length)
          
          if (sessions.length < 20) {
            setHasMore(false)
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching recent videos', error)
      } finally {
        if (isMounted) {
          setIsLoadingVideos(false)
        }
      }
    }

    void loadInitialVideos()

    return () => {
      isMounted = false
    }
  }, [user])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || isLoadingVideos) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoadingVideos) {
          void loadMoreVideos()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(loadMoreRef.current)

    return () => {
      observer.disconnect()
    }
  }, [hasMore, isLoadingVideos, loadMoreVideos])

  const handleGoogleLogin = async () => {
    if (isLoginSubmitting) return
    try {
      setIsLoginSubmitting(true)
      await signInWithGoogle()
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Google login failed', error)
    } finally {
      setIsLoginSubmitting(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setIsUserSettingsOpen(false)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Sign out failed', error)
    }
  }

  const userDisplayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    'Learner'

  const userInitial = userDisplayName?.charAt(0)?.toUpperCase() ?? 'U'
  const userAvatarUrl = getUserAvatarUrl(user)

  const showAppContent = !!user

  return (
    <div className="flex min-h-screen bg-bg-primary text-text-primary">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[220px] transform flex-col border-r border-border-primary bg-bg-primary px-3 py-4 shadow-xl transition-transform duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] md:w-[260px] md:px-5 md:py-6 ${
          isSidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full'
        }`}
        aria-hidden={!isSidebarOpen}
      >
        <div className="flex h-full flex-col pr-2">
          {/* Fixed top section */}
          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                navigate('/')
                if (!isDesktop) {
                  setIsSidebarOpen(false)
                }
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-base font-semibold text-text-primary"
            >
              <img 
                src="/logo.PNG" 
                alt="Chillang" 
                className="h-11 w-11 rounded-[16px] object-contain"
              />
              <span className="text-lg font-bold">Chillang</span>
            </button>

            <div className="mt-10 space-y-2 text-base font-medium text-text-primary">
              <button
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition-colors hover:bg-interactive-hover"
                onClick={() => {
                  navigate('/')
                  if (!isDesktop) {
                    setIsSidebarOpen(false)
                  }
                }}
                type="button"
              >
                <span className="text-xl leading-none">＋</span>
                {t('layout.newSession')}
              </button>
              <button className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition-colors hover:bg-interactive-hover">
                <span className="text-xl leading-none">💎</span>
                {t('layout.vocabularyManager')}
              </button>
            </div>

            <div className="mt-10 px-3 text-[10px] font-semibold tracking-[0.35em] text-text-tertiary">
              {t('layout.recentVideos')}
            </div>
          </div>

          {/* Scrollable recent videos section */}
          <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide">
            {recentVideos.length === 0 && !isLoadingVideos ? (
              <div className="mt-4 px-3 text-sm text-text-tertiary">
                {t('layout.noVideos')}
              </div>
            ) : (
              <ul className="mt-4 space-y-1">
                {recentVideos.map((session) => (
                  <li
                    key={session.session_id}
                    className="flex cursor-pointer items-center rounded-2xl px-3 py-2.5 text-base text-text-secondary transition-colors hover:bg-interactive-hover hover:text-text-primary"
                    onClick={() => {
                      navigate(`/${session.youtube_video_id}/dash`)
                      if (!isDesktop) {
                        setIsSidebarOpen(false)
                      }
                    }}
                  >
                    <span className="truncate" title={session.title}>
                      {session.title}
                    </span>
                  </li>
                ))}
                {/* Sentinel element for infinite scroll */}
                {hasMore && (
                  <li
                    ref={loadMoreRef}
                    className="flex items-center justify-center py-2"
                  >
                    {isLoadingVideos && (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent-primary/30 border-t-accent-primary" />
                    )}
                  </li>
                )}
              </ul>
            )}
            {/* Initial loading state */}
            {isLoadingVideos && recentVideos.length === 0 && (
              <div className="mt-4 px-3">
                <div className="h-4 w-full animate-pulse rounded bg-bg-tertiary" />
              </div>
            )}
          </div>

          {/* Fixed bottom section */}
          <div className="flex-shrink-0 border-t border-border-divider pt-6 text-sm text-text-secondary">
            {showAppContent && (
              <button
                type="button"
                onClick={() => setIsUserSettingsOpen(true)}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left hover:bg-interactive-hover"
              >
                {userAvatarUrl ? (
                  <img
                    src={userAvatarUrl}
                    alt={userDisplayName}
                    className="h-9 w-9 flex-none rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-bg-tertiary text-sm font-semibold text-text-inverse">
                    <span aria-hidden>{userInitial}</span>
                  </div>
                )}
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-text-primary">{userDisplayName}</div>
                </div>
              </button>
            )}
          </div>
        </div>
      </aside>

      {isSidebarOpen && !isDesktop && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          aria-label={t('layout.closeNav')}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main
        className="flex flex-1 flex-col bg-bg-primary transition-[margin-left] duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          marginLeft: isDesktop ? (isSidebarOpen ? DESKTOP_SIDEBAR_WIDTH : 0) : 0,
        }}
      >
        <header 
          className="fixed top-0 z-30 flex items-center justify-between border-b border-border-primary bg-bg-primary px-4 py-4 transition-[left,right] duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] md:px-8 md:py-6" 
          style={{ 
            left: isDesktop ? (isSidebarOpen ? DESKTOP_SIDEBAR_WIDTH : 0) : 0,
            right: 0
          }}
        >
          <button
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border-primary bg-bg-tertiary text-2xl text-text-primary"
            aria-label={t('layout.toggleNav')}
            aria-expanded={isSidebarOpen}
            type="button"
            onClick={() => setIsSidebarOpen((open) => !open)}
          >
            <span className="flex flex-col gap-1.5">
              <span className="block h-0.5 w-6 rounded-full bg-text-primary" />
              <span className="block h-0.5 w-5 rounded-full bg-text-primary" />
              <span className="block h-0.5 w-6 rounded-full bg-text-primary" />
            </span>
          </button>

          <div className="flex items-center gap-3">
            <PWAInstallButton />
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>

        <section className="flex flex-1 flex-col px-4 pb-10 pt-20 md:px-8 md:pt-24 lg:px-20 lg:pt-28">
          {children}
        </section>

        {!showAppContent && !isAuthLoading && (
          <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="w-full max-w-md rounded-3xl border border-border-primary bg-bg-secondary px-8 py-10 text-center shadow-[0_20px_80px_rgba(0,0,0,0.7)]">
              <div className="flex flex-col items-center gap-3">
                <img 
                  src="/logo.PNG" 
                  alt="Chillang" 
                  className="h-16 w-16 rounded-2xl object-contain"
                />
                {/* <span className="text-2xl font-bold text-text-primary">Login to Chillang</span> */}
              </div>
              <h1 className="mt-6 text-2xl font-semibold text-text-primary">{t('layout.welcome')}</h1>
              {/* <p className="mt-3 text-sm text-text-secondary">
                {t('layout.welcomeSubtitle')}
              </p> */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isAuthLoading || isLoginSubmitting}
                className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-6 py-4 text-base font-semibold text-gray-900 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md disabled:cursor-wait disabled:bg-gray-300 disabled:text-gray-500"
              >
                {isLoginSubmitting ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#4285f4]/40 border-t-[#4285f4]" />
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                <span className="text-gray-900">
                  {isAuthLoading
                    ? t('layout.checkingAuth')
                    : isLoginSubmitting
                      ? t('layout.openingGoogle')
                      : t('layout.continueWithGoogle')}
                </span>
              </button>
            </div>
          </div>
        )}

        {showAppContent && isUserSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/60">
            <div className="w-full max-w-sm rounded-2xl border border-border-primary bg-bg-secondary px-6 py-5 text-left shadow-[0_20px_80px_rgba(0,0,0,0.7)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-text-secondary">{t('layout.account')}</div>
                  <div className="mt-4 flex items-center gap-3">
                    {userAvatarUrl ? (
                      <img
                        src={userAvatarUrl}
                        alt={userDisplayName}
                        className="h-9 w-9 flex-none rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-bg-tertiary text-sm font-semibold text-text-inverse">
                        <span aria-hidden>{userInitial}</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-text-primary">{userDisplayName}</div>
                      {user?.email && (
                        <div className="truncate text-xs text-text-tertiary">{user.email}</div>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={t('layout.close')}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-interactive-hover text-sm text-text-secondary hover:bg-interactive-active transition-colors"
                  onClick={() => setIsUserSettingsOpen(false)}
                >
                  ×
                </button>
              </div>

              <div className="mt-6 border-t border-border-divider pt-4">
                {/* Sign out button */}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center justify-between rounded-xl bg-bg-tertiary px-4 py-2.5 text-sm font-medium text-error hover:bg-error/10 transition-colors"
                >
                  <span>{t('layout.signOut')}</span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-error/10 text-xs text-error">
                    ⏻
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Layout

