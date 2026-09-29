'use client';
import { memo } from 'react';

/**
 * Animated music wave visualization component
 * Optimized for performance with CSS animations
 */
const MusicWave = memo(function MusicWave({ 
  isPlaying = true, 
  color = 'purple',
  size = 'md',
  className = '' 
}) {
  const sizeClasses = {
    sm: 'h-8 gap-0.5',
    md: 'h-16 gap-1',
    lg: 'h-24 gap-1.5',
    xl: 'h-32 gap-2'
  };

  const barWidths = {
    sm: 'w-1',
    md: 'w-1.5',
    lg: 'w-2',
    xl: 'w-3'
  };

  const colorClasses = {
    purple: 'bg-gradient-to-t from-purple-600 to-purple-400',
    pink: 'bg-gradient-to-t from-pink-600 to-pink-400',
    green: 'bg-gradient-to-t from-green-600 to-green-400',
    red: 'bg-gradient-to-t from-red-600 to-red-400',
    gradient: 'bg-gradient-to-t from-purple-600 via-pink-500 to-orange-400'
  };

  return (
    <div 
      className={`flex items-end justify-center ${sizeClasses[size]} ${className}`}
      role="img"
      aria-label="Music playing visualization"
    >
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`
            ${barWidths[size]} 
            ${colorClasses[color]} 
            rounded-full 
            gpu-accelerate
            ${isPlaying ? 'music-wave-bar' : 'h-[20%]'}
          `}
          style={{
            animationDelay: `${i * 0.1}s`,
            transition: 'height 0.3s ease'
          }}
        />
      ))}
    </div>
  );
});

export default MusicWave;
