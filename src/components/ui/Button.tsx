import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

const variants = {
  primary:
    'bg-accent text-[#121212] hover:bg-[#ff9d5c] shadow-lg shadow-accent/25 border border-accent/60 font-semibold',
  secondary:
    'bg-surface-850 text-surface-100 hover:bg-surface-800 border border-white/14',
  ghost: 'bg-transparent text-surface-300 hover:bg-white/5 hover:text-white border border-transparent',
  danger: 'bg-critical/15 text-critical hover:bg-critical/25 border border-critical/30',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
