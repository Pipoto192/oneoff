'use client';
import { memo, useEffect, useState } from 'react';

/**
 * Circular countdown timer with SVG animation
 * Optimized for smooth 60fps animation
 */
const CountdownTimer = memo(function CountdownTimer({ 
  duration, 
  timeLeft, 
  size = 120,
  strokeWidth = 8,
  showSeconds = true,
  onComplete
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = ((duration - timeLeft) / duration) * circumference;

  // Color transitions based on time remaining
  const getColor = () => {
    const percentage = timeLeft / duration;
    if (percentage > 0.5) return '#a855f7'; // Purple
    if (percentage > 0.25) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  useEffect(() => {
    if (timeLeft === 0 && onComplete) {
      onComplete();
    }
  }, [timeLeft, onComplete]);

  return (
    <div className="relative inline-flex items-center justify-center gpu-accelerate">
      <svg 
        width={size} 
        height={size} 
        className="countdown-ring"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(51, 65, 85, 0.5)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          style={{
            transition: 'stroke-dashoffset 0.3s linear, stroke 0.5s ease',
            filter: `drop-shadow(0 0 6px ${getColor()})`
          }}
        />
      </svg>
      
      {showSeconds && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span 
            className="text-4xl font-bold font-mono"
            style={{ color: getColor(), transition: 'color 0.5s ease' }}
          >
            {timeLeft}
          </span>
          <span className="text-xs text-slate-400 uppercase tracking-wider">Sek</span>
        </div>
      )}
    </div>
  );
});

export default CountdownTimer;
