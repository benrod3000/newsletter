import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

const Input = forwardRef(({
  label,
  error,
  helperText,
  icon: Icon,
  type = 'text',
  className = '',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword && showPassword ? 'text' : type

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-[10px] font-bold uppercase tracking-wider text-brutal-fg/60 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brutal-muted">
            <Icon size={16} />
          </span>
        )}
        <input
          ref={ref}
          type={inputType}
          className={`w-full px-4 py-2.5 bg-white border-3 text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted transition
            ${error ? 'border-brutal-red' : 'border-brutal-fg'}
            ${Icon ? 'pl-10' : ''}
            ${isPassword ? 'pr-12' : ''}
            ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-brutal-muted hover:text-brutal-fg"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-[10px] font-bold text-brutal-red mt-1">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-[10px] font-bold text-brutal-muted mt-1">{helperText}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'
export default Input
