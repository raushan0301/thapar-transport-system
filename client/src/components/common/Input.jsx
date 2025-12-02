import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

const Input = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  success,
  required = false,
  disabled = false,
  className = '',
  helperText,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className="mb-4">
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Left Icon */}
        {LeftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <LeftIcon className="w-5 h-5" />
          </div>
        )}

        {/* Input Field */}
        <input
          type={inputType}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            w-full px-4 py-2.5
            ${LeftIcon ? 'pl-11' : ''}
            ${RightIcon || type === 'password' || error || success ? 'pr-11' : ''}
            border rounded-lg
            focus:outline-none focus:ring-2
            transition-all duration-200
            ${error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
              : success
                ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                : isFocused
                  ? 'border-blue-500 ring-2 ring-blue-100'
                  : 'border-gray-300 hover:border-gray-400'
            }
            ${disabled
              ? 'bg-gray-50 cursor-not-allowed text-gray-500'
              : 'bg-white'
            }
            ${className}
          `.replace(/\s+/g, ' ').trim()}
          {...props}
        />

        {/* Right Icon / Status Icon / Password Toggle */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {type === 'password' ? (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          ) : error ? (
            <AlertCircle className="w-5 h-5 text-red-500" />
          ) : success ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : RightIcon ? (
            <RightIcon className="w-5 h-5 text-gray-400" />
          ) : null}
        </div>
      </div>

      {/* Helper Text / Error / Success Message */}
      {error && (
        <p className="mt-1.5 text-sm text-red-600 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
        </p>
      )}
      {success && !error && (
        <p className="mt-1.5 text-sm text-green-600 flex items-center">
          <CheckCircle className="w-4 h-4 mr-1" />
          {success}
        </p>
      )}
      {helperText && !error && !success && (
        <p className="mt-1.5 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;