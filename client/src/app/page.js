'use client';
import { useState, useEffect, useCallback, memo } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useRouter } from 'next/navigation';
import { Music, Users, PlayCircle, HelpCircle, X, Gem, Sparkles, Volume2, Wifi, Loader2, User, Trophy } from 'lucide-react';
import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/components/Toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import InteractiveTutorial from '@/components/InteractiveTutorial';
import ProfileModal from '@/components/ProfileModal';
import LeaderboardModal from '@/components/LeaderboardModal';
import useHaptics from '@/hooks/useHaptics';

// Helper function for server URL
const getServerUrl = () => {
  if (!Capacitor.isNativePlatform() && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3001';
  }
  return process.env.NEXT_PUBLIC_SERVER_URL || 'https://prominent-hookworm-dailyvibes-2b2f2caa.koyeb.app';
};

// Memoized Logo Component for performance
const Logo = memo(function Logo() {
  return (
    <div className="relative">
      <div className="p-5 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-lg pulse-glow gpu-accelerate">
        <Music className="w-14 h-14 text-white" />
      </div>
      <div className="absolute -top-2 -right-2">
        <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
      </div>
    </div>
  );
});

// Tutorial Modal Component
const TutorialModal = memo(function TutorialModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md safe-area-top safe-area-bottom">
      <div className="glass rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-slide-up gpu-accelerate border border-purple-500/20">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Volume2 className="w-6 h-6 text-purple-400" />
            Spielanleitung
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-2 hover:bg-slate-700 rounded-full transition-all btn-press"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-slate-300 text-sm">
          <p className="font-semibold text-white text-base">Willkommen bei OneOff! 🎵</p>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-xs font-bold flex-shrink-0">1</span>
              <p>Erstelle eine Lobby oder tritt einer bei</p>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-xs font-bold flex-shrink-0">2</span>
              <p>Alle hören die <span className="text-purple-400 font-bold">gleiche Musik</span></p>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-pink-600 text-xs font-bold flex-shrink-0">3</span>
              <p>Außer einer: Der <span className="text-pink-400 font-bold">Imposter</span> hört einen anderen Song!</p>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-xs font-bold flex-shrink-0">4</span>
              <p>Votet den Imposter raus, der nicht im Takt ist! 🕺</p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-2xl transition-all shadow-lg btn-press"
        >
          Los geht's! 🎮
        </button>
      </div>
    </div>
  );
});

