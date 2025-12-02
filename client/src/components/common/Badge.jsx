import React from 'react';

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  dot = false,
  pulse = false,
  icon: Icon,
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800 border-gray-200',
    primary: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    info: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };

  const dotColors = {
    default: 'bg-gray-400',
    primary: 'bg-blue-500',
    success: 'bg-green-500',
    danger: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-cyan-500',
    purple: 'bg-purple-500',
    indigo: 'bg-indigo-500',
  };

  const sizes = {
    xs: 'text-xs px-2 py-0.5',
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-3.5 py-1.5',
  };

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        border
        ${variants[variant]} 
        ${sizes[size]} 
        ${className}
      `.replace(/\s+/g, ' ').trim()}
    >
      {dot && (
        <span className="relative flex h-2 w-2 mr-1.5">
          {pulse && (
            <span className={`
              animate-ping absolute inline-flex h-full w-full rounded-full opacity-75
              ${dotColors[variant]}
            `}></span>
          )}
          <span className={`
            relative inline-flex rounded-full h-2 w-2
            ${dotColors[variant]}
          `}></span>
        </span>
      )}
      {Icon && <Icon className="w-3.5 h-3.5 mr-1" />}
      {children}
    </span>
  );
};

// Status Badge Component
export const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending_head: {
      variant: 'warning',
      label: 'Pending Head Approval',
      dot: true,
      pulse: true
    },
    pending_admin: {
      variant: 'info',
      label: 'Pending Admin Review',
      dot: true,
      pulse: true
    },
    pending_authority: {
      variant: 'purple',
      label: 'Pending Authority',
      dot: true,
      pulse: true
    },
    pending_registrar: {
      variant: 'indigo',
      label: 'Pending Registrar',
      dot: true,
      pulse: true
    },
    approved_awaiting_vehicle: {
      variant: 'success',
      label: 'Approved - Awaiting Vehicle',
      dot: true
    },
    vehicle_assigned: {
      variant: 'primary',
      label: 'Vehicle Assigned',
      dot: true
    },
    travel_completed: {
      variant: 'success',
      label: 'Travel Completed',
      dot: false
    },
    closed: {
      variant: 'default',
      label: 'Closed',
      dot: false
    },
    rejected: {
      variant: 'danger',
      label: 'Rejected',
      dot: false
    },
  };

  const config = statusConfig[status] || {
    variant: 'default',
    label: status,
    dot: false,
    pulse: false
  };

  return (
    <Badge
      variant={config.variant}
      dot={config.dot}
      pulse={config.pulse}
    >
      {config.label}
    </Badge>
  );
};

export default Badge;