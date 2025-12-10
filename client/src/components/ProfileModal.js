'use client';
import { useState, useEffect, useCallback, memo } from 'react';
import { X, Trophy, Target, Flame, Star } from 'lucide-react';
import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';

const ProfileModal = memo(function ProfileModal({ 
  isOpen, 
  onClose, 
  deviceId: propDeviceId, 
  serverUrl 
}) {
  const [profile, setProfile] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats');
  const [deviceId, setDeviceId] = useState(propDeviceId);

  // Get deviceId on mount if not provided
  useEffect(() => {
    const getDeviceId = async () => {
      if (propDeviceId) {
        setDeviceId(propDeviceId);
        return;
      }
      
      let uuid = null;
      if (Capacitor.isNativePlatform()) {
        try {
          const info = await Device.getId();
          uuid = info.uuid;
        } catch (e) {
          console.error('Failed to get device ID:', e);
        }
      } else {
        uuid = localStorage.getItem('device_uuid');
        if (!uuid) {
          uuid = 'web_' + Math.random().toString(36).substr(2, 9);
          localStorage.setItem('device_uuid', uuid);
        }
      }
      
      console.log('[PROFILE] Got deviceId:', uuid);
      setDeviceId(uuid);
    };
    
    if (isOpen) {
      getDeviceId();
    }
  }, [isOpen, propDeviceId]);

  const fetchProfile = useCallback(async () => {
    if (!deviceId) {
      console.log('[PROFILE] No deviceId available');
      setLoading(false);
      return;
    }
    
    console.log('[PROFILE] Fetching profile for deviceId:', deviceId);
    
    try {
      setLoading(true);
      const [profileRes, achievementsRes] = await Promise.all([
        fetch(`${serverUrl}/api/profile?deviceId=${deviceId}`),
        fetch(`${serverUrl}/api/achievements`)
      ]);
      
      if (profileRes.ok) {
        const data = await profileRes.json();
        console.log('[PROFILE] Received profile:', data.profile);
        setProfile(data.profile);
      } else {
        console.error('[PROFILE] Profile request failed:', profileRes.status);
      }
      
      if (achievementsRes.ok) {
        const data = await achievementsRes.json();
        // Convert achievements object to array
        setAchievements(Object.values(data.achievements || {}));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [deviceId, serverUrl]);

  useEffect(() => {
    if (isOpen && deviceId) {
      fetchProfile();
    }
  }, [isOpen, deviceId, fetchProfile]);

  if (!isOpen) return null;

  const stats = profile?.stats || {
    gamesPlayed: 0,
    gamesWon: 0,
    timesImposter: 0,
    timesImposterWon: 0,
    correctVotes: 0,
    winStreak: 0,
    bestWinStreak: 0,
    totalPoints: 0
  };

  const winRate = stats.gamesPlayed > 0 
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) 
    : 0;

  const imposterWinRate = stats.timesImposter > 0 
    ? Math.round((stats.timesImposterWon / stats.timesImposter) * 100) 
    : 0;

  // achievements is array of {id, unlockedAt} objects, extract just the ids
  const unlockedAchievements = (profile?.achievements || []).map(a => a.id);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Mein Profil</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-3 text-sm font-medium transition ${
              activeTab === 'stats' 
                ? 'text-purple-400 border-b-2 border-purple-400' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Statistiken
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex-1 py-3 text-sm font-medium transition ${
              activeTab === 'achievements' 
                ? 'text-purple-400 border-b-2 border-purple-400' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Achievements ({unlockedAchievements.length}/{achievements.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
            </div>
          ) : activeTab === 'stats' ? (
            <div className="space-y-4">
              {/* Points Banner */}
              <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-2xl p-4 text-center border border-purple-500/30">
                <p className="text-slate-400 text-sm">Gesamtpunkte</p>
                <p className="text-4xl font-black text-white">{stats.totalPoints}</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard 
                  icon={<Target className="w-5 h-5" />}
                  label="Spiele"
                  value={stats.gamesPlayed}
                  color="blue"
                />
                <StatCard 
                  icon={<Trophy className="w-5 h-5" />}
                  label="Siege"
                  value={stats.gamesWon}
                  subtext={`${winRate}%`}
                  color="green"
                />
                <StatCard 
                  icon={<span className="text-lg">🎭</span>}
                  label="Als Imposter"
                  value={stats.timesImposter}
                  subtext={`${imposterWinRate}% gewonnen`}
                  color="red"
                />
                <StatCard 
                  icon={<span className="text-lg">🔍</span>}
                  label="Richtige Votes"
                  value={stats.correctVotes}
                  color="yellow"
                />
                <StatCard 
                  icon={<Flame className="w-5 h-5" />}
                  label="Aktuelle Streak"
                  value={stats.winStreak}
                  color="orange"
                />
                <StatCard 
                  icon={<Star className="w-5 h-5" />}
                  label="Beste Streak"
                  value={stats.bestWinStreak}
                  color="purple"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {achievements.map(achievement => {
                const isUnlocked = unlockedAchievements.includes(achievement.id);
                return (
                  <div 
                    key={achievement.id}
                    className={`p-3 rounded-xl border transition ${
                      isUnlocked 
                        ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30' 
                        : 'bg-white/5 border-white/10 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-2xl ${isUnlocked ? '' : 'grayscale'}`}>
                        {achievement.icon}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-white">{achievement.name}</p>
                        <p className="text-xs text-slate-400">{achievement.description}</p>
                      </div>
                      <div className={`text-sm font-bold ${isUnlocked ? 'text-yellow-400' : 'text-slate-500'}`}>
                        +{achievement.points}
                      </div>
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

const StatCard = memo(function StatCard({ icon, label, value, subtext, color }) {
  const colorClasses = {
    blue: 'from-blue-600/20 to-blue-800/20 border-blue-500/30',
    green: 'from-green-600/20 to-green-800/20 border-green-500/30',
    red: 'from-red-600/20 to-red-800/20 border-red-500/30',
    yellow: 'from-yellow-600/20 to-yellow-800/20 border-yellow-500/30',
    orange: 'from-orange-600/20 to-orange-800/20 border-orange-500/30',
    purple: 'from-purple-600/20 to-purple-800/20 border-purple-500/30'
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-3`}>
      <div className="flex items-center gap-2 text-slate-400 mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {subtext && <p className="text-xs text-slate-400">{subtext}</p>}
    </div>
  );
});

export default ProfileModal;
