'use client';
import { useState, useEffect, useCallback, memo } from 'react';
import { X, Trophy, ChevronUp, ChevronDown } from 'lucide-react';

const LeaderboardModal = memo(function LeaderboardModal({ 
  isOpen, 
  onClose, 
  serverUrl,
  currentDeviceId 
}) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('points');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${serverUrl}/api/leaderboard?type=${sortBy}&limit=50`
      );
      if (res.ok) {
        const data = await res.json();
        setPlayers(data.leaderboard || []);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, [serverUrl, sortBy, sortOrder]);

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

  if (!isOpen) return null;

  const sortLabels = {
    points: 'Punkte',
    wins: 'Siege',
    games: 'Spiele',
    streak: 'Streak'
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden">
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
        <div className="overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
            </div>
          ) : players.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p>Noch keine Spieler</p>
            </div>
          ) : (
            <div className="p-2">
              {players.map((player, index) => {
                const isCurrentUser = player.deviceId === currentDeviceId;
                const rank = index + 1;
                
                return (
                  <div 
                    key={player.deviceId}
                    className={`flex items-center gap-3 p-3 rounded-xl mb-2 transition ${
                      isCurrentUser 
                        ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500/30' 
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {/* Rank */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      rank === 1 ? 'bg-yellow-500 text-black' :
                      rank === 2 ? 'bg-slate-400 text-black' :
                      rank === 3 ? 'bg-amber-700 text-white' :
                      'bg-white/10 text-slate-400'
                    }`}>
                      {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank}
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${isCurrentUser ? 'text-purple-300' : 'text-white'}`}>
                        {player.username || 'Spieler'}
                        {isCurrentUser && <span className="text-purple-400 ml-1">(Du)</span>}
                      </p>
                      <div className="flex gap-3 text-xs text-slate-400">
                        <span>🎮 {player.stats?.gamesPlayed || 0}</span>
                        <span>🏆 {player.stats?.gamesWon || 0}</span>
                        <span>🔥 {player.stats?.bestWinStreak || 0}</span>
                      </div>
                    </div>

                    {/* Main Stat */}
                    <div className="text-right">
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
      </div>
    </div>
  );
});

export default LeaderboardModal;
