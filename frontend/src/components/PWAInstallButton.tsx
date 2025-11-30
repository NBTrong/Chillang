import { useEffect, useState } from 'react'
import { useTranslation } from '../context/LanguageContext'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallButton() {
  const { t } = useTranslation()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default browser install prompt
      e.preventDefault()
      // Store the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // After app is installed, the prompt might be available again if user uninstalls
    // So we keep listening for the event

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      // Show the install prompt
      await deferredPrompt.prompt()

      // Wait for user response
      const { outcome } = await deferredPrompt.userChoice

      // After user responds, the prompt can be used again
      // Browser will fire beforeinstallprompt again if conditions are met
      if (outcome === 'accepted') {
        // App installed successfully
        // The prompt will be available again if user uninstalls
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error showing install prompt:', error)
    } finally {
      // Clear the deferred prompt - browser will fire beforeinstallprompt again if needed
      setDeferredPrompt(null)
    }
  }

  // Show button if PWA is supported (has install prompt)
  if (!deferredPrompt) {
    return null
  }

  return (
    <button
      type="button"
      onClick={handleInstallClick}
      className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border-primary bg-bg-tertiary text-lg text-text-primary transition-colors hover:bg-interactive-hover"
      aria-label={t('pwa.install')}
      title={t('pwa.install')}
    >
      <span className="select-none">📱</span>
    </button>
  )
}

