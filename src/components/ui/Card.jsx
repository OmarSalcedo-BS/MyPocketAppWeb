import React from 'react';

export const Card = ({ children, className = "" }) => (
  <div
    className={`rounded-2xl shadow-sm border p-6 transition-colors duration-300 ${className}`}
    style={{
      backgroundColor: 'var(--card-bg)',
      borderColor: 'var(--border-color)',
      color: 'var(--text-primary)'
    }}
  >
    {children}
  </div>
);