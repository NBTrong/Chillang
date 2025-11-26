import { useEffect, useState, type ReactNode } from 'react'

type VideoStatus = 'done' | 'in-progress' | 'new'

const recentVideos: { title: string; status: VideoStatus }[] = [
  { title: 'How to Speak Fluent English in 30 Days', status: 'done' },
  { title: '15 Advanced English Words for Everyday Use', status: 'done' },
  { title: 'Learn English Conversation: 10 Real-Life Scenarios', status: 'in-progress' },
  { title: 'Master English Phrasal Verbs in Context', status: 'done' },
  { title: 'IELTS Speaking Test: Full Mock Exam', status: 'new' },
  { title: 'TOEFL Vocabulary Practice - 50 Must-Know Words', status: 'new' },
  { title: 'Business English - Professional Email Workshop', status: 'new' },
  { title: 'Travel English Phrases for Your Next Trip', status: 'new' },
  { title: 'English Pronunciation Practice - American Accent', status: 'new' },
]

const StatusIcon = ({ status }: { status: VideoStatus }) => {
  if (status === 'done') {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#33f399] bg-[#17221b]">
        <svg
          viewBox="0 0 16 16"
          className="h-3 w-3 fill-none stroke-[#33f399] stroke-[2.2]"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 8.5 6.5 11l5-6" />
        </svg>
      </span>
    )
  }

  if (status === 'in-progress') {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#ff9a45] bg-[#1f170f]">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff9a45]" />
      </span>
    )
  }

  return <span className="inline-flex h-5 w-5 rounded-full border border-[#53586a]" />
}

const DESKTOP_SIDEBAR_WIDTH = 280

const Layout = ({ children }: { children: ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

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

  return (
    <div className="flex min-h-screen bg-[#04060c] text-gray-100">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[240px] transform flex-col border-r border-[#181b24] bg-[#05060a] px-6 py-10 shadow-xl transition-transform duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] md:w-[280px] md:px-8 md:py-12 ${
          isSidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full'
        }`}
        aria-hidden={!isSidebarOpen}
      >
        <button
          type="button"
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-[#1b1f33] bg-[#0c0f1b] text-xl text-white md:hidden"
          aria-label="Đóng sidebar"
          onClick={() => setIsSidebarOpen(false)}
        >
          ×
        </button>
        <div className="flex items-center gap-3 text-base font-semibold text-white">
          <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#1a73e8] text-2xl text-white">
            ★
          </div>
          LearnTube AI
        </div>

        <div className="mt-10 space-y-2 text-sm font-medium text-white">
          <button className="flex items-center gap-3 rounded-2xl px-2 py-1 text-left hover:text-[#8fb6ff]">
            <span className="text-xl leading-none">＋</span>
            New Study Session
          </button>
          <button className="flex items-center gap-3 rounded-2xl px-2 py-1 text-left hover:text-[#8fb6ff]">
            <span className="text-xl leading-none">💎</span>
            Vocabulary Manager
          </button>
        </div>

        <div className="mt-10 text-[10px] font-semibold tracking-[0.35em] text-[#8a90a3]">RECENT VIDEOS</div>

        <ul className="mt-4 space-y-3">
          {recentVideos.map((video) => (
            <li key={video.title} className="flex items-center gap-3 rounded-2xl px-1 py-2 text-sm text-gray-200">
              <StatusIcon status={video.status} />
              <span className="truncate">{video.title}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto border-t border-[#191c2a] pt-8 text-sm text-gray-300">
          <button className="flex items-center gap-3 text-left hover:text-white">
            <span className="text-lg">⚙️</span>
            Settings
          </button>

          <div className="mt-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#182036] text-base font-semibold text-white">
              <span aria-hidden>🙂</span>
            </div>
            <div>
              <div className="text-base font-semibold text-white">Alex Nguyen</div>
              <div className="text-xs text-gray-500">Premium member</div>
            </div>
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
        className="flex flex-1 flex-col px-6 py-10 transition-[margin-left] duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] md:px-16 md:py-12"
        style={{
          marginLeft: isDesktop ? (isSidebarOpen ? DESKTOP_SIDEBAR_WIDTH : 0) : 0,
        }}
      >
        <header className="flex items-center justify-between pb-8">
          <button
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#1b1f33] bg-[#0c0f1b] text-2xl text-white"
            aria-label="Toggle navigation"
            aria-expanded={isSidebarOpen}
            type="button"
            onClick={() => setIsSidebarOpen((open) => !open)}
          >
            <span className="flex flex-col gap-1.5">
              <span className="block h-0.5 w-6 rounded-full bg-white" />
              <span className="block h-0.5 w-5 rounded-full bg-white" />
              <span className="block h-0.5 w-6 rounded-full bg-white" />
            </span>
          </button>

          <div className="flex items-center gap-4">
            <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#1b1f33] bg-[#0c0f1b] text-xl text-white">
              🔔
            </button>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fcd6b5] text-lg text-black">
              V
            </div>
          </div>
        </header>

        <section className="flex flex-1 flex-col">{children}</section>
      </main>
    </div>
  )
}

export default Layout

