const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const axios = require('axios');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');

const app = express();
app.use(cors());
app.use(cookieParser());

console.log("Current Working Directory:", process.cwd());
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log(".env file found at:", envPath);
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log("First 50 chars of .env:", envContent.substring(0, 50).replace(/\n/g, ' '));
} else {
  console.error("FATAL: .env file NOT found at:", envPath);
}

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID?.trim();
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET?.trim();
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI?.trim() || 'http://localhost:3001/callback';
const CLIENT_URL = process.env.CLIENT_URL?.trim() || 'http://localhost:3000';

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  console.error("FATAL ERROR: SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET is missing in .env file!");
} else {
  console.log("Spotify Config Loaded:");
  console.log("- Client ID:", SPOTIFY_CLIENT_ID.substring(0, 5) + "...");
  console.log("- Redirect URI:", SPOTIFY_REDIRECT_URI);
}

// Debug Endpoint
app.get('/debug', (req, res) => {
  res.json(rooms);
});

// Spotify Auth Routes
app.get('/login', (req, res) => {
  const state = uuidv4();
  const scope = 'user-read-private user-read-email playlist-read-private playlist-read-collaborative';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: SPOTIFY_CLIENT_ID,
      scope: scope,
      redirect_uri: SPOTIFY_REDIRECT_URI,
      state: state
    }));
});

