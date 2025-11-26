'use client';
import { useState, useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useRouter } from 'next/navigation';
import { Music, Users, PlayCircle, HelpCircle, X } from 'lucide-react';

export default function Home() {
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
    if (!username) return alert('Please enter a username');
    const userId = localStorage.getItem('userId') || 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userId', userId);
    
    socket.emit('create_room', { username, userId });
    socket.once('room_created', ({ roomId, userId }) => {
      localStorage.setItem('userId', userId);
      localStorage.setItem('username', username);
      router.push(`/lobby/${roomId}`);
    });
  };

  const joinRoom = () => {
    if (!username || !roomId) return alert('Please enter username and room ID');
    const userId = localStorage.getItem('userId') || 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userId', userId);

    socket.emit('join_room', { roomId, username, userId });
    socket.once('joined_room', ({ roomId, userId }) => {
      localStorage.setItem('userId', userId);
      localStorage.setItem('username', username);
      router.push(`/lobby/${roomId}`);
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
              <p className="font-medium text-white">Willkommen bei Music Imposter!</p>
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
            Music Imposter
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
