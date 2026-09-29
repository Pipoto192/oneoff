'use client';
import { useState, useEffect, memo, useCallback } from 'react';
import { Trophy, Target, UserX, TrendingUp, Award, X, BarChart3 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

// Stats storage key
const STATS_KEY = 'oneoff_player_stats';

// Default stats structure
const defaultStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  timesImposter: 0,
  timesImposterWon: 0,
  correctVotes: 0,
  totalVotes: 0,
  fastestVote: null, // milliseconds
  currentStreak: 0,
  bestStreak: 0,
  lastPlayed: null
};

// Hook to manage player stats
export function usePlayerStats() {
  const [stats, setStats] = useState(defaultStats);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load stats from localStorage
  useEffect(() => {
    const loadStats = () => {
      try {
        const saved = localStorage.getItem(STATS_KEY);
        if (saved) {
          setStats({ ...defaultStats, ...JSON.parse(saved) });
        }
      } catch (e) {
        console.error('Failed to load stats:', e);
      }
      setIsLoaded(true);
    };
    loadStats();
  }, []);

  // Save stats to localStorage
  const saveStats = useCallback((newStats) => {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(newStats));
      setStats(newStats);
    } catch (e) {
      console.error('Failed to save stats:', e);
    }
  }, []);

  // Record game result
  const recordGameResult = useCallback((result) => {
    const {
      wasImposter,
      won,
      votedCorrectly,
      voteTimeMs
    } = result;

    setStats(prev => {
      const newStats = {
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1,
        gamesWon: won ? prev.gamesWon + 1 : prev.gamesWon,
        timesImposter: wasImposter ? prev.timesImposter + 1 : prev.timesImposter,
        timesImposterWon: (wasImposter && won) ? prev.timesImposterWon + 1 : prev.timesImposterWon,
        correctVotes: votedCorrectly ? prev.correctVotes + 1 : prev.correctVotes,
        totalVotes: prev.totalVotes + 1,
        fastestVote: voteTimeMs && (!prev.fastestVote || voteTimeMs < prev.fastestVote) 
          ? voteTimeMs 
          : prev.fastestVote,
        currentStreak: won ? prev.currentStreak + 1 : 0,
        bestStreak: won 
          ? Math.max(prev.bestStreak, prev.currentStreak + 1) 
          : prev.bestStreak,
        lastPlayed: new Date().toISOString()
      };
      
      saveStats(newStats);
      return newStats;
    });
  }, [saveStats]);

  // Calculate derived stats
  const getWinRate = useCallback(() => {
    if (stats.gamesPlayed === 0) return 0;
    return Math.round((stats.gamesWon / stats.gamesPlayed) * 100);
  }, [stats]);

  const getImposterWinRate = useCallback(() => {
    if (stats.timesImposter === 0) return 0;
    return Math.round((stats.timesImposterWon / stats.timesImposter) * 100);
  }, [stats]);

  const getVoteAccuracy = useCallback(() => {
    if (stats.totalVotes === 0) return 0;
    return Math.round((stats.correctVotes / stats.totalVotes) * 100);
  }, [stats]);

  const getImposterRate = useCallback(() => {
    if (stats.gamesPlayed === 0) return 0;
    return Math.round((stats.timesImposter / stats.gamesPlayed) * 100);
  }, [stats]);

  return {
    stats,
    isLoaded,
    recordGameResult,
    getWinRate,
    getImposterWinRate,
    getVoteAccuracy,
    getImposterRate
  };
}

// Stats Display Component
const StatCard = memo(function StatCard({ icon: Icon, label, value, subValue, color }) {
  const colorClasses = {
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30',
    pink: 'from-pink-500/20 to-pink-600/20 border-pink-500/30',
    orange: 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
    yellow: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30'
  };

  const iconColors = {
    purple: 'text-purple-400',
    green: 'text-green-400',
    pink: 'text-pink-400',
    orange: 'text-orange-400',
    yellow: 'text-yellow-400',
    blue: 'text-blue-400'
  };

  return (
    <div className={`p-4 rounded-2xl bg-gradient-to-br ${colorClasses[color]} border backdrop-blur-sm`}>
      <div className="flex items-center gap-3">
        <Icon className={`w-6 h-6 ${iconColors[color]}`} />
        <div>
          <p className="text-2xl font-black text-white">{value}</p>
          <p className="text-xs text-slate-400">{label}</p>
          {subValue && <p className="text-xs text-slate-500">{subValue}</p>}
        </div>
      </div>
    </div>
  );
});

// Stats Modal Component
const StatsModal = memo(function StatsModal({ isOpen, onClose }) {
  const { 
    stats, 
    getWinRate, 
    getImposterWinRate, 
    getVoteAccuracy,
    getImposterRate 
  } = usePlayerStats();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md safe-area-top safe-area-bottom">
      <div className="glass rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-slide-up border border-purple-500/20 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-400" />
            Deine Statistiken
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-2 hover:bg-slate-700 rounded-full transition-all btn-press"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Trophy}
            label="Spiele gewonnen"
            value={stats.gamesWon}
            subValue={`${getWinRate()}% Winrate`}
            color="yellow"
          />
          <StatCard
            icon={Target}
            label="Spiele gespielt"
            value={stats.gamesPlayed}
            color="purple"
          />
          <StatCard
            icon={UserX}
            label="Als Imposter"
            value={stats.timesImposter}
            subValue={`${getImposterRate()}% der Spiele`}
            color="pink"
          />
          <StatCard
            icon={Award}
            label="Imposter Siege"
            value={stats.timesImposterWon}
            subValue={`${getImposterWinRate()}% Winrate`}
            color="orange"
          />
          <StatCard
            icon={TrendingUp}
            label="Beste Serie"
            value={stats.bestStreak}
            subValue={`Aktuell: ${stats.currentStreak}`}
            color="green"
          />
          <StatCard
            icon={Target}
            label="Vote Accuracy"
            value={`${getVoteAccuracy()}%`}
            subValue={`${stats.correctVotes}/${stats.totalVotes}`}
            color="blue"
          />
        </div>

        {stats.fastestVote && (
          <div className="mt-4 p-3 bg-slate-800/50 rounded-xl text-center">
            <p className="text-xs text-slate-400">Schnellste richtige Abstimmung</p>
            <p className="text-lg font-bold text-purple-400">
              {(stats.fastestVote / 1000).toFixed(1)}s
            </p>
          </div>
        )}

        {stats.lastPlayed && (
          <p className="text-center text-xs text-slate-500 mt-4">
            Zuletzt gespielt: {new Date(stats.lastPlayed).toLocaleDateString('de-DE')}
          </p>
        )}
      </div>
    </div>
  );
});

export default StatsModal;