// Pro Redeem Modal Component
const ProRedeemModal = memo(function ProRedeemModal({ isOpen, onClose, onSuccess }) {
  const [redeemCode, setRedeemCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const { success, error } = useHaptics();

  const handleRedeem = async () => {
    if (!redeemCode) return;
    setIsLoading(true);

    try {
      let uuid = null;
      if (Capacitor.isNativePlatform()) {
        const info = await Device.getId();
        uuid = info.uuid;
      } else {
        uuid = localStorage.getItem('device_uuid');
      }

      let serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://prominent-hookworm-dailyvibes-2b2f2caa.koyeb.app';
      if (!Capacitor.isNativePlatform() && window.location.hostname === 'localhost') {
        serverUrl = 'http://localhost:3001';
      }

      const res = await fetch(`${serverUrl}/api/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: redeemCode, deviceId: uuid })
      });
      const data = await res.json();
      
      if (data.success) {
        success();
        showToast('Pro erfolgreich aktiviert! 🎉', 'success');
        onSuccess();
        onClose();
      } else {
        error();
        showToast(data.message || 'Fehler beim Einlösen', 'error');
      }
    } catch (e) {
      error();
      showToast('Verbindungsfehler', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md safe-area-top safe-area-bottom">
      <div className="glass rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-slide-up gpu-accelerate border border-yellow-500/20">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Gem className="w-6 h-6 text-yellow-400" />
            Pro aktivieren
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-2 hover:bg-slate-700 rounded-full transition-all btn-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-slate-300 text-sm">
            Gib deinen Code ein, um die Pro-Version freizuschalten und Werbung zu entfernen.
          </p>
          
          <input
            type="text"
            value={redeemCode}
            onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
            placeholder="CODE EINGEBEN"
            className="w-full px-4 py-4 bg-slate-900 border border-slate-600 rounded-2xl focus:ring-2 focus:ring-yellow-500 outline-none text-white text-center font-mono uppercase text-lg tracking-widest transition-all"
            maxLength={20}
          />
          
          <button
            onClick={handleRedeem}
            disabled={isLoading || !redeemCode}
            className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold rounded-2xl transition-all shadow-lg btn-press disabled:opacity-50"
          >
            {isLoading ? <LoadingSpinner size="sm" variant="dots" /> : 'Einlösen'}
          </button>
        </div>
      </div>
    </div>
  );
});

function GameEntry() {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);
  const [showInteractiveTutorial, setShowInteractiveTutorial] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const socket = useSocket();
  const router = useRouter();
  const { showToast } = useToast();
  const { lightImpact, success, error } = useHaptics();

  // Pro State
  const [isPro, setIsPro] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);

  // Nearby Lobbies State
  const [nearbyLobbies, setNearbyLobbies] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      // Show interactive tutorial for first time users
      setShowInteractiveTutorial(true);
    }

    // Restore saved username
    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
      setUsername(savedUsername);
    }

    // Scan for nearby lobbies
    const scanNearbyLobbies = () => {
      if (!socket) return;
      setIsScanning(true);
      socket.emit('get_nearby_lobbies', {});
      socket.once('nearby_lobbies', ({ lobbies }) => {
        setNearbyLobbies(lobbies || []);
        setIsScanning(false);
      });
      // Timeout fallback
      setTimeout(() => setIsScanning(false), 5000);
    };

    // Check Pro Status
    const checkProStatus = async () => {
      try {
        let uuid = null;
        if (Capacitor.isNativePlatform()) {
          const info = await Device.getId();
          uuid = info.uuid;
        } else {
          uuid = localStorage.getItem('device_uuid');
          if (!uuid) {
            uuid = 'web_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('device_uuid', uuid);
          }
        }
        
        if (!uuid) return;
        setDeviceId(uuid); // Store deviceId for profile

        let serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://prominent-hookworm-dailyvibes-2b2f2caa.koyeb.app';
        if (!Capacitor.isNativePlatform() && window.location.hostname === 'localhost') {
          serverUrl = 'http://localhost:3001';
        }

        const res = await fetch(`${serverUrl}/api/status?deviceId=${uuid}`);
        if (!res.ok) return;

        const data = await res.json();
        if (data.isPro) {
          setIsPro(true);
        }
      } catch (e) {
        console.error("Failed to check pro status:", e);
      }
    };
    checkProStatus();

    // Start scanning for nearby lobbies
    if (socket) {
      scanNearbyLobbies();
      // Refresh every 10 seconds
      const interval = setInterval(scanNearbyLobbies, 10000);
      return () => clearInterval(interval);
    }
  }, [socket]);

  const closeTutorial = useCallback(() => {
    localStorage.setItem('hasSeenTutorial', 'true');
    setShowTutorial(false);
    setShowInteractiveTutorial(false);
    lightImpact();
  }, [lightImpact]);

  // Helper to get deviceId synchronously from storage
  const getDeviceIdSync = useCallback(() => {
    if (deviceId) return deviceId;
    // Fallback to localStorage
    let uuid = localStorage.getItem('device_uuid');
    if (!uuid) {
      uuid = 'web_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('device_uuid', uuid);
    }
    return uuid;
  }, [deviceId]);

  const createRoom = useCallback(async () => {
    if (!username.trim()) {
      error();
      showToast('Bitte gib einen Benutzernamen ein', 'error');
      return;
    }
    
    if (!socket) {
      showToast('Verbindung wird aufgebaut...', 'info');
      return;
    }

    setIsCreating(true);
    lightImpact();
    
    // Get deviceId - try native first, then storage
    let currentDeviceId = deviceId;
    if (!currentDeviceId) {
      if (Capacitor.isNativePlatform()) {
        try {
          const info = await Device.getId();
          currentDeviceId = info.uuid;
        } catch (e) {
          console.error('Failed to get device ID:', e);
        }
      }
      if (!currentDeviceId) {
        currentDeviceId = getDeviceIdSync();
      }
    }
    
    const userId = localStorage.getItem('userId') || 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userId', userId);
    localStorage.setItem('username', username.trim());

    console.log('[CREATE_ROOM] Sending with deviceId:', currentDeviceId);
    socket.emit('create_room', { username: username.trim(), userId, deviceId: currentDeviceId });
    socket.once('room_created', ({ roomId, userId }) => {
      localStorage.setItem('userId', userId);
      success();
      router.push(`/lobby?id=${roomId}`);
    });

    // Timeout fallback
    setTimeout(() => setIsCreating(false), 5000);
  }, [username, socket, router, showToast, lightImpact, success, error, deviceId, getDeviceIdSync]);

  const joinRoom = useCallback(async () => {
    if (!username.trim() || !roomId.trim()) {
      error();
      showToast('Bitte gib Benutzername und Raum-ID ein', 'error');
      return;
    }

    if (!socket) {
      showToast('Verbindung wird aufgebaut...', 'info');
      return;
    }

    setIsJoining(true);
    lightImpact();

    // Get deviceId - try native first, then storage
    let currentDeviceId = deviceId;
    if (!currentDeviceId) {
      if (Capacitor.isNativePlatform()) {
        try {
          const info = await Device.getId();
          currentDeviceId = info.uuid;
        } catch (e) {
          console.error('Failed to get device ID:', e);
        }
      }
      if (!currentDeviceId) {
        currentDeviceId = getDeviceIdSync();
      }
    }

    const userId = localStorage.getItem('userId') || 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userId', userId);
    localStorage.setItem('username', username.trim());

    console.log('[JOIN_ROOM] Sending with deviceId:', currentDeviceId);
    socket.emit('join_room', { roomId: roomId.trim().toUpperCase(), username: username.trim(), userId, deviceId: currentDeviceId });
    
    socket.once('joined_room', ({ roomId, userId }) => {
      localStorage.setItem('userId', userId);
      success();
      router.push(`/lobby?id=${roomId}`);
    });
    
    socket.once('error', ({ message }) => {
      error();
      showToast(message, 'error');
      setIsJoining(false);
    });

    // Timeout fallback
    setTimeout(() => setIsJoining(false), 5000);
  }, [username, roomId, socket, router, showToast, lightImpact, success, error, deviceId, getDeviceIdSync]);

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 overflow-hidden safe-area-top safe-area-bottom">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-pink-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Tutorial Modal */}
      <TutorialModal isOpen={showTutorial} onClose={closeTutorial} />

      {/* Interactive Tutorial for new users */}
      <InteractiveTutorial 
        isOpen={showInteractiveTutorial} 
        onClose={closeTutorial} 
      />

      {/* Pro Redeem Modal */}
      <ProRedeemModal 
        isOpen={showRedeemModal} 
        onClose={() => setShowRedeemModal(false)}
        onSuccess={() => setIsPro(true)}
      />

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        deviceId={deviceId}
        serverUrl={getServerUrl()}
      />

      {/* Leaderboard Modal */}
      <LeaderboardModal 
        isOpen={showLeaderboardModal}
        onClose={() => setShowLeaderboardModal(false)}
        serverUrl={getServerUrl()}
        currentDeviceId={deviceId}
      />

      {/* PRO BUTTON */}
      {!isPro && (
        <button
          onClick={() => {
            lightImpact();
            setShowRedeemModal(true);
          }}
          className="fixed top-4 right-4 z-40 p-3 glass rounded-full shadow-lg hover:bg-slate-700/50 transition-all btn-press group border border-yellow-500/30"
          aria-label="Pro aktivieren"
        >
          <Gem className="w-5 h-5 text-yellow-400 group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Pro Badge */}
      {isPro && (
        <div className="fixed top-4 right-4 z-40 px-3 py-1.5 glass rounded-full border border-yellow-500/30 flex items-center gap-2">
          <Gem className="w-4 h-4 text-yellow-400" />
          <span className="text-xs font-bold text-yellow-400">PRO</span>
        </div>
      )}

      {/* Profile Button */}
      <button
        onClick={() => {
          lightImpact();
          setShowProfileModal(true);
        }}
        className="fixed top-4 left-4 z-40 p-3 glass rounded-full shadow-lg hover:bg-slate-700/50 transition-all btn-press group border border-blue-500/30"
        aria-label="Profil"
      >
        <User className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
      </button>

      {/* Leaderboard Button */}
      <button
        onClick={() => {
          lightImpact();
          setShowLeaderboardModal(true);
        }}
        className="fixed top-4 left-16 z-40 p-3 glass rounded-full shadow-lg hover:bg-slate-700/50 transition-all btn-press group border border-green-500/30"
        aria-label="Rangliste"
      >
        <Trophy className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" />
      </button>

      <div className="w-full max-w-md p-6 sm:p-8 space-y-8 glass rounded-3xl shadow-2xl border border-white/10 relative animate-slide-up">
        {/* Help Button */}
        <button
          onClick={() => {
            lightImpact();
            setShowTutorial(true);
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 hover:bg-slate-700/50 rounded-full transition-all btn-press"
          aria-label="Anleitung anzeigen"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <Logo />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black gradient-text">
            OneOff
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">Finde heraus, wer den falschen Beat hört!</p>
        </div>

        {/* Form */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Dein Name</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-4 bg-slate-800/50 border border-slate-600 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white placeholder-slate-500 transition-all text-lg"
              placeholder="Name eingeben"
              maxLength={20}
            />
          </div>

          <div className="pt-2 space-y-4">
            <button
              onClick={createRoom}
              disabled={isCreating}
              className="group relative w-full flex items-center justify-center px-4 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold rounded-2xl transition-all shadow-lg btn-press disabled:opacity-70"
            >
              {isCreating ? (
                <LoadingSpinner size="sm" variant="dots" />
              ) : (
                <>
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Lobby erstellen
                </>
              )}
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-600/50"></div>
              <span className="flex-shrink-0 mx-4 text-slate-500 text-sm">ODER</span>
              <div className="flex-grow border-t border-slate-600/50"></div>
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                className="flex-1 min-w-0 px-4 py-4 bg-slate-800/50 border border-slate-600 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none text-white placeholder-slate-500 uppercase tracking-[0.3em] text-center font-mono text-lg"
                placeholder="CODE"
                maxLength={6}
              />
              <button
                onClick={joinRoom}
                disabled={isJoining}
                className="px-6 py-4 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center whitespace-nowrap btn-press disabled:opacity-70"
              >
                {isJoining ? (
                  <LoadingSpinner size="sm" variant="dots" />
                ) : (
                  <>
                    <Users className="w-5 h-5 mr-2" />
                    Join
                  </>
                )}
              </button>
            </div>

            {/* Nearby Lobbies */}
            {nearbyLobbies.length > 0 && (
              <div className="pt-4 space-y-3">
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Wifi className="w-4 h-4 text-purple-400" />
                  <span>Lobbys in der Nähe</span>
                  {isScanning && <Loader2 className="w-3 h-3 animate-spin" />}
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {nearbyLobbies.map(lobby => (
                    <button
                      key={lobby.roomId}
                      onClick={() => {
                        setRoomId(lobby.roomId);
                        lightImpact();
                      }}
                      className="w-full p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl flex items-center justify-between transition-all btn-press border border-slate-700 hover:border-purple-500/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-600/20 rounded-lg">
                          <Wifi className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-white text-sm">{lobby.hostName}'s Lobby</p>
                          <p className="text-xs text-slate-400">{lobby.playerCount} Spieler</p>
                        </div>
                      </div>
                      <span className="text-xs text-purple-400 font-mono">{lobby.roomId}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Version info */}
        <p className="text-center text-slate-600 text-xs pt-2">0.4 gemacht von Anntimo</p>
      </div>
    </main>
  );
}

function HomepageLanding() {
  const androidLink = "https://play.google.com/store/apps/details?id=com.musicimposter.app";
  const discordLink = "https://discord.gg/jp49U6ncFh"; 

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-4 relative overflow-hidden safe-area-top safe-area-bottom">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-pink-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[30%] right-[-5%] w-[30%] h-[30%] bg-blue-600/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-4xl w-full py-12">
        {/* Logo & Title */}
        <div className="text-center space-y-6 mb-12 animate-slide-up">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="p-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl shadow-2xl pulse-glow">
                <Music className="w-16 h-16 text-white" />
              </div>
              <div className="absolute -top-3 -right-3">
                <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
              </div>
            </div>
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-black gradient-text">
            OneOff
          </h1>
          <p className="text-xl sm:text-2xl text-slate-300 max-w-lg mx-auto">
            Das ultimative Musik-Party-Spiel! 🎵
          </p>
          <p className="text-slate-400 text-base sm:text-lg max-w-md mx-auto">
            Finde heraus, wer den falschen Beat hört – wie Among Us, aber mit Musik!
          </p>
        </div>

        {/* How it works */}
        <div className="w-full max-w-2xl mb-12 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-2xl font-bold text-center mb-6 text-white">So funktioniert's</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass p-5 rounded-2xl text-center border border-purple-500/20 hover:border-purple-500/50 transition-all">
              <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-bold text-white mb-2">1. Lobby erstellen</h3>
              <p className="text-sm text-slate-400">Lade Freunde ein und startet eine Runde</p>
            </div>
            <div className="glass p-5 rounded-2xl text-center border border-pink-500/20 hover:border-pink-500/50 transition-all">
              <div className="w-12 h-12 bg-pink-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Music className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="font-bold text-white mb-2">2. Musik hören</h3>
              <p className="text-sm text-slate-400">Alle hören den gleichen Song – außer einer!</p>
            </div>
            <div className="glass p-5 rounded-2xl text-center border border-yellow-500/20 hover:border-yellow-500/50 transition-all">
              <div className="w-12 h-12 bg-yellow-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <HelpCircle className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="font-bold text-white mb-2">3. Imposter finden</h3>
              <p className="text-sm text-slate-400">Votet den Imposter raus, der nicht im Takt ist!</p>
            </div>
          </div>
        </div>

        {/* Download Section */}
        <div className="w-full max-w-md glass p-8 rounded-3xl border border-slate-700 shadow-2xl text-center space-y-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-2xl font-bold text-white">Jetzt spielen!</h2>
          <p className="text-slate-400 text-sm">
            Kostenlos für Android verfügbar
          </p>

          <div className="space-y-4">
            {/* Play Store Button */}
            <a 
              href={androidLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-2xl transition-all shadow-lg btn-press"
            >
              <PlayCircle className="w-6 h-6" />
              <span>Aus dem Play Store laden</span>
            </a>

            {/* Discord Button */}
            <a 
              href={discordLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg btn-press"
            >
              <Users className="w-5 h-5" />
              <span>Discord Community</span>
            </a>
          </div>

          <p className="text-xs text-slate-500 pt-2">
            iOS-Version kommt bald! 🍎
          </p>
        </div>

        {/* Features */}
        <div className="w-full max-w-2xl mt-12 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4">
              <div className="text-3xl mb-2">🎵</div>
              <p className="text-sm text-slate-400">Spotify Playlists</p>
            </div>
            <div className="p-4">
              <div className="text-3xl mb-2">👥</div>
              <p className="text-sm text-slate-400">3-10 Spieler</p>
            </div>
            <div className="p-4">
              <div className="text-3xl mb-2">🏆</div>
              <p className="text-sm text-slate-400">Ranglisten</p>
            </div>
            <div className="p-4">
              <div className="text-3xl mb-2">🎉</div>
              <p className="text-sm text-slate-400">Party-Modus</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-4xl py-6 border-t border-slate-800 text-center">
        <p className="text-sm text-slate-500">
          © 2025 OneOff · Gemacht mit ❤️ von Anntimo
        </p>
      </footer>
    </main>
  );
}

export default function Home() {
  const [showGame, setShowGame] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const isCapacitor = process.env.NEXT_PUBLIC_IS_CAPACITOR === 'true' || Capacitor.isNativePlatform();
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev || isCapacitor) {
      setShowGame(true);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner size="lg" variant="music" text="Laden..." />
      </div>
    );
  }

  return showGame ? <GameEntry /> : <HomepageLanding />;
}
