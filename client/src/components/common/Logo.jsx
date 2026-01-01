import React from 'react';

const Logo = ({ className = "h-10", showText = true, textColor = "text-gray-900" }) => {
  return (
    <div className="flex items-center space-x-3">
      <img
        src="/images/ttms-logo.png"
        alt="TTMS Logo"
        className={className}
      />
      {showText && (
        <div>
          <h1 className={`text-xl font-bold ${textColor}`}>Thapar Transport</h1>
          <p className="text-xs text-gray-500">Management System</p>
        </div>
      )}
    </div>
  );
};

export default Logo;
