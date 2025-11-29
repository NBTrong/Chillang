import { useTranslation } from '../context/LanguageContext'
import type { Language } from '../i18n/types'

export default function LanguageToggle() {
  const { language, setLanguage, t, supportedLanguages } = useTranslation()

  const cycleLanguage = () => {
    const currentIndex = supportedLanguages.indexOf(language)
    const nextIndex = (currentIndex + 1) % supportedLanguages.length
    const nextLanguage = supportedLanguages[nextIndex]
    void setLanguage(nextLanguage)
  }

  const getLanguageLabel = (lang: Language): string => {
    if (lang === 'vi') return t('language.vietnamese')
    if (lang === 'en') return t('language.english')
    return lang
  }

  const getLanguageIcon = (lang: Language): string => {
    if (lang === 'vi') return '🇻🇳'
    if (lang === 'en') return '🇬🇧'
    return '🌐'
  }

  return (
    <button
      type="button"
      onClick={cycleLanguage}
      className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-lg transition-colors hover:bg-[var(--interactive-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]"
      aria-label={`${t('language.switchTo')} ${getLanguageLabel(language === 'vi' ? 'en' : 'vi')}`}
      title={`${t('language.switchTo')} ${getLanguageLabel(language === 'vi' ? 'en' : 'vi')}`}
    >
      <span className="select-none">{getLanguageIcon(language)}</span>
    </button>
  )
}