app.get('/callback', async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;

  if (state === null) {
    res.redirect(CLIENT_URL + '/#' + querystring.stringify({ error: 'state_mismatch' }));
  } else {
    try {
      const response = await axios.post('https://accounts.spotify.com/api/token', 
        querystring.stringify({
          code: code,
          redirect_uri: SPOTIFY_REDIRECT_URI,
          grant_type: 'authorization_code'
        }), {
        headers: {
          'Authorization': 'Basic ' + (Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const access_token = response.data.access_token;
      const refresh_token = response.data.refresh_token;

      res.redirect(CLIENT_URL + '/spotify-callback#' + 
        querystring.stringify({ access_token, refresh_token }));
    } catch (error) {
      console.error('Spotify Auth Error:', error.response?.data || error.message);
      res.redirect(CLIENT_URL + '/#' + querystring.stringify({ error: 'invalid_token' }));
    }
  }
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all for prototype
    methods: ["GET", "POST"]
  }
});

// Game State
const rooms = {};

// Fallback Songs
const FALLBACK_SONGS = [
  { id: 1, title: "Funky Town", artist: "Lipps Inc.", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: 2, title: "Billie Jean", artist: "Michael Jackson", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: 3, title: "Stayin' Alive", artist: "Bee Gees", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { id: 4, title: "Bohemian Rhapsody", artist: "Queen", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
  { id: 5, title: "Sweet Child O' Mine", artist: "Guns N' Roses", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
];

// Helper: Fetch preview from Deezer if Spotify fails
async function getDeezerPreview(artist, title) {
  try {
    console.log(`[DEEZER] Searching preview for: ${artist} - ${title}`);
    const query = `artist:"${artist}" track:"${title}"`;
    const url = `https://api.deezer.com/search?limit=1&q=${encodeURIComponent(query)}`;
    const response = await axios.get(url);
    if (response.data && response.data.data && response.data.data.length > 0) {
      const preview = response.data.data[0].preview;
      console.log(`[DEEZER] Found preview: ${preview}`);
      return preview;
    }
  } catch (error) {
    console.error(`[DEEZER] Failed to find preview for ${artist} - ${title}`);
  }
  return null;
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Create Room
  socket.on('create_room', ({ username, userId }) => {
    const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
    const finalUserId = userId || uuidv4();
    
    console.log(`[CREATE] Room ${roomId} created by ${username} (${finalUserId})`);

    rooms[roomId] = {
      id: roomId,
      users: [{
        id: finalUserId,
        name: username,
        socketId: socket.id,
        isHost: true,
        score: 0,
        connected: true,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
      }],
      gameState: 'LOBBY',
      imposterId: null,
      currentSongs: null,
      availableTracks: null, // Will be populated from Spotify
      playlistName: null
    };

    socket.join(roomId);
    socket.emit('room_created', { roomId, userId: finalUserId, room: rooms[roomId] });
  });

  // Join Room
  socket.on('join_room', ({ roomId, username, userId }) => {
    const safeRoomId = roomId ? roomId.toUpperCase() : '';
    console.log(`[JOIN] Request for room ${safeRoomId} by ${username} (${userId})`);

    if (!rooms[safeRoomId]) {
      console.log(`[JOIN] Room ${safeRoomId} not found`);
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    // Check if user is already in the room (reconnect)
    const existingUser = rooms[safeRoomId].users.find(u => u.id === userId);
    if (existingUser) {
        console.log(`[JOIN] User ${username} re-connecting to ${safeRoomId}`);
        existingUser.socketId = socket.id;
        existingUser.name = username; 
        existingUser.connected = true;
        socket.join(safeRoomId);
        socket.emit('joined_room', { roomId: safeRoomId, userId, room: rooms[safeRoomId] });
        io.to(safeRoomId).emit('user_joined', { room: rooms[safeRoomId] }); 
        return;
    }

    if (rooms[safeRoomId].gameState !== 'LOBBY') {
      socket.emit('error', { message: 'Game already in progress' });
      return;
    }

    const finalUserId = userId || uuidv4();
    console.log(`[JOIN] New user ${username} joining ${safeRoomId}`);
    
    const newUser = {
      id: finalUserId,
      name: username,
      socketId: socket.id,
      isHost: false,
      score: 0,
      connected: true,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
    };

    rooms[safeRoomId].users.push(newUser);
    socket.join(safeRoomId);
    
    socket.emit('joined_room', { roomId: safeRoomId, userId: finalUserId, room: rooms[safeRoomId] });
    io.to(safeRoomId).emit('user_joined', { room: rooms[safeRoomId] });
    console.log(`[JOIN] Room ${safeRoomId} now has ${rooms[safeRoomId].users.length} users`);
  });

  // Select Playlist (Host only)
  socket.on('select_playlist', async ({ roomId, playlistId, accessToken, playlistName }) => {
    const room = rooms[roomId];
    if (!room) return;

    console.log(`[PLAYLIST] Fetching tracks for playlist ${playlistId} in room ${roomId}`);

    try {
      // Fetch tracks from Spotify
      let allTracks = [];
      let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`;
      
      // Fetch first page (limit to 50 for now to be safe/fast)
      const response = await axios.get(nextUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      console.log(`[PLAYLIST] Fetched ${response.data.items.length} items from playlist.`);

      // MODIFIED: Accept ALL tracks, even without preview_url. We will fetch previews via Deezer later.
      const tracks = response.data.items
        .map(item => item.track)
        .filter(track => track && track.id); // Just ensure track exists

      console.log(`[PLAYLIST] Found ${tracks.length} valid tracks (previews will be fetched on demand).`);

      if (tracks.length < 2) {
        socket.emit('error', { message: `Playlist needs at least 2 songs!` });
        return;
      }

      room.availableTracks = tracks.map(t => ({
        id: t.id,
        title: t.name,
        artist: t.artists[0].name,
        url: t.preview_url, // Might be null
        image: t.album.images[0]?.url
      }));
      
      room.playlistName = playlistName;

      console.log(`[PLAYLIST] Loaded ${room.availableTracks.length} tracks into room.`);
      io.to(roomId).emit('playlist_updated', { 
        playlistName, 
        trackCount: room.availableTracks.length 
      });

    } catch (error) {
      console.error('Spotify API Error:', error.message);
      socket.emit('error', { message: 'Failed to load playlist' });
    }
  });

  // Start Game
  socket.on('start_game', async ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;

    // Use Spotify tracks if available, else fallback
    let songPool = (room.availableTracks && room.availableTracks.length >= 2) 
      ? [...room.availableTracks] 
      : [...FALLBACK_SONGS];

    if (songPool.length < 2) {
        io.to(roomId).emit('error', { message: 'Not enough songs to start!' });
        return;
    }

    // Shuffle pool
    songPool.sort(() => 0.5 - Math.random());

    // Find 2 songs with previews (Spotify or Deezer fallback)
    let commonSong = null;
    let imposterSong = null;

    console.log(`[GAME] Looking for playable songs in pool of ${songPool.length}...`);

    // Try pairs until we find one where both have previews
    for (let i = 0; i < Math.min(songPool.length - 1, 20); i += 2) {
        const s1 = songPool[i];
        const s2 = songPool[i+1];

        // Resolve previews if missing
        if (!s1.url) s1.url = await getDeezerPreview(s1.artist, s1.title);
        if (!s2.url) s2.url = await getDeezerPreview(s2.artist, s2.title);

        if (s1.url && s2.url) {
            commonSong = s1;
            imposterSong = s2;
            break;
        }
    }

    if (!commonSong || !imposterSong) {
         io.to(roomId).emit('error', { message: 'Could not find playable previews for these songs. Try another playlist.' });
         return;
    }

    // 1. Select Imposter
    const userCount = room.users.length;
    const imposterIndex = Math.floor(Math.random() * userCount);
    room.imposterId = room.users[imposterIndex].id;

    room.currentSongs = {
      common: commonSong,
      imposter: imposterSong
    };

    room.gameState = 'PLAYING';
    room.votes = {};

    // 3. Notify players
    room.users.forEach(user => {
      const isImposter = user.id === room.imposterId;
      const songToPlay = isImposter ? imposterSong : commonSong;
      
      io.to(user.socketId).emit('game_started', {
        // role: isImposter ? 'IMPOSTER' : 'INNOCENT', // HIDDEN ROLE
        song: songToPlay,
        duration: 30 // 30 seconds snippet
      });
    });

    // Auto-move to voting after 30 seconds
    setTimeout(() => {
      if (rooms[roomId] && rooms[roomId].gameState === 'PLAYING') {
        rooms[roomId].gameState = 'VOTING';
        io.to(roomId).emit('voting_started');
      }
    }, 30000);
  });

  // Submit Vote
  socket.on('vote', ({ roomId, voterId, suspectId }) => {
    const room = rooms[roomId];
    if (!room || room.gameState !== 'VOTING') return;

    room.votes[voterId] = suspectId;

    // Check if everyone voted
    if (Object.keys(room.votes).length === room.users.length) {
      revealResults(roomId);
    } else {
        io.to(roomId).emit('vote_update', { count: Object.keys(room.votes).length });
    }
  });

  const revealResults = (roomId) => {
    const room = rooms[roomId];
    if (!room) return;

    // Calculate votes
    const voteCounts = {};
    Object.values(room.votes).forEach(suspectId => {
      voteCounts[suspectId] = (voteCounts[suspectId] || 0) + 1;
    });

    // Find who got most votes
    let maxVotes = 0;
    let votedOutId = null;
    for (const [id, count] of Object.entries(voteCounts)) {
      if (count > maxVotes) {
        maxVotes = count;
        votedOutId = id;
      }
    }

    const imposterCaught = votedOutId === room.imposterId;
    const imposter = room.users.find(u => u.id === room.imposterId);
    const votedOutUser = room.users.find(u => u.id === votedOutId);

    room.gameState = 'RESULTS';
    
    io.to(roomId).emit('game_over', {
      imposterCaught,
      imposter,
      votedOutUser,
      votes: room.votes,
      songs: room.currentSongs
    });

    // Reset for next round after delay? Or let host restart.
    setTimeout(() => {
        room.gameState = 'LOBBY';
        room.votes = {};
        room.imposterId = null;
        io.to(roomId).emit('return_to_lobby', { room });
    }, 10000);
  };

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const user = room.users.find(u => u.socketId === socket.id);
      
      if (user) {
        user.connected = false;
        // We do NOT remove the user immediately to allow reconnects (refresh).
        // We only notify others that the user might be offline (optional UI update)
        // io.to(roomId).emit('user_joined', { room }); 
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
