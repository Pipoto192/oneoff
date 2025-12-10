'use client';
import { useEffect, useState, useRef, Suspense, useCallback, memo } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useSearchParams, useRouter } from 'next/navigation';
import { Play, User, Music, AlertTriangle, Crown, CheckCircle, ListMusic, Gem, X, Search, Link, Copy, Share2, ArrowLeft, Settings, Users, Clock, UserX, Bluetooth, Wifi, Ban, Timer, Share } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Device } from '@capacitor/device';
import { AdMob } from '@capacitor-community/admob';
import { useToast } from '@/components/Toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import MusicWave from '@/components/MusicWave';
import CountdownTimer from '@/components/CountdownTimer';
import PlayerCard from '@/components/PlayerCard';
import ShareResult from '@/components/ShareResult';
import SavedPlaylists, { useSavedPlaylists } from '@/components/SavedPlaylists';
import Confetti, { AchievementPopup, VictoryAnimation } from '@/components/Confetti';
import useHaptics from '@/hooks/useHaptics';

// Header Component
const Header = memo(function Header({ roomId, userCount, onBack, onShare }) {
  const { lightImpact } = useHaptics();
  
  return (
    <header className="flex justify-between items-center p-4 glass rounded-2xl mb-6 animate-slide-up">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => { lightImpact(); onBack(); }}
          className="p-2 hover:bg-slate-700/50 rounded-xl transition-all btn-press"
          aria-label="Zurück"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </button>
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-2 rounded-xl">
          <Music className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Raum: {roomId}</h1>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <User className="w-3 h-3" />
            <span>{userCount} Spieler</span>
          </div>
        </div>
      </div>
      <button 
        onClick={() => { lightImpact(); onShare(); }}
        className="p-3 hover:bg-slate-700/50 rounded-xl transition-all btn-press"
        aria-label="Teilen"
      >
        <Share2 className="w-5 h-5 text-purple-400" />
      </button>
    </header>
  );
});

