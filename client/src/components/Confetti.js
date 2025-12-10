'use client';
import { useEffect, useState, memo } from 'react';

const CONFETTI_COLORS = [
  '#ff0080', '#ff00ff', '#00ffff', '#00ff80', '#ffff00', '#ff8000',
  '#8000ff', '#0080ff', '#ff0040', '#40ff00'
];

const ConfettiPiece = memo(function ConfettiPiece({ style, color }) {
  return (
    <div
      className="absolute animate-confetti-fall pointer-events-none"
      style={{
        left: style.left,
        top: style.top,
        width: style.width,
        height: style.height,
        backgroundColor: color,
        borderRadius: style.isCircle ? '50%' : '2px',
        transform: `rotate(${style.rotation}deg)`,
        animationDuration: style.duration,
        animationDelay: style.delay,
        opacity: 0.9
      }}
    />
  );
});

const Confetti = memo(function Confetti({ 
  isActive = false, 
  duration = 3000, 
  pieceCount = 100,
  onComplete 
}) {
  const [pieces, setPieces] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isActive) {
      setIsVisible(true);
      
      // Generate confetti pieces
      const newPieces = Array.from({ length: pieceCount }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `-${Math.random() * 20 + 10}%`,
        width: `${Math.random() * 8 + 4}px`,
        height: `${Math.random() * 12 + 6}px`,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: Math.random() * 360,
        duration: `${Math.random() * 2 + 2}s`,
        delay: `${Math.random() * 0.5}s`,
        isCircle: Math.random() > 0.7
      }));
      
      setPieces(newPieces);

      // Clean up after duration
      const timeout = setTimeout(() => {
        setIsVisible(false);
        setPieces([]);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timeout);
    }
  }, [isActive, duration, pieceCount, onComplete]);

  if (!isVisible || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
      {pieces.map(piece => (
        <ConfettiPiece
          key={piece.id}
          style={piece}
          color={piece.color}
        />
      ))}
    </div>
  );
});

// Achievement Unlock Animation Component
export const AchievementPopup = memo(function AchievementPopup({ 
  achievement, 
  isVisible, 
  onClose 
}) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible || !achievement) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
      <div className="glass rounded-2xl p-4 border border-yellow-500/50 shadow-2xl flex items-center gap-4 min-w-[280px]">
        <div className="text-4xl animate-bounce-slow">
          {achievement.icon}
        </div>
        <div className="flex-1">
          <p className="text-xs text-yellow-400 font-bold uppercase tracking-wider">
            Achievement freigeschaltet!
          </p>
          <p className="text-white font-bold text-lg">{achievement.name}</p>
          <p className="text-slate-400 text-sm">{achievement.description}</p>
        </div>
        <div className="text-yellow-400 font-bold text-lg">
          +{achievement.points}
        </div>
      </div>
    </div>
  );
});

// Victory Animation Component
export const VictoryAnimation = memo(function VictoryAnimation({ 
  isWinner, 
  isImposter,
  onComplete 
}) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
      <div className={`text-center animate-victory-scale ${isWinner ? 'text-green-400' : 'text-red-400'}`}>
        <div className="text-8xl mb-4">
          {isWinner ? (isImposter ? '🎭' : '🏆') : '💀'}
        </div>
        <h1 className="text-5xl font-black">
          {isWinner ? 'GEWONNEN!' : 'VERLOREN!'}
        </h1>
      </div>
    </div>
  );
});

export default Confetti;
