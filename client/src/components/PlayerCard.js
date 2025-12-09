'use client';
import { memo } from 'react';
import { Crown, Vote, CheckCircle } from 'lucide-react';

/**
 * Player card component with optimized rendering
 */
const PlayerCard = memo(function PlayerCard({
  user,
  isCurrentUser = false,
  isHost = false,
  showVoteButton = false,
  hasVoted = false,
  votedFor = false,
  onVote,
  className = '',
  index = 0
}) {
  const handleClick = () => {
    if (showVoteButton && onVote && !hasVoted && !isCurrentUser) {
      onVote(user.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative p-4 rounded-2xl border transition-all duration-200 gpu-accelerate
        animate-slide-up stagger-${(index % 4) + 1}
        ${isCurrentUser 
          ? 'bg-slate-800/50 border-purple-500/30 cursor-default' 
          : showVoteButton && !hasVoted
            ? 'bg-slate-800 border-slate-600 hover:border-purple-500 hover:bg-slate-700/80 cursor-pointer card-interactive'
            : 'bg-slate-800 border-slate-700 cursor-default'
        }
        ${votedFor ? 'ring-2 ring-purple-500 border-purple-500' : ''}
        ${hasVoted && !votedFor ? 'opacity-50' : ''}
        ${className}
      `}
      role={showVoteButton && !hasVoted && !isCurrentUser ? 'button' : undefined}
      tabIndex={showVoteButton && !hasVoted && !isCurrentUser ? 0 : undefined}
      aria-label={showVoteButton ? `Für ${user.name} abstimmen` : undefined}
    >
      {/* Host Crown */}
      {user.isHost && (
        <div className="absolute -top-2 -right-2 bg-yellow-500 p-1.5 rounded-full shadow-lg">
          <Crown className="w-3 h-3 text-slate-900" />
        </div>
      )}

      {/* Vote indicator */}
      {votedFor && (
        <div className="absolute -top-2 -left-2 bg-purple-500 p-1.5 rounded-full shadow-lg">
          <CheckCircle className="w-3 h-3 text-white" />
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative">
          <img 
            src={user.avatar} 
            alt={user.name} 
            className={`w-12 h-12 rounded-full bg-slate-700 object-cover ${isCurrentUser ? 'ring-2 ring-purple-500' : ''}`}
            loading="lazy"
          />
          {showVoteButton && !hasVoted && !isCurrentUser && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 hover:opacity-100 transition-opacity">
              <Vote className="w-5 h-5 text-white" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={`font-bold truncate ${isCurrentUser ? 'text-purple-300' : 'text-white'}`}>
            {user.name}
            {isCurrentUser && <span className="text-xs ml-1 text-slate-400">(Du)</span>}
          </p>
          {user.isHost && (
            <span className="text-xs text-yellow-400 flex items-center gap-1">
              <Crown className="w-3 h-3" /> Host
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

export default PlayerCard;