// Playlist Search Component
const PlaylistSearch = memo(function PlaylistSearch({ 
  searchQuery, 
  setSearchQuery, 
  searchResults, 
  isSearching, 
  onSearch, 
  onSelect,
  playlistLink,
  setPlaylistLink,
  onLoadLink
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm text-slate-400 flex items-center gap-2">
          <Search className="w-4 h-4" />
          Playlist suchen
        </label>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="z.B. 'Top 50 Germany'" 
            className="flex-1 bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          />
          <button 
            onClick={onSearch}
            disabled={isSearching || !searchQuery}
            className="px-5 py-3 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 rounded-xl text-sm font-bold transition-all btn-press disabled:opacity-50"
          >
            {isSearching ? <LoadingSpinner size="sm" variant="dots" /> : 'Suchen'}
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 mt-3">
            {searchResults.map(pl => {
              if (!pl) return null;
              return (
                <button
                  key={pl.id}
                  onClick={() => onSelect(pl.id, pl.name, pl.images?.[0]?.url, pl.owner?.display_name)}
                  className="p-3 rounded-xl text-left text-sm glass hover:bg-slate-700/80 flex items-center gap-3 transition-all card-interactive"
                >
                  {pl.images?.[0]?.url ? (
                    <img src={pl.images[0].url} className="w-12 h-12 rounded-lg object-cover" alt="" loading="lazy" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center">
                      <Music className="w-5 h-5 text-slate-500" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">{pl.name}</p>
                    <p className="text-xs text-slate-400 truncate">von {pl.owner?.display_name || 'Unbekannt'}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-slate-600/50"></div>
        <span className="flex-shrink-0 mx-4 text-slate-500 text-xs">ODER LINK EINFÜGEN</span>
        <div className="flex-grow border-t border-slate-600/50"></div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Spotify Playlist Link..." 
            className="w-full bg-slate-900/80 border border-slate-600 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all"
            value={playlistLink}
            onChange={(e) => setPlaylistLink(e.target.value)}
          />
        </div>
        <button 
          onClick={onLoadLink}
          disabled={!playlistLink}
          className="px-5 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 rounded-xl text-sm font-bold transition-all btn-press disabled:opacity-50"
        >
          Laden
        </button>
      </div>
    </div>
  );
});

// Game Settings Panel Component (NEW)
const GameSettingsPanel = memo(function GameSettingsPanel({ 
  settings, 
  showRoles, 
  playerCount,
  onUpdateSettings, 
  onToggleRoles 
}) {
  const { lightImpact } = useHaptics();
  
  // Calculate max imposters based on player count
  const maxImposters = playerCount < 4 ? 1 : (playerCount < 6 ? 2 : 3);
  
  const durationOptions = [
    { value: 15, label: '15s' },
    { value: 30, label: '30s' },
  ];

  return (
    <div className="pt-5 border-t border-slate-700/50 space-y-4">
      <h3 className="text-base font-bold flex items-center gap-2">
        <Settings className="w-5 h-5 text-purple-400" />
        Spieleinstellungen
      </h3>
      
      {/* Imposter Count */}
      <div className="p-4 bg-slate-800/50 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserX className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium">Anzahl Imposter</span>
          </div>
          <span className="text-xs text-slate-400">
            {playerCount < 4 && '(min. 4 Spieler für 2)'}
            {playerCount >= 4 && playerCount < 6 && '(min. 6 Spieler für 3)'}
          </span>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map(num => {
            const disabled = num > maxImposters;
            const active = settings.imposterCount === num;
            return (
              <button
                key={num}
                onClick={() => {
                  if (!disabled) {
                    lightImpact();
                    onUpdateSettings({ imposterCount: num });
                  }
                }}
                disabled={disabled}
                className={`flex-1 py-3 rounded-xl font-bold transition-all btn-press ${
                  active 
                    ? 'bg-red-600 text-white' 
                    : disabled 
                      ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                      : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
              >
                {num}
              </button>
            );
          })}
        </div>
      </div>

      {/* Song Duration */}
      <div className="p-4 bg-slate-800/50 rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium">Song-Länge</span>
        </div>
        <div className="flex gap-2">
          {durationOptions.map(opt => {
            const active = settings.songDuration === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  lightImpact();
                  onUpdateSettings({ songDuration: opt.value });
                }}
                className={`flex-1 py-3 rounded-xl font-bold transition-all btn-press ${
                  active 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Show Roles Toggle */}
      <label className="flex items-center gap-4 cursor-pointer group p-3 rounded-xl hover:bg-slate-700/30 transition-all">
        <div className="relative">
          <input 
            type="checkbox" 
            className="sr-only peer"
            checked={showRoles || false}
            onChange={onToggleRoles}
          />
          <div className="w-12 h-7 bg-slate-700 peer-focus:ring-4 peer-focus:ring-purple-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-[22px] after:w-[22px] after:transition-all peer-checked:bg-purple-600 gpu-accelerate"></div>
        </div>
        <div>
          <span className="text-slate-200 font-medium">Rollen anzeigen</span>
          <p className="text-xs text-slate-500">Zeigt an, wer Imposter/Normal ist</p>
        </div>
      </label>
    </div>
  );
});

// Player Card with Kick Option (NEW)
const PlayerCardWithKick = memo(function PlayerCardWithKick({
  user,
  isCurrentUser,
  isHost,
  canKick,
  onKick,
  index
}) {
  const [showKickMenu, setShowKickMenu] = useState(false);
  const { lightImpact } = useHaptics();

  return (
    <div className="relative">
      <div
        onClick={() => {
          if (canKick && !isCurrentUser) {
            lightImpact();
            setShowKickMenu(!showKickMenu);
          }
        }}
        className={`
          relative p-4 rounded-2xl border transition-all duration-200 gpu-accelerate
          animate-slide-up stagger-${(index % 4) + 1}
          ${isCurrentUser 
            ? 'bg-slate-800/50 border-purple-500/30' 
            : canKick 
              ? 'bg-slate-800 border-slate-600 hover:border-red-500/50 cursor-pointer'
              : 'bg-slate-800 border-slate-700'
          }
        `}
      >
        {user.isHost && (
          <div className="absolute -top-2 -right-2 bg-yellow-500 p-1.5 rounded-full shadow-lg">
            <Crown className="w-3 h-3 text-slate-900" />
          </div>
        )}

        <div className="flex items-center gap-3">
          <img 
            src={user.avatar} 
            alt={user.name} 
            className={`w-12 h-12 rounded-full bg-slate-700 object-cover ${isCurrentUser ? 'ring-2 ring-purple-500' : ''}`}
            loading="lazy"
          />
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

      {/* Kick Menu */}
      {showKickMenu && canKick && !isCurrentUser && (
        <div className="absolute top-full left-0 right-0 mt-2 z-10 glass rounded-xl p-2 space-y-1 animate-slide-up">
          <button
            onClick={() => {
              onKick(user.id, false);
              setShowKickMenu(false);
            }}
            className="w-full py-2 px-3 text-left text-sm hover:bg-slate-700 rounded-lg flex items-center gap-2 transition-all"
          >
            <UserX className="w-4 h-4 text-orange-400" />
            Kicken
          </button>
          <button
            onClick={() => {
              onKick(user.id, true);
              setShowKickMenu(false);
            }}
            className="w-full py-2 px-3 text-left text-sm hover:bg-red-900/50 rounded-lg flex items-center gap-2 text-red-400 transition-all"
          >
            <Ban className="w-4 h-4" />
            Bannen
          </button>
        </div>
      )}
    </div>
  );
});

// Nearby Lobbies Component (NEW)
const NearbyLobbies = memo(function NearbyLobbies({ lobbies, onJoin, isScanning }) {
  if (lobbies.length === 0 && !isScanning) {
    return (
      <div className="text-center py-6 text-slate-400">
        <Wifi className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Keine Lobbys in der Nähe gefunden</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {isScanning && (
        <div className="flex items-center justify-center gap-2 py-3 text-purple-400">
          <LoadingSpinner size="sm" variant="dots" />
          <span className="text-sm">Suche Lobbys in der Nähe...</span>
        </div>
      )}
      {lobbies.map(lobby => (
        <button
          key={lobby.roomId}
          onClick={() => onJoin(lobby.roomId)}
          className="w-full p-4 glass rounded-xl flex items-center justify-between hover:bg-slate-700/50 transition-all card-interactive"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600/20 rounded-lg">
              <Wifi className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-left">
              <p className="font-medium text-white">{lobby.hostName}'s Lobby</p>
              <p className="text-xs text-slate-400">
                {lobby.playerCount} Spieler • {lobby.playlistName || 'Standard Playlist'}
              </p>
            </div>
          </div>
          <span className="text-xs text-purple-400 font-mono">{lobby.roomId}</span>
        </button>
      ))}
    </div>
  );
});

// Results View Component
const ResultsView = memo(function ResultsView({ results, currentUserId }) {
  const { success, error: errorHaptic } = useHaptics();
  const [showConfetti, setShowConfetti] = useState(false);
  const [showVictoryAnim, setShowVictoryAnim] = useState(false);
  const [newAchievement, setNewAchievement] = useState(null);
  
  // Determine if current user is a winner
  const imposters = (results?.imposters || (results?.imposter ? [results.imposter] : [])).filter(Boolean);
  const isCurrentUserImposter = imposters.some(imp => imp.id === currentUserId);
  const imposterCaught = results?.imposterCaught;
  
  // Current user wins if: (imposter caught AND not imposter) OR (imposter not caught AND is imposter)
  const isWinner = imposterCaught ? !isCurrentUserImposter : isCurrentUserImposter;
  
  useEffect(() => {
    if (results?.imposterCaught) {
      success();
    } else {
      errorHaptic();
    }
    
    // Show victory animation and confetti for winners
    setShowVictoryAnim(true);
    if (isWinner) {
      setShowConfetti(true);
    }
    
    // Check for new achievements in results
    if (results?.newAchievements && results.newAchievements.length > 0) {
      // Show achievements one by one with delay
      results.newAchievements.forEach((achievement, index) => {
        setTimeout(() => {
          setNewAchievement(achievement);
        }, 2000 + (index * 4500)); // Stagger achievement popups
      });
    }
  }, [results?.imposterCaught, success, errorHaptic, isWinner, results?.newAchievements]);

  if (!results) return null;
  
  // Get sorted scores for leaderboard
  const sortedScores = [...(results.scores || [])].sort((a, b) => (b.score || 0) - (a.score || 0));
  
  // Check if this is a multi-round game
  const hasMultipleRounds = results.totalRounds && results.totalRounds > 1;

  return (
    <div className="max-w-2xl mx-auto text-center space-y-6 pt-4 animate-slide-up">
      {/* Confetti for winners */}
      <Confetti 
        isActive={showConfetti} 
        duration={4000} 
        pieceCount={150}
        onComplete={() => setShowConfetti(false)}
      />
      
      {/* Victory/Defeat Animation */}
      {showVictoryAnim && (
        <VictoryAnimation 
          isWinner={isWinner}
          isImposter={isCurrentUserImposter}
          onComplete={() => setShowVictoryAnim(false)}
        />
      )}
      
      {/* Achievement Popup */}
      <AchievementPopup 
        achievement={newAchievement}
        isVisible={!!newAchievement}
        onClose={() => setNewAchievement(null)}
      />

      <div className="mb-6">
        {results.imposterCaught ? (
          <div className="text-green-500 flex flex-col items-center gap-3">
            <div className={`p-5 bg-green-500/20 rounded-full ${!isCurrentUserImposter ? 'animate-glow-pulse' : ''}`}>
              <CheckCircle className="w-14 h-14" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">Imposter gefasst! 🎉</h2>
            <p className={`text-lg font-medium ${isWinner ? 'text-green-400' : 'text-red-400'}`}>
              {isWinner ? 'Du hast gewonnen! 🏆' : 'Du wurdest erwischt! 😅'}
            </p>
          </div>
        ) : (
          <div className="text-red-500 flex flex-col items-center gap-3">
            <div className={`p-5 bg-red-500/20 rounded-full ${isCurrentUserImposter ? 'animate-glow-pulse' : ''}`}>
              <AlertTriangle className="w-14 h-14" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">
              {imposters.length > 1 ? 'Imposter gewinnen!' : 'Imposter gewinnt!'} 😈
            </h2>
            <p className={`text-lg font-medium ${isWinner ? 'text-green-400' : 'text-red-400'}`}>
              {isWinner ? 'Du hast gewonnen! 🎭' : 'Du hast verloren! 💀'}
            </p>
          </div>
        )}
      </div>

      <div className="glass p-5 rounded-3xl space-y-5">
        <div>
          <p className="text-slate-400 mb-2 text-sm uppercase tracking-wider">
            {imposters.length > 1 ? 'Die Imposter waren' : 'Der Imposter war'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {imposters.map(imp => (
              <div key={imp.id || Math.random()} className="flex items-center gap-2">
                <img src={imp.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${imp.name}`} className="w-10 h-10 rounded-full ring-2 ring-red-500" alt="" />
                <span className="text-lg font-bold text-red-400">{imp.name || 'Unbekannt'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-700/50">
          <div className="text-left p-3 bg-green-500/10 rounded-xl border border-green-500/20">
            <p className="text-xs text-green-400 uppercase mb-1 font-medium">Normaler Song</p>
            <p className="font-bold text-white truncate text-sm">{results.songs?.common?.title || 'Unbekannt'}</p>
            <p className="text-xs text-slate-400 truncate">{results.songs?.common?.artist || ''}</p>
          </div>
          <div className="text-left p-3 bg-red-500/10 rounded-xl border border-red-500/20">
            <p className="text-xs text-red-400 uppercase mb-1 font-medium">Imposter Song</p>
            <p className="font-bold text-white truncate text-sm">{results.songs?.imposter?.title || 'Unbekannt'}</p>
            <p className="text-xs text-slate-400 truncate">{results.songs?.imposter?.artist || ''}</p>
          </div>
        </div>
      </div>

      {/* Leaderboard for multi-round games */}
      {hasMultipleRounds && sortedScores.length > 0 && (
        <div className="glass p-4 rounded-2xl">
          <h3 className="text-lg font-bold mb-3 flex items-center justify-center gap-2">
            <span>🏆</span> Punktestand
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {sortedScores.map((player, index) => (
              <div 
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-xl ${
                  player.id === currentUserId 
                    ? 'bg-purple-600/30 border border-purple-500/50' 
                    : 'bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </span>
                  <span className="font-medium">{player.name}</span>
                </div>
                <span className="font-bold text-purple-400">{player.score || 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Share Result */}
      <ShareResult 
        results={results}
        currentUserId={currentUserId}
      />

      <div className="flex items-center justify-center gap-2 text-slate-400">
        <LoadingSpinner size="sm" variant="dots" />
        <span>
          {results.isGameComplete 
            ? 'Zurück zur Lobby...' 
            : hasMultipleRounds 
              ? 'Nächste Runde startet...'
              : 'Zurück zur Lobby...'
          }
        </span>
      </div>
    </div>
  );
});

function LobbyContent() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get('id');
  const socket = useSocket();
  const router = useRouter();
  const { showToast } = useToast();
  const { lightImpact, success, error: errorHaptic, heavyImpact } = useHaptics();
  
  const [room, setRoom] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [voteCount, setVoteCount] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedForId, setVotedForId] = useState(null);
  const [votingTimeLeft, setVotingTimeLeft] = useState(30);
  const audioRef = useRef(null);
  const gamesPlayedRef = useRef(0);

  // Settings state
  const [settings, setSettings] = useState({
    imposterCount: 1,
    songDuration: 30,
    isPrivate: false
  });
  const [maxImposters, setMaxImposters] = useState(1);

  // Pro State
  const [isPro, setIsPro] = useState(false);

  // Spotify State
  const [spotifyToken, setSpotifyToken] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [playlistLink, setPlaylistLink] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Saved Playlists Hook
  const { addRecent } = useSavedPlaylists();

  // Nearby Lobbies State
  const [nearbyLobbies, setNearbyLobbies] = useState([]);
  const [isNearbyEnabled, setIsNearbyEnabled] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Get server URL
  const getServerUrl = useCallback(() => {
    let serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://prominent-hookworm-dailyvibes-2b2f2caa.koyeb.app';
    if (!Capacitor.isNativePlatform() && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      serverUrl = 'http://localhost:3001';
    }
    return serverUrl;
  }, []);

  // Check Pro Status
  useEffect(() => {
    const checkProStatus = async () => {
      try {
        let uuid = null;
        if (Capacitor.isNativePlatform()) {
          const info = await Device.getId();
          uuid = info.uuid;
        } else {
          uuid = localStorage.getItem('device_uuid');
        }

        if (!uuid) return;

        const res = await fetch(`${getServerUrl()}/api/status?deviceId=${uuid}`);
        const data = await res.json();
        if (data.isPro) {
          setIsPro(true);
        }
      } catch (e) {
        console.error("Failed to check pro status:", e);
      }
    };
    checkProStatus();
  }, [getServerUrl]);

  // Initialize AdMob
  useEffect(() => {
    if (Capacitor.isNativePlatform() && !isPro) {
      AdMob.initialize({
        requestTrackingAuthorization: true,
        initializeForTesting: false,
      }).catch(err => console.error('AdMob Init Error:', err));
    }
  }, [isPro]);

  const showInterstitial = useCallback(async () => {
    if (!Capacitor.isNativePlatform() || isPro) return;
    try {
      await AdMob.prepareInterstitial({
        adId: 'ca-app-pub-9755109992994241/1905502829',
        isTesting: false
      });
      await AdMob.showInterstitial();
    } catch (e) {
      console.error('AdMob Show Error:', e);
    }
  }, [isPro]);

  // Handle Deep Links
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      App.addListener('appUrlOpen', (data) => {
        if (data.url.includes('spotify-callback')) {
          const hash = data.url.split('#')[1];
          if (hash) {
            const params = new URLSearchParams(hash);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            const error = params.get('error');

            if (accessToken) {
              localStorage.setItem('spotify_access_token', accessToken);
              if (refreshToken) localStorage.setItem('spotify_refresh_token', refreshToken);
              setSpotifyToken(accessToken);
              showToast('Spotify verbunden!', 'success');
            } else if (error) {
              showToast('Spotify Login fehlgeschlagen', 'error');
            }
          }
        }
      });
    }
  }, [showToast]);

  // Socket handlers
  useEffect(() => {
    if (!roomId) {
      router.push('/');
      return;
    }

    if (!socket) return;

    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    setSpotifyToken(null);

    if (!userId || !username) {
      router.push('/');
      return;
    }

    socket.emit('join_room', { roomId, username, userId });

    socket.on('joined_room', ({ room, userId: newUserId }) => {
      setRoom(room);
      setCurrentUser(room.users.find(u => u.id === (userId || newUserId)));
      if (room.settings) {
        setSettings(room.settings);
      }
    });

    socket.on('user_joined', ({ room }) => {
      setRoom(room);
      lightImpact();
    });

    socket.on('user_left', ({ room, kickedUser }) => {
      setRoom(room);
      if (kickedUser) {
        showToast(`${kickedUser} wurde entfernt`, 'info');
      }
    });

    socket.on('kicked_from_room', ({ message, banned }) => {
      errorHaptic();
      showToast(message, 'error');
      router.push('/');
    });

    socket.on('room_settings_updated', ({ showRoles }) => {
      setRoom(prev => ({ ...prev, showRoles }));
    });

    socket.on('settings_updated', ({ settings: newSettings, maxImposters: newMax }) => {
      setSettings(newSettings);
      setMaxImposters(newMax);
      setRoom(prev => prev ? { ...prev, settings: newSettings } : prev);
    });

    socket.on('playlist_updated', ({ playlistName, trackCount }) => {
      setRoom(prev => ({ ...prev, playlistName, trackCount }));
      showToast(`Playlist geladen: ${playlistName}`, 'success');
    });

    socket.on('game_started', (data) => {
      setGameData(data);
      setRoom(prev => ({ ...prev, gameState: 'PLAYING' }));
      setTimeLeft(data.duration);
      heavyImpact();
      
      if (audioRef.current) {
        audioRef.current.src = data.song.url;
        audioRef.current.play().catch(e => console.error("Audio play failed", e));
      }
    });

    socket.on('voting_started', () => {
      setRoom(prev => ({ ...prev, gameState: 'VOTING' }));
      setVoteCount(0);
      setHasVoted(false);
      setVotedForId(null);
      setVotingTimeLeft(30);
      heavyImpact();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    });

    socket.on('vote_update', ({ count }) => {
      setVoteCount(count);
    });

    socket.on('game_over', (results) => {
      setRoom(prev => ({ ...prev, gameState: 'RESULTS' }));
      setGameData(prev => ({ ...prev, results }));
      
      gamesPlayedRef.current += 1;
      if (gamesPlayedRef.current % 2 === 0) {
        showInterstitial();
      }
    });

    socket.on('return_to_lobby', ({ room }) => {
      setRoom(room);
      setGameData(null);
    });

    socket.on('nearby_lobbies', ({ lobbies }) => {
      setNearbyLobbies(lobbies);
      setIsScanning(false);
    });

    socket.on('error', ({ message }) => {
      if (message === 'Raum nicht gefunden') {
        showToast('Raum nicht gefunden oder abgelaufen.', 'error');
        router.push('/');
      } else {
        showToast(message, 'error');
      }
    });

    return () => {
      socket.off('joined_room');
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('kicked_from_room');
      socket.off('room_settings_updated');
      socket.off('settings_updated');
      socket.off('playlist_updated');
      socket.off('game_started');
      socket.off('voting_started');
      socket.off('vote_update');
      socket.off('game_over');
      socket.off('return_to_lobby');
      socket.off('nearby_lobbies');
      socket.off('error');
    };
  }, [socket, roomId, router, showToast, lightImpact, heavyImpact, showInterstitial, errorHaptic]);

  // Game Timer
  useEffect(() => {
    if (timeLeft > 0 && room?.gameState === 'PLAYING') {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, room?.gameState]);

  // Voting Timer
  useEffect(() => {
    if (votingTimeLeft > 0 && room?.gameState === 'VOTING') {
      const timer = setInterval(() => setVotingTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [votingTimeLeft, room?.gameState]);

  // Handlers
  const handleSearch = useCallback(async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const res = await fetch(`${getServerUrl()}/api/search?q=${encodeURIComponent(searchQuery)}&type=playlist`);
      const data = await res.json();
      if (data.playlists?.items) {
        setSearchResults(data.playlists.items);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      showToast('Fehler bei der Suche', 'error');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, getServerUrl, showToast]);

  const handlePlaylistSelect = useCallback((playlistId, playlistName, playlistImage = null, playlistOwner = null) => {
    setSelectedPlaylist(playlistId);
    setSearchResults([]);
    setSearchQuery('');
    socket.emit('select_playlist', { 
      roomId, 
      playlistId, 
      accessToken: spotifyToken,
      playlistName 
    });
    
    // Save to recent playlists
    addRecent({
      id: playlistId,
      name: playlistName,
      image: playlistImage,
      owner: playlistOwner
    });
    
    lightImpact();
  }, [socket, roomId, spotifyToken, lightImpact, addRecent]);

  const handleLoadLink = useCallback(() => {
    if (!playlistLink) return;
    const match = playlistLink.match(/playlist\/([a-zA-Z0-9]+)/);
    if (match?.[1]) {
      handlePlaylistSelect(match[1], 'Öffentliche Playlist');
      setPlaylistLink('');
    } else {
      showToast('Ungültiger Spotify Link', 'error');
    }
  }, [playlistLink, handlePlaylistSelect, showToast]);

  const handleUpdateSettings = useCallback((newSettings) => {
    socket.emit('update_settings', { 
      roomId, 
      settings: { ...settings, ...newSettings } 
    });
  }, [socket, roomId, settings]);

  const handleKickPlayer = useCallback((targetUserId, ban) => {
    socket.emit('kick_player', { roomId, targetUserId, ban });
    lightImpact();
    showToast(ban ? 'Spieler gebannt' : 'Spieler gekickt', 'success');
  }, [socket, roomId, lightImpact, showToast]);

  const startGame = useCallback(() => {
    if (!room?.playlistName && !room?.availableTracks) {
      if (!confirm("Keine Playlist ausgewählt. Standard-Songs verwenden?")) return;
    }
    socket.emit('start_game', { roomId });
    heavyImpact();
  }, [socket, roomId, room, heavyImpact]);

  const toggleShowRoles = useCallback((e) => {
    socket.emit('toggle_show_roles', { roomId, showRoles: e.target.checked });
    lightImpact();
  }, [socket, roomId, lightImpact]);

  const submitVote = useCallback((suspectId) => {
    if (hasVoted) return;
    const userId = localStorage.getItem('userId');
    socket.emit('vote', { roomId, voterId: userId, suspectId });
    setHasVoted(true);
    setVotedForId(suspectId);
    success();
  }, [hasVoted, socket, roomId, success]);

  const handleShare = useCallback(async () => {
    const shareText = `Tritt meinem OneOff Spiel bei! Code: ${roomId}`;
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch (e) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(roomId);
      showToast('Code kopiert!', 'success');
    }
    lightImpact();
  }, [roomId, showToast, lightImpact]);

  const handleBack = useCallback(() => {
    router.push('/');
  }, [router]);

  // Enable Nearby Discovery
  const toggleNearbyDiscovery = useCallback(async () => {
    if (!socket) return;
    
    if (isNearbyEnabled) {
      setIsNearbyEnabled(false);
      socket.emit('set_nearby_id', { roomId, nearbyId: null });
    } else {
      // Generate a nearby ID based on device/location
      // In production, this would use actual Bluetooth or WiFi Direct
      let nearbyId = 'nearby_' + Math.random().toString(36).substr(2, 6);
      
      // Try to get a more unique ID on mobile
      if (Capacitor.isNativePlatform()) {
        try {
          const info = await Device.getId();
          nearbyId = 'nearby_' + info.uuid.substr(0, 8);
        } catch (e) {
          console.error('Could not get device ID for nearby:', e);
        }
      }
      
      setIsNearbyEnabled(true);
      socket.emit('set_nearby_id', { roomId, nearbyId });
      showToast('Lobby ist jetzt in der Nähe sichtbar', 'success');
    }
    lightImpact();
  }, [socket, roomId, isNearbyEnabled, lightImpact, showToast]);

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <LoadingSpinner size="lg" variant="music" text="Verbinde..." />
      </div>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-slate-900 text-white p-4 overflow-x-hidden safe-area-top safe-area-bottom">
      <audio ref={audioRef} className="hidden" preload="auto" />
      
      <Header 
        roomId={roomId} 
        userCount={room.users.length} 
        onBack={handleBack}
        onShare={handleShare}
      />

      {/* LOBBY VIEW */}
      {room.gameState === 'LOBBY' && (
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Host Controls */}
          {currentUser?.isHost && (
            <div className="glass p-5 sm:p-6 rounded-2xl space-y-6 animate-slide-up">
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <ListMusic className="w-5 h-5 text-green-400" />
                  Musikquelle
                </h3>
                
                <PlaylistSearch
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  searchResults={searchResults}
                  isSearching={isSearching}
                  onSearch={handleSearch}
                  onSelect={handlePlaylistSelect}
                  playlistLink={playlistLink}
                  setPlaylistLink={setPlaylistLink}
                  onLoadLink={handleLoadLink}
                />
              </div>

              <GameSettingsPanel 
                settings={settings}
                showRoles={room.showRoles}
                playerCount={room.users.length}
                onUpdateSettings={handleUpdateSettings}
                onToggleRoles={toggleShowRoles}
              />

              {/* Saved Playlists / Favorites */}
              <div className="pt-4 border-t border-slate-700/50">
                <SavedPlaylists onSelect={handlePlaylistSelect} />
              </div>

              {/* Nearby Discovery Toggle */}
              <div className="pt-4 border-t border-slate-700/50">
                <button
                  onClick={toggleNearbyDiscovery}
                  className={`w-full py-3 px-4 rounded-xl flex items-center justify-between transition-all btn-press ${
                    isNearbyEnabled 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Wifi className="w-5 h-5" />
                    <span className="font-medium">In der Nähe sichtbar</span>
                  </div>
                  <span className="text-xs opacity-70">
                    {isNearbyEnabled ? 'Aktiv' : 'Aus'}
                  </span>
                </button>
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Andere Spieler können deine Lobby finden
                </p>
              </div>
            </div>
          )}

          {/* Selected Playlist Info */}
          {room.playlistName && (
            <div className="bg-purple-900/30 border border-purple-500/30 p-4 rounded-2xl text-center animate-slide-up stagger-1">
              <p className="text-slate-400 text-sm">Ausgewählte Playlist</p>
              <p className="text-xl font-bold text-purple-300 mt-1">{room.playlistName}</p>
              {room.trackCount && (
                <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1">
                  <Music className="w-3 h-3" />
                  {room.trackCount} spielbare Songs
                </p>
              )}
            </div>
          )}

          {/* Game Settings Info (for non-hosts) */}
          {!currentUser?.isHost && (
            <div className="glass p-4 rounded-2xl flex items-center justify-around text-center animate-slide-up">
              <div>
                <p className="text-xs text-slate-400">Imposter</p>
                <p className="text-lg font-bold text-red-400">{settings.imposterCount}</p>
              </div>
              <div className="h-8 w-px bg-slate-700"></div>
              <div>
                <p className="text-xs text-slate-400">Song-Länge</p>
                <p className="text-lg font-bold text-purple-400">{settings.songDuration}s</p>
              </div>
              <div className="h-8 w-px bg-slate-700"></div>
              <div>
                <p className="text-xs text-slate-400">Spieler</p>
                <p className="text-lg font-bold text-white">{room.users.length}</p>
              </div>
            </div>
          )}

          {/* Players Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {room.users.map((user, index) => (
              <PlayerCardWithKick
                key={user.id}
                user={user}
                isCurrentUser={user.id === currentUser?.id}
                isHost={currentUser?.isHost}
                canKick={currentUser?.isHost && user.id !== currentUser?.id}
                onKick={handleKickPlayer}
                index={index}
              />
            ))}
          </div>
          
          {/* Start Button */}
          {currentUser?.isHost ? (
            <button 
              onClick={startGame}
              className="w-full py-5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-2xl font-bold text-xl shadow-lg transition-all btn-press flex items-center justify-center gap-3 animate-slide-up stagger-2"
            >
              <Play className="w-6 h-6" /> 
              Spiel starten
            </button>
          ) : (
            <div className="text-center text-slate-400 py-4 flex items-center justify-center gap-2">
              <LoadingSpinner size="sm" variant="dots" />
              <span>Warte auf Host...</span>
            </div>
          )}
        </div>
      )}

      {/* PLAYING VIEW */}
      {room.gameState === 'PLAYING' && gameData && (
        <div className="max-w-2xl mx-auto text-center space-y-8 pt-6 animate-slide-up">
          <MusicWave isPlaying={true} color="gradient" size="xl" className="mx-auto" />
          
          <div>
            <h2 className="text-3xl font-black mb-2">Hör gut zu! 🎧</h2>
            <p className="text-slate-400">
              {gameData.imposterCount > 1 
                ? `${gameData.imposterCount} Imposter hören einen anderen Song!` 
                : 'Hören alle denselben Song?'}
            </p>
          </div>

          <CountdownTimer 
            duration={gameData.duration} 
            timeLeft={timeLeft} 
            size={160}
            strokeWidth={10}
          />

          <div className="p-6 glass rounded-2xl">
            <p className="text-sm text-slate-400 uppercase tracking-wider mb-3">Aktueller Song</p>
            {room.showRoles ? (
              <div className="space-y-2">
                <p className={`text-2xl font-black ${gameData.role === 'IMPOSTER' ? 'text-red-500' : 'text-green-500'}`}>
                  {gameData.role === 'IMPOSTER' ? '🕵️ DU BIST IMPOSTER' : '✓ DU BIST NORMAL'}
                </p>
                <p className="text-lg text-white">{gameData.song.title}</p>
                <p className="text-slate-400">{gameData.song.artist}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xl font-bold text-white">Musik spielt...</p>
                <p className="text-sm text-slate-400">Tanz zum Beat! 💃🕺</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VOTING VIEW */}
      {room.gameState === 'VOTING' && (
        <div className="max-w-4xl mx-auto animate-slide-up">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-black mb-2">
              {gameData?.imposterCount > 1 ? 'Wer sind die Imposter?' : 'Wer ist der Imposter?'} 🤔
            </h2>
            <div className="flex items-center justify-center gap-4">
              <p className="text-slate-400">
                Stimmen: <span className="text-purple-400 font-bold">{voteCount}</span> / {room.users.length}
              </p>
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full">
                <span className="text-sm text-slate-400">Zeit:</span>
                <span className={`font-mono font-bold ${votingTimeLeft <= 10 ? 'text-red-400' : 'text-white'}`}>
                  {votingTimeLeft}s
                </span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {room.users.map((user, index) => (
              <PlayerCard
                key={user.id}
                user={user}
                isCurrentUser={user.id === currentUser?.id}
                showVoteButton={true}
                hasVoted={hasVoted}
                votedFor={votedForId === user.id}
                onVote={submitVote}
                index={index}
              />
            ))}
          </div>

          {hasVoted && (
            <div className="text-center mt-6 py-3 px-4 bg-green-500/20 border border-green-500/30 rounded-2xl flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-medium">Stimme abgegeben!</span>
            </div>
          )}
        </div>
      )}

      {/* RESULTS VIEW */}
      {room.gameState === 'RESULTS' && gameData?.results && (
        <ResultsView results={gameData.results} currentUserId={currentUser?.id} />
      )}

      {/* PRO BADGE */}
      {isPro && (
        <div className="fixed bottom-4 right-4 z-40 px-3 py-1.5 glass rounded-full border border-yellow-500/30 flex items-center gap-2">
          <Gem className="w-4 h-4 text-yellow-400" />
          <span className="text-xs font-bold text-yellow-400">PRO</span>
        </div>
      )}
    </main>
  );
}

export default function Lobby() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <LoadingSpinner size="lg" variant="music" text="Laden..." />
      </div>
    }>
      <LobbyContent />
    </Suspense>
  );
}
