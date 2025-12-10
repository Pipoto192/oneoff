'use client';
import { memo } from 'react';
import { TrendingUp, Sparkles, Music, Clock, Globe } from 'lucide-react';
import useHaptics from '@/hooks/useHaptics';

// Verified Spotify playlist IDs that work reliably
const suggestedPlaylists = [
  {
    id: '37i9dQZF1DXcBWIGoYBM5M',
    name: "Today's Top Hits",
    description: 'Die größten Hits',
    emoji: '🔥',
    category: 'trending'
  },
  {
    id: '37i9dQZF1DX4JAvHpjipBk',
    name: 'New Music Friday',
    description: 'Neue Musik',
    emoji: '✨',
    category: 'trending'
  },
  {
    id: '37i9dQZF1DX0XUsuxWHRQd',
    name: 'RapCaviar',
    description: 'Hip-Hop & Rap',
    emoji: '🎤',
    category: 'genre'
  },
  {
    id: '37i9dQZF1DWXRqgorJj26U',
    name: 'Rock Classics',
    description: 'Rock Legenden',
    emoji: '🎸',
    category: 'genre'
  },
  {
    id: '37i9dQZF1DX5Ejj0EkURtP',
    name: 'All Out 2010s',
    description: '2010er Hits',
    emoji: '📱',
    category: 'decade'
  },
  {
    id: '37i9dQZF1DX4o1oenSJRJd',
    name: 'All Out 2000s',
    description: '2000er Hits',
    emoji: '💿',
    category: 'decade'
  },
  {
    id: '37i9dQZF1DX4UtSsGT1Sbe',
    name: 'All Out 90s',
    description: '90er Klassiker',
    emoji: '📼',
    category: 'decade'
  },
  {
    id: '37i9dQZEVXbJiZcmkrIHGU',
    name: 'Top 50 Germany',
    description: 'Charts DE',
    emoji: '🇩🇪',
    category: 'regional'
  },
  {
    id: '37i9dQZF1DX4SBhb3fqCJd',
    name: 'Are & Be',
    description: 'R&B Vibes',
    emoji: '💜',
    category: 'genre'
  },
  {
    id: '37i9dQZF1DX1lVhptIYRda',
    name: 'Hot Hits DE',
    description: 'Deutsche Hits',
    emoji: '🔊',
    category: 'regional'
  },
  {
    id: '37i9dQZF1DXaKIA8E7WcJj',
    name: 'All Out 80s',
    description: '80er Hits',
    emoji: '🕺',
    category: 'decade'
  },
  {
    id: '37i9dQZF1DX10zKzsJ2jva',
    name: 'Viva Latino',
    description: 'Latin Hits',
    emoji: '🌴',
    category: 'genre'
  }
];

// Category config
const categoryLabels = {
  trending: { label: 'Trending', icon: TrendingUp, color: 'from-green-500 to-emerald-600' },
  genre: { label: 'Genres', icon: Music, color: 'from-purple-500 to-pink-600' },
  decade: { label: 'Jahrzehnte', icon: Clock, color: 'from-orange-500 to-red-600' },
  regional: { label: 'Regional', icon: Globe, color: 'from-blue-500 to-cyan-600' }
};

// Playlist Card with emoji instead of image
const PlaylistCard = memo(function PlaylistCard({ playlist, onSelect }) {
  const { lightImpact } = useHaptics();

  return (
    <button
      onClick={() => {
        lightImpact();
        onSelect(playlist.id, playlist.name);
      }}
      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-all btn-press group min-w-[90px] border border-slate-700/50 hover:border-purple-500/50"
    >
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600/30 to-pink-600/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-lg">
        {playlist.emoji}
      </div>
      <div className="text-center">
        <p className="text-xs font-medium text-white truncate max-w-[85px]">{playlist.name}</p>
        <p className="text-[10px] text-slate-500 truncate max-w-[85px]">{playlist.description}</p>
      </div>
    </button>
  );
});

// Main Component
const SuggestedPlaylists = memo(function SuggestedPlaylists({ onSelectPlaylist, compact = false }) {
  // Group by category
  const groupedPlaylists = suggestedPlaylists.reduce((acc, playlist) => {
    if (!acc[playlist.category]) acc[playlist.category] = [];
    acc[playlist.category].push(playlist);
    return acc;
  }, {});

  if (compact) {
    // Compact: horizontal scroll with top 6
    const topPicks = suggestedPlaylists.slice(0, 6);
    
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-slate-300">Schnellauswahl</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
          {topPicks.map(playlist => (
            <PlaylistCard 
              key={playlist.id} 
              playlist={playlist} 
              onSelect={onSelectPlaylist}
            />
          ))}
        </div>
      </div>
    );
  }

  // Full mode - categorized
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-medium text-slate-300">Beliebte Playlists</span>
      </div>
      
      {Object.entries(groupedPlaylists).map(([category, playlists]) => {
        const categoryInfo = categoryLabels[category];
        const Icon = categoryInfo?.icon || Music;
        
        return (
          <div key={category}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${categoryInfo?.color} flex items-center justify-center`}>
                <Icon className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs font-medium text-slate-400">
                {categoryInfo?.label || category}
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
              {playlists.map(playlist => (
                <PlaylistCard 
                  key={playlist.id} 
                  playlist={playlist} 
                  onSelect={onSelectPlaylist}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
});

export { suggestedPlaylists };
export default SuggestedPlaylists;
