const mongoose = require('mongoose');

const CodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  type: { type: String, enum: ['30days', 'lifetime'], default: '30days' },
  isRedeemed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const SubscriptionSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  expiryDate: { type: Date, required: true }, // null for lifetime? Or far future
  type: { type: String, enum: ['30days', 'lifetime'], required: true }
});

// Player Profile & Statistics Schema
const PlayerProfileSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  avatar: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  lastPlayed: { type: Date, default: Date.now },
  
  // Statistics
  stats: {
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    timesImposter: { type: Number, default: 0 },
    timesImposterWon: { type: Number, default: 0 },
    timesInnocent: { type: Number, default: 0 },
    timesInnocentWon: { type: Number, default: 0 },
    correctVotes: { type: Number, default: 0 },
    totalVotes: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    winStreak: { type: Number, default: 0 },
    bestWinStreak: { type: Number, default: 0 }
  },
  
  // Achievements - stored as array of achievement IDs with unlock date
  achievements: [{
    id: { type: String, required: true },
    unlockedAt: { type: Date, default: Date.now }
  }]
});

// Achievement Definitions (static, not in DB)
const ACHIEVEMENTS = {
  // Game Milestones
  FIRST_GAME: { id: 'FIRST_GAME', name: 'Erster Schritt', description: 'Spiele dein erstes Spiel', icon: '🎮', points: 10 },
  GAMES_10: { id: 'GAMES_10', name: 'Stammgast', description: 'Spiele 10 Spiele', icon: '🎯', points: 25 },
  GAMES_50: { id: 'GAMES_50', name: 'Veteran', description: 'Spiele 50 Spiele', icon: '🏅', points: 50 },
  GAMES_100: { id: 'GAMES_100', name: 'Legende', description: 'Spiele 100 Spiele', icon: '👑', points: 100 },
  
  // Win Achievements
  FIRST_WIN: { id: 'FIRST_WIN', name: 'Erster Sieg', description: 'Gewinne dein erstes Spiel', icon: '🏆', points: 15 },
  WINS_10: { id: 'WINS_10', name: 'Sieger', description: 'Gewinne 10 Spiele', icon: '⭐', points: 30 },
  WINS_25: { id: 'WINS_25', name: 'Champion', description: 'Gewinne 25 Spiele', icon: '🌟', points: 60 },
  WINS_50: { id: 'WINS_50', name: 'Meister', description: 'Gewinne 50 Spiele', icon: '💫', points: 100 },
  
  // Imposter Achievements
  IMPOSTER_FIRST: { id: 'IMPOSTER_FIRST', name: 'Täuscher', description: 'Gewinne als Imposter', icon: '🎭', points: 20 },
  IMPOSTER_5: { id: 'IMPOSTER_5', name: 'Schauspieler', description: 'Gewinne 5x als Imposter', icon: '🕵️', points: 40 },
  IMPOSTER_15: { id: 'IMPOSTER_15', name: 'Meistertäuscher', description: 'Gewinne 15x als Imposter', icon: '🦹', points: 75 },
  
  // Detective Achievements
  DETECTIVE_FIRST: { id: 'DETECTIVE_FIRST', name: 'Spürnase', description: 'Finde den Imposter', icon: '🔍', points: 15 },
  DETECTIVE_10: { id: 'DETECTIVE_10', name: 'Detektiv', description: 'Finde 10x den Imposter', icon: '🔎', points: 35 },
  DETECTIVE_25: { id: 'DETECTIVE_25', name: 'Sherlock', description: 'Finde 25x den Imposter', icon: '🧐', points: 70 },
  
  // Streak Achievements
  STREAK_3: { id: 'STREAK_3', name: 'Auf einer Rolle', description: '3 Siege in Folge', icon: '🔥', points: 25 },
  STREAK_5: { id: 'STREAK_5', name: 'Unaufhaltsam', description: '5 Siege in Folge', icon: '💪', points: 50 },
  STREAK_10: { id: 'STREAK_10', name: 'Unbesiegbar', description: '10 Siege in Folge', icon: '⚡', points: 100 },
  
  // Special Achievements
  PERFECT_GAME: { id: 'PERFECT_GAME', name: 'Perfekt', description: 'Alle stimmen für den Imposter', icon: '💯', points: 30 },
  CLOSE_CALL: { id: 'CLOSE_CALL', name: 'Knapp daneben', description: 'Gewinne mit nur 1 Stimme Vorsprung', icon: '😅', points: 20 }
};

const Code = mongoose.model('Code', CodeSchema);
const Subscription = mongoose.model('Subscription', SubscriptionSchema);
const PlayerProfile = mongoose.model('PlayerProfile', PlayerProfileSchema);

module.exports = { Code, Subscription, PlayerProfile, ACHIEVEMENTS };
