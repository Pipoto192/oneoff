'use client';
import { memo } from 'react';
import { Music } from 'lucide-react';

/**
 * Themed loading spinner with multiple variants
 */
const LoadingSpinner = memo(function LoadingSpinner({ 
  size = 'md', 
  variant = 'spinner',
  text = '',
  className = '' 
}) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  if (variant === 'music') {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <div className="relative">
          <div className={`${sizes[size]} animate-pulse`}>
            <Music className="w-full h-full text-purple-400" />
          </div>
          <div className="absolute inset-0 animate-ping opacity-40">
            <Music className="w-full h-full text-purple-400" />
          </div>
        </div>
        {text && <p className={`text-slate-400 ${textSizes[size]}`}>{text}</p>}
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`${size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'} rounded-full bg-purple-400`}
            style={{
              animation: 'bounce 1.4s ease-in-out infinite',
              animationDelay: `${i * 0.16}s`
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div 
        className={`${sizes[size]} border-2 border-slate-700 border-t-purple-500 rounded-full animate-spin gpu-accelerate`}
      />
      {text && <p className={`text-slate-400 ${textSizes[size]}`}>{text}</p>}
    </div>
  );
});

export default LoadingSpinner;
