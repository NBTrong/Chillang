import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === 'dark') {
      setTheme('light')
    } else if (theme === 'light') {
      setTheme('system')
    } else {
      setTheme('dark')
    }
  }

  const getThemeIcon = () => {
    if (theme === 'system') {
      return '🖥️' // System icon
    }
    return resolvedTheme === 'dark' ? '🌙' : '☀️'
  }

  const getThemeLabel = () => {
    if (theme === 'system') {
      return 'Hệ thống'
    }
    return resolvedTheme === 'dark' ? 'Tối' : 'Sáng'
  }

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-lg transition-colors hover:bg-[var(--interactive-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]"
      aria-label={`Chuyển sang chế độ ${theme === 'dark' ? 'sáng' : theme === 'light' ? 'hệ thống' : 'tối'}`}
      title={`Theme: ${getThemeLabel()} (${theme})`}
    >
      <span className="select-none">{getThemeIcon()}</span>
    </button>
  )
}

