/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Background colors - using CSS variables for theme switching
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          overlay: 'var(--bg-overlay)',
        },
        // Text colors
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          inverse: 'var(--text-inverse)',
        },
        // Accent colors
        accent: {
          primary: 'var(--accent-primary)',
          'primary-hover': 'var(--accent-primary-hover)',
          'primary-light': 'var(--accent-primary-light)',
          secondary: 'var(--accent-secondary)',
          'secondary-hover': 'var(--accent-secondary-hover)',
          purple: 'var(--accent-purple)',
          'purple-hover': 'var(--accent-purple-hover)',
          peach: 'var(--accent-peach)',
          amber: 'var(--accent-amber)',
        },
        // Semantic colors
        success: {
          DEFAULT: 'var(--color-success)',
          hover: 'var(--color-success-hover)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          hover: 'var(--color-warning-hover)',
        },
        error: {
          DEFAULT: 'var(--color-error)',
          hover: 'var(--color-error-hover)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          hover: 'var(--color-info-hover)',
        },
        // Border colors
        border: {
          primary: 'var(--border-primary)',
          secondary: 'var(--border-secondary)',
          accent: 'var(--border-accent)',
          divider: 'var(--border-divider)',
        },
        // Interactive states
        interactive: {
          hover: 'var(--interactive-hover)',
          active: 'var(--interactive-active)',
          disabled: 'var(--interactive-disabled)',
        },
      },
      backgroundColor: {
        'primary': 'var(--bg-primary)',
        'secondary': 'var(--bg-secondary)',
        'tertiary': 'var(--bg-tertiary)',
        'overlay': 'var(--bg-overlay)',
      },
      textColor: {
        'primary': 'var(--text-primary)',
        'secondary': 'var(--text-secondary)',
        'tertiary': 'var(--text-tertiary)',
        'inverse': 'var(--text-inverse)',
      },
      borderColor: {
        'primary': 'var(--border-primary)',
        'secondary': 'var(--border-secondary)',
        'accent': 'var(--border-accent)',
        'divider': 'var(--border-divider)',
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(91, 155, 213, 0.4)',
        'glow-primary-light': '0 0 20px rgba(59, 130, 246, 0.3)',
        'chill-sm': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'chill-md': '0 4px 16px rgba(0, 0, 0, 0.1)',
        'chill-lg': '0 8px 24px rgba(0, 0, 0, 0.15)',
        'chill-dark': '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
}
