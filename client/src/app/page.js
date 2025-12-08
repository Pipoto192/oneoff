'use client';
import { useState, useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useRouter } from 'next/navigation';
import { Music, Users, PlayCircle, HelpCircle, X, Download, ExternalLink } from 'lucide-react';

function GameEntry() {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);
  const socket = useSocket();
  const router = useRouter();

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, []);

  const closeTutorial = () => {
    localStorage.setItem('hasSeenTutorial', 'true');
    setShowTutorial(false);
  };

  const createRoom = () => {
    if (!username) return alert('Bitte gib einen Benutzernamen ein');
    const userId = localStorage.getItem('userId') || 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userId', userId);

    socket.emit('create_room', { username, userId });
    socket.once('room_created', ({ roomId, userId }) => {
      localStorage.setItem('userId', userId);
      localStorage.setItem('username', username);
      router.push(`/lobby?id=${roomId}`);
    });
  };

  const joinRoom = () => {
    if (!username || !roomId) return alert('Bitte gib Benutzername und Raum-ID ein');
    const userId = localStorage.getItem('userId') || 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userId', userId);

    socket.emit('join_room', { roomId, username, userId });
    socket.once('joined_room', ({ roomId, userId }) => {
      localStorage.setItem('userId', userId);
      localStorage.setItem('username', username);
      router.push(`/lobby?id=${roomId}`);
    });
    socket.once('error', ({ message }) => {
      alert(message);
    });
  };

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-x-hidden">
      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-800 border border-purple-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Music className="w-6 h-6 text-purple-400" />
                Spielanleitung
              </h2>
              <button onClick={closeTutorial} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 text-slate-300 text-sm">
              <p className="font-medium text-white">Willkommen bei OneOff!</p>
              <ul className="space-y-2 list-disc pl-4">
                <li>Erstelle eine Lobby oder tritt einer bei.</li>
                <li>Alle hören die <span className="text-purple-400 font-bold">gleiche Musik</span>.</li>
                <li>Außer einer: Der <span className="text-pink-500 font-bold">Imposter</span> hört einen anderen Song!</li>
                <li>Tanzt oder nickt zum Takt.</li>
                <li>Votet den Imposter raus, der nicht im Takt ist!</li>
              </ul>
            </div>

            <button
              onClick={closeTutorial}
              className="mt-6 w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all"
            >
              Verstanden, los geht's!
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-md p-6 sm:p-8 space-y-8 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 relative">
        <button
          onClick={() => setShowTutorial(true)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          title="Anleitung anzeigen"
        >
          <HelpCircle className="w-6 h-6" />
        </button>

        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-purple-600 rounded-full shadow-lg shadow-purple-500/50">
              <Music className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            OneOff
          </h1>
          <p className="text-slate-300 text-sm sm:text-base">Finde heraus, wer den falschen Beat hört!</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Dein Name</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white placeholder-slate-500 transition-all"
              placeholder="Name eingeben"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 pt-4">
            <button
              onClick={createRoom}
              className="group relative w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all transform hover:scale-[1.02] shadow-lg active:scale-95"
            >
              <PlayCircle className="w-5 h-5 mr-2" />
              Lobby erstellen
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-600"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">ODER</span>
              <div className="flex-grow border-t border-slate-600"></div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                className="flex-1 min-w-0 px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-white placeholder-slate-500 uppercase tracking-widest text-center font-mono"
                placeholder="CODE"
                maxLength={5}
              />
              <button
                onClick={joinRoom}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all shadow-lg flex items-center whitespace-nowrap active:scale-95"
              >
                <Users className="w-5 h-5 mr-2" />
                Beitreten
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function BetaLanding() {
  const googleGroupLink = "https://groups.google.com/g/oneoff-tester"; 
  const androidLink = "https://play.google.com/store/apps/details?id=com.musicimposter.app"; 

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-600/20 rounded-full blur-[100px]"></div>
      </div>

      <div className="max-w-md w-full bg-slate-800/80 backdrop-blur-xl p-8 rounded-2xl border border-slate-700 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center">
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-4 rounded-full shadow-lg shadow-purple-500/30">
            <Users className="w-10 h-10 text-white" />
          </div>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Werde Beta-Tester
          </h1>
          <p className="text-slate-300 text-sm">
            Teste die neuesten Features von <strong>OneOff</strong> vor allen anderen und hilf uns, das Spiel besser zu machen!
          </p>
        </div>

        <div className="space-y-4 pt-2">
          {/* Step 1 */}
          <div className="bg-slate-700/50 p-4 rounded-xl text-left space-y-3 border border-slate-600/50 hover:border-purple-500/50 transition-colors">
            <div className="flex items-center gap-3">
              <span className="bg-slate-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <h3 className="font-bold text-white">Gruppe beitreten</h3>
            </div>
            <p className="text-xs text-slate-400 pl-9">
              Tritt der Google Group bei, um für den Test freigeschaltet zu werden.
            </p>
            <a 
              href={googleGroupLink}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-9 block py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-all text-center shadow-lg hover:shadow-blue-500/25"
            >
              Google Group beitreten
            </a>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-700/50 p-4 rounded-xl text-left space-y-3 border border-slate-600/50 hover:border-pink-500/50 transition-colors">
            <div className="flex items-center gap-3">
              <span className="bg-slate-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <h3 className="font-bold text-white">App herunterladen</h3>
            </div>
            <p className="text-xs text-slate-400 pl-9">
              Lade die App aus dem Play Store herunter und starte das Spiel!
            </p>
            <a 
              href={androidLink}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-9 block py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-lg transition-all text-center shadow-lg hover:shadow-green-500/25"
            >
              Im Play Store laden
            </a>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-500">
            Danke für deine Unterstützung! ❤️
          </p>
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    // Check if running in development mode
    if (process.env.NODE_ENV === 'development') {
      setIsDev(true);
    }
  }, []);

  if (isDev) {
    return <GameEntry />;
  }

  return <BetaLanding />;
}
