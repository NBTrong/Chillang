import { useTheme } from '../context/ThemeContext'
import { useTranslation } from '../context/LanguageContext'

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const { t } = useTranslation()

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
      return t('theme.system')
    }
    return resolvedTheme === 'dark' ? t('theme.dark') : t('theme.light')
  }

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-lg transition-colors hover:bg-[var(--interactive-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]"
      aria-label={
        theme === 'dark' 
          ? t('theme.switchToLight')
          : theme === 'light' 
            ? t('theme.switchToSystem')
            : t('theme.switchToDark')
      }
      title={`Theme: ${getThemeLabel()} (${theme})`}
    >
      <span className="select-none">{getThemeIcon()}</span>
    </button>
  )
}

