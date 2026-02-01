/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Spectral Palette (Cyan/Teal)
        spectral: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },
        // Ectoplasm Palette (Green/Lime - for specific detections)
        ectoplasm: {
          400: '#a3e635',
          500: '#84cc16',
        },
        // Warning/Pro Palette (Amber)
        warning: {
          400: '#fbbf24',
          500: '#f59e0b',
        },
        // Deep Dark Backgrounds
        obsidian: {
          800: '#1f2937', // gray-800
          900: '#111827', // gray-900
          950: '#030712', // gray-950
        }
      },
      fontFamily: {
        mono: ['"Share Tech Mono"', 'monospace', 'ui-monospace', 'SFMono-Regular'],
        sans: ['"Inter"', 'sans-serif', 'system-ui'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glitch': 'glitch 1s linear infinite',
      },
      keyframes: {
        glitch: {
          '2%, 64%': { transform: 'translate(2px,0) skew(0deg)' },
          '4%, 60%': { transform: 'translate(-2px,0) skew(0deg)' },
          '62%': { transform: 'translate(0,0) skew(5deg)' },
        }
      }
    },
  },
  plugins: [],
}
