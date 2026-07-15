import { forwardRef } from 'react'

const VARIANTS = {
  primary: 'bg-brutal-yellow text-brutal-fg border-3 border-brutal-fg hover:shadow-brutal hover:-translate-y-0.5 active:translate-y-0 active:shadow-none',
  secondary: 'bg-white text-brutal-fg border-3 border-brutal-fg hover:shadow-brutal hover:-translate-y-0.5 active:translate-y-0',
  ghost: 'bg-transparent text-brutal-fg/60 border-3 border-transparent hover:text-brutal-fg hover:border-brutal-fg',
  danger: 'bg-brutal-red text-white border-3 border-brutal-fg hover:opacity-80 active:translate-y-0.5',
  link: 'bg-transparent text-brutal-green underline border-0 hover:opacity-70',
}

const SIZES = {
  sm: 'px-2 py-1 text-[10px]',
  md: 'px-4 py-2 text-xs',
  lg: 'px-6 py-3 text-sm',
}

const Button = forwardRef(({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  children,
  className = '',
  fullWidth,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-bold uppercase tracking-wider transition-all
        ${VARIANTS[variant] || VARIANTS.primary}
        ${SIZES[size] || SIZES.md}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed hover:shadow-none hover:translate-y-0' : 'cursor-pointer'}
        ${className}`}
      {...props}
    >
      {loading ? (
        <span className="h-3 w-3 border-2 border-brutal-fg/30 border-t-brutal-fg rounded-full animate-spin" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  )
})

Button.displayName = 'Button'
export default Button
