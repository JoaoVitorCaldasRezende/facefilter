/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-base': '#111827',
        'bg-surface': '#1F2937',
        'bg-raised': '#374151',
        'border-main': '#374151',
        'border-light': '#4B5563',
        'text-primary': '#F9FAFB',
        'text-secondary': '#9CA3AF',
        'text-muted': '#6B7280',
        'blue-brand': '#2563EB',
        'blue-light': '#3B82F6',
        'purple-brand': '#7C3AED',
        'purple-light': '#8B5CF6',
      }
    },
  },
  plugins: [],
}