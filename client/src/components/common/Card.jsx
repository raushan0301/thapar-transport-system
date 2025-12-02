import React from 'react';

const Card = ({
  children,
  className = '',
  title,
  subtitle,
  actions,
  hover = false,
  padding = 'default',
  noBorder = false,
}) => {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`
        bg-white rounded-xl 
        ${noBorder ? '' : 'border border-gray-200'}
        shadow-sm
        ${hover ? 'hover:shadow-lg hover:-translate-y-1 transition-all duration-300' : ''}
        overflow-hidden 
        ${className}
      `.replace(/\s+/g, ' ').trim()}
    >
      {(title || subtitle || actions) && (
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-900">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
      <div className={paddingStyles[padding]}>
        {children}
      </div>
    </div>
  );
};

// Stats Card Component
export const StatsCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  color = 'blue',
  className = ''
}) => {
  const colorStyles = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    yellow: 'from-yellow-500 to-yellow-600',
    purple: 'from-purple-500 to-purple-600',
    indigo: 'from-indigo-500 to-indigo-600',
  };

  const iconBgStyles = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
    indigo: 'bg-indigo-100 text-indigo-600',
  };

  return (
    <div className={`
      bg-white rounded-xl border border-gray-200 shadow-sm
      hover:shadow-lg hover:-translate-y-1 transition-all duration-300
      overflow-hidden
      ${className}
    `.replace(/\s+/g, ' ').trim()}>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">
              {title}
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {value}
            </p>
            {trend && (
              <div className="flex items-center mt-2">
                <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                  {trend === 'up' ? '↑' : '↓'} {trendValue}
                </span>
                <span className="text-sm text-gray-500 ml-2">
                  vs last month
                </span>
              </div>
            )}
          </div>
          {Icon && (
            <div className={`
              w-14 h-14 rounded-xl flex items-center justify-center
              ${iconBgStyles[color]}
            `}>
              <Icon className="w-7 h-7" />
            </div>
          )}
        </div>
      </div>
      <div className={`h-1 bg-gradient-to-r ${colorStyles[color]}`}></div>
    </div>
  );
};

export default Card;