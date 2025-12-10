const express = require('express');
const http = require('http');
// Deploy Trigger: Force Restart
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const axios = require('axios');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const { Code, Subscription, PlayerProfile, ACHIEVEMENTS } = require('./models');

const app = express();
app.use(cors());
app.use(cookieParser());
app.use(express.json()); // Enable JSON body parsing

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB Connection Error:', err));
} else {
  console.warn('MONGODB_URI not found in .env - Pro features will not work persistently');
}

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

// Pro Features API
app.post('/api/redeem', async (req, res) => {
  const { code, deviceId } = req.body;

  if (!code || !deviceId) {
    return res.status(400).json({ success: false, message: 'Code und Device ID erforderlich' });
  }

  try {
    // 1. Check if code exists and is valid
    const codeEntry = await Code.findOne({ code: code });
    if (!codeEntry) {
      return res.status(404).json({ success: false, message: 'Ungültiger Code' });
    }

    if (codeEntry.isRedeemed) {
      return res.status(400).json({ success: false, message: 'Code wurde bereits eingelöst' });
    }

    // 2. Calculate expiry
    let expiryDate = null;
    if (codeEntry.type === '30days') {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      expiryDate = d;
    } else {
      // Lifetime = 100 years
      const d = new Date();
      d.setFullYear(d.getFullYear() + 100);
      expiryDate = d;
    }

    // 3. Create or Update Subscription
    await Subscription.findOneAndUpdate(
      { deviceId: deviceId },
      { 
        deviceId: deviceId,
        type: codeEntry.type,
        expiryDate: expiryDate
      },
      { upsert: true, new: true }
    );

    // 4. Mark code as redeemed
    codeEntry.isRedeemed = true;
    await codeEntry.save();

    res.json({ success: true, message: 'Pro aktiviert!', type: codeEntry.type, expiry: expiryDate });

  } catch (error) {
    console.error('Redeem Error:', error);
    res.status(500).json({ success: false, message: 'Serverfehler' });
  }
});

app.get('/api/status', async (req, res) => {
  const { deviceId } = req.query;
  if (!deviceId) return res.json({ isPro: false });

  try {
    const sub = await Subscription.findOne({ deviceId: deviceId });
    if (!sub) return res.json({ isPro: false });

    // Check expiry
    if (new Date() > sub.expiryDate) {
      return res.json({ isPro: false, expired: true });
    }

    res.json({ isPro: true, type: sub.type, expiry: sub.expiryDate });
  } catch (error) {
    console.error('Status Error:', error);
    res.json({ isPro: false });
  }
});

// ============ PROFILE & STATS API ============

