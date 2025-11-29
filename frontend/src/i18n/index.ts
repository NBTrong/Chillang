import type { Language, TranslationKey } from './types'
import { vi } from './translations/vi'
import { en } from './translations/en'

export const translations: Record<Language, Record<TranslationKey, string>> = {
  vi,
  en,
}

export const defaultLanguage: Language = 'vi'

export const supportedLanguages: Language[] = ['vi', 'en']

export const getTranslation = (language: Language, key: TranslationKey): string => {
  const translation = translations[language]?.[key]
  if (translation) {
    return translation
  }
  // Fallback to Vietnamese if translation not found
  return translations[defaultLanguage]?.[key] || key
}

export const detectBrowserLanguage = (): Language => {
  if (typeof window === 'undefined') {
    return defaultLanguage
  }
  
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith('vi')) {
    return 'vi'
  }
  if (browserLang.startsWith('en')) {
    return 'en'
  }
  return defaultLanguage
}

