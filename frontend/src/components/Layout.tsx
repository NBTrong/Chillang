import { useEffect, useState, useRef, useCallback, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import type { AuthUser, RecentSessionRecord } from '../services/supabaseApi'
import { getCurrentUser, signInWithGoogle, signOut, fetchRecentSessions } from '../services/supabaseApi'
import ThemeToggle from './ThemeToggle'

const DESKTOP_SIDEBAR_WIDTH = 260

const Layout = ({ children }: { children: ReactNode }) => {
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

    const initAuth = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (isMounted) {
          setUser(currentUser)
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
      const sessions = await fetchRecentSessions(20, offset)
      
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
        const sessions = await fetchRecentSessions(20, 0)
        
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

  const showAppContent = !!user

  return (
    <div className="flex min-h-screen bg-bg-primary text-text-primary">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[220px] transform flex-col border-r border-border-primary bg-bg-secondary px-3 py-4 shadow-xl transition-transform duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] md:w-[260px] md:px-5 md:py-6 ${
          isSidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full'
        }`}
        aria-hidden={!isSidebarOpen}
      >
        <button
          type="button"
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-border-primary bg-bg-tertiary text-xl text-text-primary md:hidden"
          aria-label="Đóng sidebar"
          onClick={() => setIsSidebarOpen(false)}
        >
          ×
        </button>
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
              <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-accent-primary text-2xl text-text-inverse">
                ★
              </div>
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
                New Study Session
              </button>
              <button className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition-colors hover:bg-interactive-hover">
                <span className="text-xl leading-none">💎</span>
                Vocabulary Manager
              </button>
            </div>

            <div className="mt-10 px-3 text-[10px] font-semibold tracking-[0.35em] text-text-tertiary">
              RECENT VIDEOS
            </div>
          </div>

          {/* Scrollable recent videos section */}
          <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide">
            {recentVideos.length === 0 && !isLoadingVideos ? (
              <div className="mt-4 px-3 text-sm text-text-tertiary">
                Chưa có video nào
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
                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-bg-tertiary text-sm font-semibold text-text-inverse">
                  <span aria-hidden>{userInitial}</span>
                </div>
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
          aria-label="Close navigation overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main
        className="flex flex-1 flex-col px-3 py-4 transition-[margin-left] duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] md:px-8 md:py-6"
        style={{
          marginLeft: isDesktop ? (isSidebarOpen ? DESKTOP_SIDEBAR_WIDTH : 0) : 0,
        }}
      >
        <header 
          className="fixed top-0 z-30 flex items-center justify-between border-b border-border-primary bg-bg-primary px-3 py-4 transition-[left,right] duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] md:px-8 md:py-6" 
          style={{ 
            left: isDesktop ? (isSidebarOpen ? DESKTOP_SIDEBAR_WIDTH : 0) : 0,
            right: 0
          }}
        >
          <button
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border-primary bg-bg-tertiary text-2xl text-text-primary"
            aria-label="Toggle navigation"
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
            <ThemeToggle />
            <button className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border-primary bg-bg-tertiary text-lg text-text-primary">
              🔔
            </button>
          </div>
        </header>

        <section className="flex flex-1 flex-col pt-20">{children}</section>

        {!showAppContent && !isAuthLoading && (
          <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-border-primary bg-bg-secondary/95 px-8 py-10 text-center shadow-[0_20px_80px_rgba(0,0,0,0.7)]">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-primary text-2xl text-text-inverse">
                ★
              </div>
              <h1 className="mt-6 text-2xl font-semibold text-text-primary">Chào mừng đến Tube Study</h1>
              <p className="mt-3 text-sm text-text-secondary">
                Đăng nhập với Google để lưu tiến độ học, lịch sử video và từ vựng của riêng bạn.
              </p>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isAuthLoading || isLoginSubmitting}
                className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-text-inverse px-4 py-3 text-sm font-semibold text-bg-primary shadow-[0_10px_40px_rgba(0,0,0,0.45)] transition hover:bg-[rgba(243,244,247,0.9)] disabled:cursor-wait disabled:bg-text-inverse/70"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded bg-white">
                  {isLoginSubmitting ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#4285f4]/40 border-t-[#4285f4]" />
                  ) : (
                    <span className="text-base font-bold text-[#4285f4]">G</span>
                  )}
                </span>
                <span>
                  {isAuthLoading
                    ? 'Đang kiểm tra phiên đăng nhập...'
                    : isLoginSubmitting
                      ? 'Đang mở Google...'
                      : 'Tiếp tục với Google'}
                </span>
              </button>
            </div>
          </div>
        )}

        {showAppContent && isUserSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl border border-border-primary bg-bg-secondary/95 px-6 py-5 text-left shadow-[0_20px_80px_rgba(0,0,0,0.7)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-text-secondary">Tài khoản</div>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-bg-tertiary text-sm font-semibold text-text-inverse">
                      <span aria-hidden>{userInitial}</span>
                    </div>
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
                  aria-label="Đóng"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-sm text-text-secondary hover:bg-white/10"
                  onClick={() => setIsUserSettingsOpen(false)}
                >
                  ×
                </button>
              </div>

              <div className="mt-6 border-t border-white/5 pt-4">
                {/* Sign out button */}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center justify-between rounded-xl bg-bg-tertiary px-4 py-2.5 text-sm font-medium text-red-100 hover:bg-[rgba(248,113,113,0.08)]"
                >
                  <span>Đăng xuất</span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/10 text-xs text-red-200">
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

