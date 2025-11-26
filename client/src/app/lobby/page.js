'use client';
import { useEffect, useState, useRef, Suspense } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useSearchParams, useRouter } from 'next/navigation';
import { Play, User, Music, AlertTriangle, Crown, CheckCircle, ListMusic } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

function LobbyContent() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get('id');
  const socket = useSocket();
  const router = useRouter();
  const [room, setRoom] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [voteCount, setVoteCount] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const audioRef = useRef(null);

  // Spotify State
  const [spotifyToken, setSpotifyToken] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);

  // Handle Deep Links (Capacitor)
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      App.addListener('appUrlOpen', (data) => {
        console.log('App opened with URL:', data.url);
        if (data.url.includes('spotify-callback')) {
          // Extract hash parameters
          const hash = data.url.split('#')[1];
          if (hash) {
            const params = new URLSearchParams(hash);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            const error = params.get('error');

            if (accessToken) {
              console.log('Got Spotify Token from Deep Link');
              localStorage.setItem('spotify_access_token', accessToken);
              if (refreshToken) localStorage.setItem('spotify_refresh_token', refreshToken);
              setSpotifyToken(accessToken);
            } else if (error) {
              console.error('Spotify Auth Error from Deep Link:', error);
              alert('Spotify Login Failed: ' + error);
            }
          }
        }
      });
    }
  }, []);

  useEffect(() => {
    if (!roomId) {
        router.push('/');
        return;
    }

    if (!socket) {
      console.log('Socket not initialized yet');
      return;
    }

    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('spotify_access_token');
    setSpotifyToken(token);

    console.log('Lobby: Joining room', roomId, 'as', username, userId);

    if (!userId || !username) {
      console.log('Missing user data, redirecting to home');
      router.push('/');
      return;
    }

    // Re-join if refreshed
    socket.emit('join_room', { roomId, username, userId });

    socket.on('joined_room', ({ room, userId: newUserId }) => {
      console.log('Joined room successfully', room);
      setRoom(room);
      setCurrentUser(room.users.find(u => u.id === (userId || newUserId)));
    });

    socket.on('user_joined', ({ room }) => {
      console.log('User joined event received', room);
      setRoom(room);
    });

    socket.on('playlist_updated', ({ playlistName, trackCount }) => {
      setRoom(prev => ({ ...prev, playlistName, trackCount }));
    });

    socket.on('game_started', (data) => {
      setGameData(data);
      setRoom(prev => ({ ...prev, gameState: 'PLAYING' }));
      setTimeLeft(data.duration);
      
      // Play music
      if (audioRef.current) {
        audioRef.current.src = data.song.url;
        audioRef.current.play().catch(e => console.error("Audio play failed", e));
      }
    });

    socket.on('voting_started', () => {
      setRoom(prev => ({ ...prev, gameState: 'VOTING' }));
      setVoteCount(0);
      setHasVoted(false);
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
    });

    socket.on('return_to_lobby', ({ room }) => {
      setRoom(room);
      setGameData(null);
    });

    socket.on('error', ({ message }) => {
      if (message === 'Room not found') {
        alert('Room not found or expired.');
        router.push('/');
      } else {
        alert(message);
      }
    });

    return () => {
      socket.off('joined_room');
      socket.off('user_joined');
      socket.off('playlist_updated');
      socket.off('game_started');
      socket.off('voting_started');
      socket.off('vote_update');
      socket.off('game_over');
      socket.off('return_to_lobby');
      socket.off('error');
    };
  }, [socket, roomId, router]);

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && room?.gameState === 'PLAYING') {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, room?.gameState]);

  // Fetch Playlists if Host and Token exists
  useEffect(() => {
    if (currentUser?.isHost && spotifyToken && playlists.length === 0) {
      setLoadingPlaylists(true);
      fetch('https://api.spotify.com/v1/me/playlists?limit=20', {
        headers: { 'Authorization': `Bearer ${spotifyToken}` }
      })
      .then(res => {
        if (res.status === 401) {
          console.error("Spotify Token Expired or Invalid");
          localStorage.removeItem('spotify_access_token');
          setSpotifyToken(null);
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data && data.items) {
          setPlaylists(data.items);
        }
      })
      .catch(err => console.error('Failed to fetch playlists', err))
      .finally(() => setLoadingPlaylists(false));
    }
  }, [currentUser, spotifyToken, playlists.length]);

  const handlePlaylistSelect = (playlistId, playlistName) => {
    setSelectedPlaylist(playlistId);
    socket.emit('select_playlist', { 
      roomId, 
      playlistId, 
      accessToken: spotifyToken,
      playlistName 
    });
  };

  const startGame = () => {
    if (!room.playlistName && !room.availableTracks) {
      // Optional: Warn if no playlist selected (will use fallback)
      if (!confirm("No Spotify playlist selected. Use default songs?")) return;
    }
    socket.emit('start_game', { roomId });
  };

  const submitVote = (suspectId) => {
    if (hasVoted) return;
    const userId = localStorage.getItem('userId');
    socket.emit('vote', { roomId, voterId: userId, suspectId });
    setHasVoted(true);
  };

  if (!room) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

  return (
    <main className="min-h-[100dvh] bg-slate-900 text-white p-4 overflow-x-hidden">
      <audio ref={audioRef} className="hidden" />
      
      {/* Header */}
      <header className="flex justify-between items-center mb-8 p-4 bg-slate-800 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="bg-purple-600 p-2 rounded-lg">
            <Music className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold">Room: {roomId}</h1>
        </div>
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-slate-400" />
          <span>{room.users.length} Players</span>
        </div>
      </header>

      {/* LOBBY VIEW */}
      {room.gameState === 'LOBBY' && (
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Host Controls: Spotify */}
          {currentUser?.isHost && (
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <ListMusic className="w-5 h-5 text-green-400" />
                Music Source
              </h3>
              
              {!spotifyToken ? (
                <a 
                  href={`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001'}/login${Capacitor.isNativePlatform() ? '?return_to=musicimposter://spotify-callback' : ''}`}
                  className="inline-flex items-center px-4 py-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold rounded-full transition-colors"
                >
                  Connect Spotify
                </a>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-green-400">✓ Spotify Connected</p>
                    <button 
                      onClick={() => {
                        localStorage.removeItem('spotify_access_token');
                        setSpotifyToken(null);
                      }}
                      className="text-xs text-red-400 hover:text-red-300 underline"
                    >
                      Disconnect
                    </button>
                  </div>
                  {loadingPlaylists ? (
                    <p className="text-slate-400">Loading playlists...</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-2">
                      {playlists.map(pl => (
                        <button
                          key={pl.id}
                          onClick={() => handlePlaylistSelect(pl.id, pl.name)}
                          className={`p-3 rounded-lg text-left text-sm transition-all flex items-center gap-3 ${
                            selectedPlaylist === pl.id 
                              ? 'bg-purple-600 text-white ring-2 ring-purple-400' 
                              : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                          }`}
                        >
                          {pl.images?.[0]?.url && (
                            <img src={pl.images[0].url} className="w-8 h-8 rounded" alt="" />
                          )}
                          <span className="truncate">{pl.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Selected Playlist Info (Visible to all) */}
          {room.playlistName && (
            <div className="bg-purple-900/30 border border-purple-500/30 p-4 rounded-xl text-center">
              <p className="text-slate-300 text-sm">Selected Playlist</p>
              <p className="text-xl font-bold text-purple-300">{room.playlistName}</p>
              {room.trackCount && <p className="text-xs text-slate-400">{room.trackCount} playable tracks</p>}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {room.users.map(user => (
              <div key={user.id} className="bg-slate-800 p-4 rounded-xl flex items-center gap-3 border border-slate-700">
                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full bg-slate-700" />
                <div>
                  <p className="font-bold">{user.name}</p>
                  {user.isHost && <span className="text-xs text-yellow-400 flex items-center gap-1"><Crown className="w-3 h-3" /> Host</span>}
                </div>
              </div>
            ))}
          </div>
          
          {currentUser?.isHost ? (
            <button 
              onClick={startGame}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-bold text-xl shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
            >
              <Play className="w-6 h-6" /> Start Game
            </button>
          ) : (
            <div className="text-center text-slate-400 animate-pulse">
              Waiting for host to start...
            </div>
          )}
        </div>
      )}

      {/* PLAYING VIEW */}
      {room.gameState === 'PLAYING' && gameData && (
        <div className="max-w-2xl mx-auto text-center space-y-8 pt-10">
          <div className="animate-bounce">
            <Music className="w-24 h-24 mx-auto text-purple-400" />
          </div>
          
          <div>
            <h2 className="text-3xl font-bold mb-2">Listen Carefully!</h2>
            <p className="text-slate-400">Is everyone hearing the same song?</p>
          </div>

          <div className="text-6xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            {timeLeft}s
          </div>

          <div className="p-6 bg-slate-800 rounded-xl border border-slate-700">
            <p className="text-sm text-slate-400 uppercase tracking-wider mb-2">Now Playing</p>
            <div className="flex flex-col items-center gap-2">
               {/* Hidden Role - Just showing music info if available, or generic text */}
               <p className="text-xl font-bold text-white">Music is playing...</p>
               <p className="text-sm text-slate-400">Dance to the beat!</p>
            </div>
          </div>
        </div>
      )}

      {/* VOTING VIEW */}
      {room.gameState === 'VOTING' && (
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2">Who is the Imposter?</h2>
          <p className="text-center text-slate-400 mb-8">Votes: {voteCount} / {room.users.length}</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {room.users.map(user => (
              <button
                key={user.id}
                onClick={() => submitVote(user.id)}
                disabled={hasVoted || user.id === currentUser.id} 
                className={`p-6 rounded-xl border-2 transition-all ${
                  user.id === currentUser.id 
                    ? 'border-slate-700 bg-slate-800/50 opacity-50 cursor-not-allowed'
                    : hasVoted 
                      ? 'border-slate-700 bg-slate-800 opacity-50 cursor-not-allowed'
                      : 'border-slate-600 bg-slate-800 hover:border-purple-500 hover:bg-slate-700'
                }`}
              >
                <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full mx-auto mb-3 bg-slate-700" />
                <p className="font-bold text-lg">{user.name}</p>
              </button>
            ))}
          </div>
          {hasVoted && (
            <p className="text-center mt-4 text-green-400 animate-pulse">Vote submitted! Waiting for others...</p>
          )}
        </div>
      )}

      {/* RESULTS VIEW */}
      {room.gameState === 'RESULTS' && gameData?.results && (
        <div className="max-w-2xl mx-auto text-center space-y-8 pt-10">
          <div className="mb-8">
            {gameData.results.imposterCaught ? (
              <div className="text-green-500 flex flex-col items-center gap-4">
                <CheckCircle className="w-20 h-20" />
                <h2 className="text-4xl font-bold">Imposter Caught!</h2>
              </div>
            ) : (
              <div className="text-red-500 flex flex-col items-center gap-4">
                <AlertTriangle className="w-20 h-20" />
                <h2 className="text-4xl font-bold">Imposter Won!</h2>
              </div>
            )}
          </div>

          <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 space-y-6">
            <div>
              <p className="text-slate-400 mb-2">The Imposter was</p>
              <div className="flex items-center justify-center gap-3">
                <img src={gameData.results.imposter.avatar} className="w-12 h-12 rounded-full" />
                <span className="text-2xl font-bold">{gameData.results.imposter.name}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
              <div className="text-left">
                <p className="text-xs text-slate-400 uppercase">Common Song</p>
                <p className="font-bold text-green-400">{gameData.results.songs.common.title}</p>
                <p className="text-sm text-slate-500">{gameData.results.songs.common.artist}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase">Imposter Song</p>
                <p className="font-bold text-red-400">{gameData.results.songs.imposter.title}</p>
                <p className="text-sm text-slate-500">{gameData.results.songs.imposter.artist}</p>
              </div>
            </div>
          </div>

          <p className="text-slate-400 animate-pulse">Returning to lobby...</p>
        </div>
      )}
    </main>
  );
}

export default function Lobby() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading...</div>}>
      <LobbyContent />
    </Suspense>
  );
}