// Get or Create Player Profile
app.get('/api/profile', async (req, res) => {
  const { deviceId } = req.query;
  if (!deviceId) return res.status(400).json({ error: 'deviceId erforderlich' });

  try {
    let profile = await PlayerProfile.findOne({ deviceId });
    if (!profile) {
      return res.json({ profile: null });
    }
    res.json({ profile, achievements: ACHIEVEMENTS });
  } catch (error) {
    console.error('Profile Error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Create or Update Profile
app.post('/api/profile', async (req, res) => {
  const { deviceId, username } = req.body;
  if (!deviceId || !username) {
    return res.status(400).json({ error: 'deviceId und username erforderlich' });
  }

  try {
    let profile = await PlayerProfile.findOneAndUpdate(
      { deviceId },
      { 
        deviceId,
        username,
        lastPlayed: new Date()
      },
      { upsert: true, new: true }
    );
    res.json({ success: true, profile });
  } catch (error) {
    console.error('Profile Create Error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Get Leaderboard
app.get('/api/leaderboard', async (req, res) => {
  const { type = 'points', limit = 50 } = req.query;

  try {
    let sortField = 'stats.totalPoints';
    if (type === 'wins') sortField = 'stats.gamesWon';
    if (type === 'games') sortField = 'stats.gamesPlayed';
    if (type === 'streak') sortField = 'stats.bestWinStreak';

    const leaderboard = await PlayerProfile.find({})
      .select('username stats.totalPoints stats.gamesWon stats.gamesPlayed stats.bestWinStreak avatar deviceId')
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit));

    res.json({ leaderboard, type });
  } catch (error) {
    console.error('Leaderboard Error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Get all Achievements definitions
app.get('/api/achievements', (req, res) => {
  res.json({ achievements: ACHIEVEMENTS });
});

// Helper function to check and unlock achievements
async function checkAchievements(profile) {
  const newAchievements = [];
  const stats = profile.stats;
  const unlockedIds = profile.achievements.map(a => a.id);

  const checkAndUnlock = (conditionMet, achievementId) => {
    if (conditionMet && !unlockedIds.includes(achievementId)) {
      newAchievements.push({ id: achievementId, unlockedAt: new Date() });
    }
  };

  // Game milestones
  checkAndUnlock(stats.gamesPlayed >= 1, 'FIRST_GAME');
  checkAndUnlock(stats.gamesPlayed >= 10, 'GAMES_10');
  checkAndUnlock(stats.gamesPlayed >= 50, 'GAMES_50');
  checkAndUnlock(stats.gamesPlayed >= 100, 'GAMES_100');

  // Win achievements
  checkAndUnlock(stats.gamesWon >= 1, 'FIRST_WIN');
  checkAndUnlock(stats.gamesWon >= 10, 'WINS_10');
  checkAndUnlock(stats.gamesWon >= 25, 'WINS_25');
  checkAndUnlock(stats.gamesWon >= 50, 'WINS_50');

  // Imposter achievements
  checkAndUnlock(stats.timesImposterWon >= 1, 'IMPOSTER_FIRST');
  checkAndUnlock(stats.timesImposterWon >= 5, 'IMPOSTER_5');
  checkAndUnlock(stats.timesImposterWon >= 15, 'IMPOSTER_15');

  // Detective achievements
  checkAndUnlock(stats.correctVotes >= 1, 'DETECTIVE_FIRST');
  checkAndUnlock(stats.correctVotes >= 10, 'DETECTIVE_10');
  checkAndUnlock(stats.correctVotes >= 25, 'DETECTIVE_25');

  // Streak achievements
  checkAndUnlock(stats.bestWinStreak >= 3, 'STREAK_3');
  checkAndUnlock(stats.bestWinStreak >= 5, 'STREAK_5');
  checkAndUnlock(stats.bestWinStreak >= 10, 'STREAK_10');

  if (newAchievements.length > 0) {
    profile.achievements.push(...newAchievements);
    // Add points for new achievements
    for (const ach of newAchievements) {
      if (ACHIEVEMENTS[ach.id]) {
        profile.stats.totalPoints += ACHIEVEMENTS[ach.id].points;
      }
    }
    await profile.save();
  }

  return newAchievements;
}

// ============ END PROFILE & STATS API ============

// Spotify Auth Routes
app.get('/api/search', async (req, res) => {
  const { q, type } = req.query; // type defaults to 'playlist'
  if (!q) return res.status(400).json({ error: 'Suchbegriff fehlt' });

  try {
    const token = await getClientCredentialsToken();
    if (!token) return res.status(500).json({ error: 'Server Token Error' });

    const response = await axios.get(`https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=${type || 'playlist'}&limit=10`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Search Error:', error.message);
    res.status(500).json({ error: 'Suche fehlgeschlagen' });
  }
});

app.get('/login', (req, res) => {
  const returnTo = req.query.return_to || null;
  const stateData = {
    id: uuidv4(),
    returnTo: returnTo
  };
  // Encode state as base64 json to be safe
  const state = Buffer.from(JSON.stringify(stateData)).toString('base64');
  
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

  let returnTo = CLIENT_URL; // Default to env var

  if (state) {
    try {
        const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
        if (decodedState.returnTo) {
            returnTo = decodedState.returnTo;
            console.log("Redirecting to custom URL:", returnTo);
        }
    } catch (e) {
        console.error("Failed to parse state:", e);
    }
  }

  if (state === null) {
    res.redirect(returnTo + '/#' + querystring.stringify({ error: 'state_mismatch' }));
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

      // If returnTo is a custom scheme (like musicimposter://), we might need to handle it differently
      // But usually appending hash works fine.
      // For deep links: musicimposter://spotify-callback#access_token=...
      // For web: http://localhost:3000/spotify-callback#access_token=...
      
      let redirectUrl = returnTo;
      if (!redirectUrl.includes('://')) {
          // Assume it's a path relative to CLIENT_URL if it was just a path (not implemented here but good practice)
      }
      
      // If it's a web URL, append /spotify-callback if not present (legacy support)
      if (redirectUrl.startsWith('http') && !redirectUrl.includes('spotify-callback')) {
          redirectUrl += '/spotify-callback';
      }

      res.redirect(redirectUrl + '#' + 
        querystring.stringify({ access_token, refresh_token }));
    } catch (error) {
      console.error('Spotify Auth Error:', error.response?.data || error.message);
      res.redirect(returnTo + '/#' + querystring.stringify({ error: 'invalid_token' }));
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

// Helper: Get Client Credentials Token (App Token)
async function getClientCredentialsToken() {
  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', 
      querystring.stringify({ grant_type: 'client_credentials' }), {
      headers: {
        'Authorization': 'Basic ' + (Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Failed to get Client Credentials Token:', error.message);
    return null;
  }
}

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
  socket.on('create_room', ({ username, userId, deviceId }) => {
    const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
    const finalUserId = userId || uuidv4();
    
    console.log(`[CREATE] Room ${roomId} created by ${username} (${finalUserId}), deviceId: ${deviceId}`);

    rooms[roomId] = {
      id: roomId,
      users: [{
        id: finalUserId,
        deviceId: deviceId || finalUserId, // Store deviceId for stats
        name: username,
        socketId: socket.id,
        isHost: true,
        score: 0,
        connected: true,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
      }],
      gameState: 'LOBBY',
      imposterId: null,
      imposterIds: [], // Support multiple imposters
      currentSongs: null,
      availableTracks: null, // Will be populated from Spotify
      playlistName: null,
      showRoles: false,
      // New settings
      settings: {
        imposterCount: 1,
        songDuration: 30, // 15, 30, 45, 60 seconds
        isPrivate: false
      },
      bannedUsers: [], // List of banned user IDs
      nearbyId: null // For Bluetooth nearby discovery
    };

    socket.join(roomId);
    socket.emit('room_created', { roomId, userId: finalUserId, room: rooms[roomId] });
  });

  // Join Room
  socket.on('join_room', ({ roomId, username, userId, deviceId }) => {
    const safeRoomId = roomId ? roomId.toUpperCase() : '';
    console.log(`[JOIN] Request for room ${safeRoomId} by ${username} (${userId}), deviceId: ${deviceId}`);

    if (!rooms[safeRoomId]) {
      console.log(`[JOIN] Room ${safeRoomId} not found`);
      socket.emit('error', { message: 'Raum nicht gefunden' });
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
      socket.emit('error', { message: 'Spiel läuft bereits' });
      return;
    }

    // Check if user is banned
    if (rooms[safeRoomId].bannedUsers.includes(userId)) {
      socket.emit('error', { message: 'Du wurdest aus dieser Lobby gebannt' });
      return;
    }

    const finalUserId = userId || uuidv4();
    console.log(`[JOIN] New user ${username} joining ${safeRoomId}`);
    
    const newUser = {
      id: finalUserId,
      deviceId: deviceId || finalUserId, // Store deviceId for stats
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
      let token = accessToken;

      // If no user token provided, try to use Server Token (Client Credentials)
      if (!token) {
          console.log("[PLAYLIST] No user token provided. Attempting to use Server Token...");
          token = await getClientCredentialsToken();
          if (!token) throw new Error("Could not generate Server Token");
      }

      // Fetch tracks from Spotify
      let allTracks = [];
      let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`;
      
      // Fetch first page (limit to 50 for now to be safe/fast)
      const response = await axios.get(nextUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log(`[PLAYLIST] Fetched ${response.data.items.length} items from playlist.`);

      // MODIFIED: Accept ALL tracks, even without preview_url. We will fetch previews via Deezer later.
      const tracks = response.data.items
        .map(item => item.track)
        .filter(track => track && track.id); // Just ensure track exists

      console.log(`[PLAYLIST] Found ${tracks.length} valid tracks (previews will be fetched on demand).`);

      if (tracks.length < 2) {
        socket.emit('error', { message: `Playlist braucht mindestens 2 Songs!` });
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
      console.error('Spotify API Error:', error.response ? error.response.data : error.message);
      const errorMsg = error.response?.data?.error?.message || error.message || 'Unbekannter Fehler';
      socket.emit('error', { message: `Fehler beim Laden der Playlist: ${errorMsg}` });
    }
  });

  // Toggle Show Roles (Host only)
  socket.on('toggle_show_roles', ({ roomId, showRoles }) => {
    const room = rooms[roomId];
    if (room) {
      room.showRoles = showRoles;
      io.to(roomId).emit('room_settings_updated', { showRoles: room.showRoles });
    }
  });

  // Update Room Settings (Host only)
  socket.on('update_settings', ({ roomId, settings }) => {
    const room = rooms[roomId];
    if (!room) return;
    
    // Verify sender is host
    const user = room.users.find(u => u.socketId === socket.id);
    if (!user || !user.isHost) {
      socket.emit('error', { message: 'Nur der Host kann Einstellungen ändern' });
      return;
    }

    // Validate imposter count based on player count
    const playerCount = room.users.length;
    let imposterCount = settings.imposterCount || room.settings.imposterCount;
    
    // Max imposters: 1 for <4 players, 2 for 4-5 players, 3 for 6+ players
    const maxImposters = playerCount < 4 ? 1 : (playerCount < 6 ? 2 : 3);
    imposterCount = Math.min(imposterCount, maxImposters);
    imposterCount = Math.max(1, imposterCount);

    // Update settings
    room.settings = {
      imposterCount: imposterCount,
      songDuration: settings.songDuration || room.settings.songDuration,
      isPrivate: settings.isPrivate !== undefined ? settings.isPrivate : room.settings.isPrivate
    };

    console.log(`[SETTINGS] Room ${roomId} settings updated:`, room.settings);
    io.to(roomId).emit('settings_updated', { settings: room.settings, maxImposters });
  });

  // Kick/Ban Player (Host only)
  socket.on('kick_player', ({ roomId, targetUserId, ban }) => {
    const room = rooms[roomId];
    if (!room) return;

    // Verify sender is host
    const hostUser = room.users.find(u => u.socketId === socket.id);
    if (!hostUser || !hostUser.isHost) {
      socket.emit('error', { message: 'Nur der Host kann Spieler kicken' });
      return;
    }

    // Can't kick yourself
    if (hostUser.id === targetUserId) {
      socket.emit('error', { message: 'Du kannst dich nicht selbst kicken' });
      return;
    }

    const targetUser = room.users.find(u => u.id === targetUserId);
    if (!targetUser) return;

    console.log(`[KICK] User ${targetUser.name} kicked from room ${roomId} (ban: ${ban})`);

    // Add to banned list if requested
    if (ban && !room.bannedUsers.includes(targetUserId)) {
      room.bannedUsers.push(targetUserId);
    }

    // Notify the kicked user
    io.to(targetUser.socketId).emit('kicked_from_room', { 
      message: ban ? 'Du wurdest aus der Lobby gebannt' : 'Du wurdest aus der Lobby entfernt',
      banned: ban
    });

    // Remove from room
    room.users = room.users.filter(u => u.id !== targetUserId);

    // Notify others
    io.to(roomId).emit('user_left', { room, kickedUser: targetUser.name });
  });

  // Get Nearby Lobbies (for discovery)
  socket.on('get_nearby_lobbies', () => {
    // Find all lobbies that have nearbyId set (host enabled discovery) and are in LOBBY state
    const nearbyLobbies = Object.values(rooms)
      .filter(room => {
        // Must have nearbyId set
        if (!room.nearbyId) return false;
        // Must be in lobby state
        if (room.gameState !== 'LOBBY') return false;
        // Must not be private
        if (room.settings?.isPrivate) return false;
        // Must have space
        if (room.users.length >= 10) return false;
        // Host must be connected
        const host = room.users.find(u => u.isHost);
        if (!host || !host.connected) return false;
        // Must have at least one user
        if (room.users.length === 0) return false;
        return true;
      })
      .map(room => {
        const host = room.users.find(u => u.isHost);
        return {
          roomId: room.id,
          hostName: host?.name || 'Unbekannt',
          playerCount: room.users.length,
          playlistName: room.playlistName
        };
      });

    console.log(`[NEARBY] Found ${nearbyLobbies.length} discoverable lobbies`);
    socket.emit('nearby_lobbies', { lobbies: nearbyLobbies });
  });

  // Set Nearby ID for lobby (Host enables Bluetooth discovery)
  socket.on('set_nearby_id', ({ roomId, nearbyId }) => {
    const room = rooms[roomId];
    if (!room) return;

    const user = room.users.find(u => u.socketId === socket.id);
    if (!user || !user.isHost) return;

    room.nearbyId = nearbyId;
    console.log(`[NEARBY] Room ${roomId} set nearbyId to: ${nearbyId}`);
    socket.emit('nearby_id_set', { nearbyId });
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
        io.to(roomId).emit('error', { message: 'Nicht genügend Songs zum Starten!' });
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
         io.to(roomId).emit('error', { message: 'Keine abspielbaren Previews gefunden. Versuche eine andere Playlist.' });
         return;
    }

    // 1. Select Imposter(s) based on settings
    const userCount = room.users.length;
    const maxImposters = userCount < 4 ? 1 : (userCount < 6 ? 2 : 3);
    const imposterCount = Math.min(room.settings.imposterCount || 1, maxImposters);
    
    // Shuffle users and pick imposters
    const shuffledUsers = [...room.users].sort(() => 0.5 - Math.random());
    room.imposterIds = shuffledUsers.slice(0, imposterCount).map(u => u.id);
    room.imposterId = room.imposterIds[0]; // Keep for backwards compatibility

    console.log(`[GAME] Selected ${imposterCount} imposter(s):`, room.imposterIds);

    room.currentSongs = {
      common: commonSong,
      imposter: imposterSong
    };

    room.gameState = 'PLAYING';
    room.votes = {};

    const songDuration = room.settings.songDuration || 30;

    // 3. Notify players
    room.users.forEach(user => {
      const isImposter = room.imposterIds.includes(user.id);
      const songToPlay = isImposter ? imposterSong : commonSong;
      
      io.to(user.socketId).emit('game_started', {
        role: isImposter ? 'IMPOSTER' : 'INNOCENT',
        song: songToPlay,
        duration: songDuration,
        imposterCount: imposterCount
      });
    });

    // Auto-move to voting after configured duration
    setTimeout(() => {
      if (rooms[roomId] && rooms[roomId].gameState === 'PLAYING') {
        rooms[roomId].gameState = 'VOTING';
        io.to(roomId).emit('voting_started');
      }
    }, songDuration * 1000);
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

  const revealResults = async (roomId) => {
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

    // Check if voted out user is one of the imposters
    const imposterCaught = room.imposterIds.includes(votedOutId);
    const imposters = room.users.filter(u => room.imposterIds.includes(u.id));
    const imposter = imposters[0]; // For backwards compatibility
    const votedOutUser = room.users.find(u => u.id === votedOutId);

    // Check for perfect game (all voted for imposter)
    const totalVoters = Object.keys(room.votes).length;
    const isPerfectGame = imposterCaught && maxVotes === totalVoters;
    
    // Check for close call (1 vote difference)
    const voteValues = Object.values(voteCounts);
    const sortedVotes = voteValues.sort((a, b) => b - a);
    const isCloseCall = sortedVotes.length > 1 && (sortedVotes[0] - sortedVotes[1]) === 1;

    // ============ UPDATE PLAYER STATS ============
    const newAchievementsMap = {}; // deviceId -> [achievements]
    
    try {
      for (const user of room.users) {
        const deviceId = user.deviceId; // Use the stored deviceId for stats
        if (!deviceId) {
          console.log(`[STATS] No deviceId for user ${user.name}, skipping stats update`);
          continue;
        }
        
        let profile = await PlayerProfile.findOne({ deviceId });
        
        if (!profile) {
          // Create profile if doesn't exist
          profile = new PlayerProfile({
            deviceId,
            username: user.name,
            stats: {}
          });
        }

        const isImposter = room.imposterIds.includes(user.id);
        const votedCorrectly = room.votes[user.id] && room.imposterIds.includes(room.votes[user.id]);
        
        // Update basic stats
        profile.stats.gamesPlayed += 1;
        profile.stats.totalVotes += 1;
        profile.lastPlayed = new Date();
        
        if (isImposter) {
          profile.stats.timesImposter += 1;
        } else {
          profile.stats.timesInnocent += 1;
        }

        // Determine if this player won
        let playerWon = false;
        if (isImposter && !imposterCaught) {
          // Imposter won (not caught)
          playerWon = true;
          profile.stats.timesImposterWon += 1;
        } else if (!isImposter && imposterCaught) {
          // Innocent won (imposter caught)
          playerWon = true;
          profile.stats.timesInnocentWon += 1;
        }

        if (playerWon) {
          profile.stats.gamesWon += 1;
          profile.stats.winStreak += 1;
          profile.stats.totalPoints += 10; // 10 points per win
          
          if (profile.stats.winStreak > profile.stats.bestWinStreak) {
            profile.stats.bestWinStreak = profile.stats.winStreak;
          }
        } else {
          profile.stats.winStreak = 0;
        }

        // Check if voted correctly (for non-imposters)
        if (!isImposter && votedCorrectly) {
          profile.stats.correctVotes += 1;
          profile.stats.totalPoints += 5; // 5 bonus points for correct vote
        }

        // Special achievements
        if (isPerfectGame && !isImposter && imposterCaught) {
          // Check PERFECT_GAME achievement
          if (!profile.achievements.find(a => a.id === 'PERFECT_GAME')) {
            profile.achievements.push({ id: 'PERFECT_GAME', unlockedAt: new Date() });
            profile.stats.totalPoints += ACHIEVEMENTS.PERFECT_GAME.points;
          }
        }

        if (isCloseCall && playerWon) {
          // Check CLOSE_CALL achievement
          if (!profile.achievements.find(a => a.id === 'CLOSE_CALL')) {
            profile.achievements.push({ id: 'CLOSE_CALL', unlockedAt: new Date() });
            profile.stats.totalPoints += ACHIEVEMENTS.CLOSE_CALL.points;
          }
        }

        await profile.save();
        
        // Check for new achievements
        const newAchievements = await checkAchievements(profile);
        if (newAchievements.length > 0) {
          newAchievementsMap[user.id] = newAchievements.map(a => ({
            ...ACHIEVEMENTS[a.id],
            unlockedAt: a.unlockedAt
          }));
        }
      }
    } catch (error) {
      console.error('[STATS] Error updating player stats:', error);
    }
    // ============ END UPDATE PLAYER STATS ============

    room.gameState = 'RESULTS';
    
    io.to(roomId).emit('game_over', {
      imposterCaught,
      imposter,
      imposters, // All imposters for display
      votedOutUser,
      votes: room.votes,
      songs: room.currentSongs,
      imposterCount: room.imposterIds.length,
      isPerfectGame,
      isCloseCall,
      newAchievements: newAchievementsMap
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
      const userIndex = room.users.findIndex(u => u.socketId === socket.id);
      
      if (userIndex !== -1) {
        const user = room.users[userIndex];
        user.connected = false;
        
        // Remove user after 10 seconds if still disconnected (allow quick reconnects)
        setTimeout(() => {
          // Check if room still exists
          if (!rooms[roomId]) return;
          
          // Check if user reconnected (different socketId)
          const currentUser = rooms[roomId].users.find(u => u.id === user.id);
          if (currentUser && currentUser.connected) return; // User reconnected
          
          // Remove user
          rooms[roomId].users = rooms[roomId].users.filter(u => u.id !== user.id);
          console.log(`[DISCONNECT] Removed ${user.name} from room ${roomId}`);
          
          // If host left, assign new host or delete room
          if (user.isHost) {
            if (rooms[roomId].users.length > 0) {
              rooms[roomId].users[0].isHost = true;
              // Reset nearbyId when host leaves
              rooms[roomId].nearbyId = null;
              console.log(`[DISCONNECT] New host: ${rooms[roomId].users[0].name}`);
            } else {
              // No users left, delete room
              delete rooms[roomId];
              console.log(`[DISCONNECT] Room ${roomId} deleted (empty)`);
              return;
            }
          }
          
          // Delete room if empty
          if (rooms[roomId].users.length === 0) {
            delete rooms[roomId];
            console.log(`[DISCONNECT] Room ${roomId} deleted (empty)`);
            return;
          }
          
          // Notify remaining users
          io.to(roomId).emit('user_left', { room: rooms[roomId] });
        }, 10000); // 10 seconds grace period
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
