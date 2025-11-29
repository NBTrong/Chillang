import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Language, TranslationKey } from '../i18n/types'
import { defaultLanguage, detectBrowserLanguage, getTranslation, supportedLanguages } from '../i18n'
import { getUserProfile, updateUserLanguage } from '../services/supabaseApi'
import { supabase } from '../lib/supabaseClient'

type LanguageContextType = {
  language: Language
  setLanguage: (lang: Language) => Promise<void>
  t: (key: TranslationKey) => string
  supportedLanguages: Language[]
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const STORAGE_KEY = 'chillang_language'

const getStoredLanguage = (): Language | null => {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && supportedLanguages.includes(stored as Language)) {
      return stored as Language
    }
  } catch (error) {
    console.error('Failed to read language from localStorage:', error)
  }
  return null
}

const setStoredLanguage = (lang: Language) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch (error) {
    console.error('Failed to save language to localStorage:', error)
  }
}

// Get initial language synchronously from localStorage to avoid flash
const getInitialLanguage = (): Language => {
  const storedLang = getStoredLanguage()
  if (storedLang) {
    return storedLang
  }
  // If no localStorage, try browser language
  if (typeof window !== 'undefined') {
    return detectBrowserLanguage()
  }
  return defaultLanguage
}

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // Initialize with localStorage value immediately (synchronous) to avoid flash
  const [language, setLanguageState] = useState<Language>(getInitialLanguage())

  // Initialize language from localStorage, user profile, or browser
  useEffect(() => {
    const initLanguage = async () => {
      let finalLanguage: Language | null = null

      // First, try to load from localStorage (fastest, works for all users, reflects current preference)
      const storedLang = getStoredLanguage()
      if (storedLang) {
        finalLanguage = storedLang
        // Sync to database if user is logged in (but don't override localStorage)
        // Use getSession() instead of getCurrentUser() to avoid API call
        try {
          const { data: session } = await supabase.auth.getSession()
          if (session?.session?.user) {
            // Update database to match localStorage (silent update, don't wait)
            updateUserLanguage(storedLang, session.session.user.id).catch(() => {
              // Ignore errors - localStorage is the source of truth
            })
          }
        } catch (error) {
          // Ignore - localStorage is the source of truth
        }
      } else {
        // If no localStorage, check user profile from database
        // Use getSession() instead of getCurrentUser() to avoid API call
        try {
          const { data: session } = await supabase.auth.getSession()
          if (session?.session?.user) {
            const profile = await getUserProfile(session.session.user.id)
            if (profile?.language && supportedLanguages.includes(profile.language as Language)) {
              finalLanguage = profile.language as Language
              // Sync to localStorage
              setStoredLanguage(profile.language as Language)
            }
          }
        } catch (error) {
          console.error('Failed to load user language preference:', error)
        }
      }
      
      // If no stored language and no user profile, use browser language or default
      if (!finalLanguage) {
        finalLanguage = detectBrowserLanguage()
        setStoredLanguage(finalLanguage)
      }

      // Only update if different from initial (from localStorage)
      // This handles case where database has different value
      if (finalLanguage && finalLanguage !== language) {
        setLanguageState(finalLanguage)
      }
    }

    void initLanguage()
  }, [])

  const setLanguage = async (lang: Language) => {
    if (!supportedLanguages.includes(lang)) {
      console.warn(`Unsupported language: ${lang}`)
      return
    }

    setLanguageState(lang)
    
    // Always save to localStorage first (works for all users, immediate)
    setStoredLanguage(lang)
    
    // Also save to user profile if user is logged in
    // Use getSession() instead of getCurrentUser() to avoid API call
    try {
      const { data: session } = await supabase.auth.getSession()
      if (session?.session?.user) {
        await updateUserLanguage(lang, session.session.user.id)
      }
    } catch (error) {
      console.error('Failed to save language preference to user profile:', error)
      // Don't throw - language change should still work even if save fails
    }
  }

  // Use the language from state (which is initialized from localStorage synchronously)
  // This avoids flash of wrong language while async operations complete
  const t = (key: TranslationKey): string => {
    return getTranslation(language, key)
  }

  // Render immediately with language from localStorage (no flash)
  // Async operations will sync with database in background
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, supportedLanguages }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

// Alias for useTranslation for consistency with common i18n patterns
export const useTranslation = () => {
  const { t, language, setLanguage, supportedLanguages } = useLanguage()
  return { t, language, setLanguage, supportedLanguages }
}

