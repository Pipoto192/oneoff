'use client';
import { useState, useEffect, useCallback, memo } from 'react';
import { X, Trophy, ChevronUp, ChevronDown, Share2 } from 'lucide-react';

const LeaderboardModal = memo(function LeaderboardModal({ 
  isOpen, 
  onClose, 
  serverUrl: propServerUrl,
  currentDeviceId 
}) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('points');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentUserData, setCurrentUserData] = useState(null);
  const [shareMessage, setShareMessage] = useState('');
  
  // Fallback serverUrl
  const serverUrl = propServerUrl || 'https://prominent-hookworm-dailyvibes-2b2f2caa.koyeb.app';

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${serverUrl}/api/leaderboard?type=${sortBy}&limit=200`
      );
      if (res.ok) {
        const data = await res.json();
        // Filter duplicates by deviceId (shouldn't happen but just in case)
        const uniquePlayers = [];
        const seenDeviceIds = new Set();
        for (const player of (data.leaderboard || [])) {
          if (!seenDeviceIds.has(player.deviceId)) {
            seenDeviceIds.add(player.deviceId);
            uniquePlayers.push(player);
          }
        }
        setPlayers(uniquePlayers);
        
        // Find current user in the list
        const user = uniquePlayers.find(p => p.deviceId === currentDeviceId);
        if (user) {
          const rank = uniquePlayers.indexOf(user) + 1;
          setCurrentUserData({ ...user, rank });
        } else {
          setCurrentUserData(null);
        }
      }
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [serverUrl, sortBy, currentDeviceId]);

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen, fetchLeaderboard]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleShare = () => {
    if (!currentUserData) return;
    
    const statValue = 
      sortBy === 'points' ? currentUserData.stats?.totalPoints || 0 :
      sortBy === 'wins' ? currentUserData.stats?.gamesWon || 0 :
      sortBy === 'games' ? currentUserData.stats?.gamesPlayed || 0 :
      currentUserData.stats?.bestWinStreak || 0;
    
    const statLabel = 
      sortBy === 'points' ? 'Punkte' :
      sortBy === 'wins' ? 'Siege' :
      sortBy === 'games' ? 'Spiele' :
      'Streak';
    
    const shareText = `🎵 Schau dir mein OneOff Ranking an! 🎵\nRang #${currentUserData.rank}: ${currentUserData.username}\n${statValue} ${statLabel}\n\nSpiele selbst auf oneoff.app!`;
    
    if (navigator.share) {
      navigator.share({
        text: shareText
      }).catch(err => console.error('Share failed:', err));
    } else {
      navigator.clipboard.writeText(shareText);
      setShareMessage('Text kopiert!');
      setTimeout(() => setShareMessage(''), 3000);
    }
  };

  if (!isOpen) return null;

  const sortLabels = {
    points: 'Punkte',
    wins: 'Siege',
    games: 'Spiele',
    streak: 'Streak'
  };

  // Separate current user from leaderboard
  const otherPlayers = players.filter(p => p.deviceId !== currentDeviceId);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-bold text-white">Rangliste</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Sort Options */}
        <div className="flex gap-2 p-3 border-b border-white/10 overflow-x-auto">
          {Object.entries(sortLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => handleSort(key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                sortBy === key
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-slate-400 hover:bg-white/20'
              }`}
            >
              {label}
              {sortBy === key && (
                sortOrder === 'desc' 
                  ? <ChevronDown className="w-4 h-4" />
                  : <ChevronUp className="w-4 h-4" />
              )}
            </button>
          ))}
        </div>

        {/* Leaderboard List */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
            </div>
          ) : otherPlayers.length === 0 && !currentUserData ? (
            <div className="text-center py-8 text-slate-400">
              <p>Noch keine Spieler</p>
            </div>
          ) : (
            <div className="p-2">
              {otherPlayers.map((player, index) => {
                const rank = index + 1;
                
                return (
                  <div 
                    key={player.deviceId}
                    className={`flex items-center gap-3 p-3 rounded-xl mb-2 transition bg-white/5 hover:bg-white/10`}
                  >
                    {/* Rank */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      rank === 1 ? 'bg-yellow-500 text-black' :
                      rank === 2 ? 'bg-slate-400 text-black' :
                      rank === 3 ? 'bg-amber-700 text-white' :
                      'bg-white/10 text-slate-400'
                    }`}>
                      {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank}
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-white">
                        {player.username || 'Spieler'}
                      </p>
                      <div className="flex gap-3 text-xs text-slate-400">
                        <span>🎮 {player.stats?.gamesPlayed || 0}</span>
                        <span>🏆 {player.stats?.gamesWon || 0}</span>
                        <span>🔥 {player.stats?.bestWinStreak || 0}</span>
                      </div>
                    </div>

                    {/* Main Stat */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-white">
                        {sortBy === 'points' && (player.stats?.totalPoints || 0)}
                        {sortBy === 'wins' && (player.stats?.gamesWon || 0)}
                        {sortBy === 'games' && (player.stats?.gamesPlayed || 0)}
                        {sortBy === 'streak' && (player.stats?.bestWinStreak || 0)}
                      </p>
                      <p className="text-xs text-slate-400">{sortLabels[sortBy]}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Current User Section (Sticky Bottom) */}
        {currentUserData && (
          <div className="border-t border-white/10 bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-3 space-y-3">
            <div className="flex items-center gap-3">
              {/* Rank */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                currentUserData.rank === 1 ? 'bg-yellow-500 text-black' :
                currentUserData.rank === 2 ? 'bg-slate-400 text-black' :
                currentUserData.rank === 3 ? 'bg-amber-700 text-white' :
                'bg-purple-600 text-white'
              }`}>
                {currentUserData.rank <= 3 ? ['🥇', '🥈', '🥉'][currentUserData.rank - 1] : `#${currentUserData.rank}`}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate">
                  {currentUserData.username || 'Du'}
                </p>
                <p className="text-xs text-purple-300">Rang #{currentUserData.rank}</p>
              </div>

              {/* Stat Display */}
              <div className="text-right flex-shrink-0">
                <p className="text-xl font-bold text-purple-300">
                  {sortBy === 'points' && (currentUserData.stats?.totalPoints || 0)}
                  {sortBy === 'wins' && (currentUserData.stats?.gamesWon || 0)}
                  {sortBy === 'games' && (currentUserData.stats?.gamesPlayed || 0)}
                  {sortBy === 'streak' && (currentUserData.stats?.bestWinStreak || 0)}
                </p>
                <p className="text-xs text-slate-400">{sortLabels[sortBy]}</p>
              </div>
            </div>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Share2 className="w-4 h-4" />
              {shareMessage || 'Mit Freunden teilen'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default LeaderboardModal;

