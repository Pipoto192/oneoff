'use client';
import { useState, useEffect, useCallback, memo } from 'react';
import { Clock, Star, Heart, Trash2, Music } from 'lucide-react';
import useHaptics from '@/hooks/useHaptics';

const FAVORITES_KEY = 'oneoff_favorite_playlists';
const RECENT_KEY = 'oneoff_recent_playlists';
const MAX_RECENT = 5;
const MAX_FAVORITES = 10;

// Playlist item structure
// { id: string, name: string, image?: string, owner?: string, savedAt: string }

// Hook to manage playlists
export function useSavedPlaylists() {
  const [favorites, setFavorites] = useState([]);
  const [recent, setRecent] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem(FAVORITES_KEY);
      const savedRecent = localStorage.getItem(RECENT_KEY);
      
      if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
      if (savedRecent) setRecent(JSON.parse(savedRecent));
    } catch (e) {
      console.error('Failed to load saved playlists:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save favorites
  const saveFavorites = useCallback((newFavorites) => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (e) {
      console.error('Failed to save favorites:', e);
    }
  }, []);

  // Save recent
  const saveRecent = useCallback((newRecent) => {
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(newRecent));
      setRecent(newRecent);
    } catch (e) {
      console.error('Failed to save recent:', e);
    }
  }, []);

  // Add to favorites
  const addFavorite = useCallback((playlist) => {
    setFavorites(prev => {
      // Don't add if already exists
      if (prev.some(p => p.id === playlist.id)) return prev;
      
      const newFavorites = [
        { ...playlist, savedAt: new Date().toISOString() },
        ...prev
      ].slice(0, MAX_FAVORITES);
      
      saveFavorites(newFavorites);
      return newFavorites;
    });
  }, [saveFavorites]);

  // Remove from favorites
  const removeFavorite = useCallback((playlistId) => {
    setFavorites(prev => {
      const newFavorites = prev.filter(p => p.id !== playlistId);
      saveFavorites(newFavorites);
      return newFavorites;
    });
  }, [saveFavorites]);

  // Check if playlist is favorite
  const isFavorite = useCallback((playlistId) => {
    return favorites.some(p => p.id === playlistId);
  }, [favorites]);

  // Toggle favorite
  const toggleFavorite = useCallback((playlist) => {
    if (isFavorite(playlist.id)) {
      removeFavorite(playlist.id);
      return false;
    } else {
      addFavorite(playlist);
      return true;
    }
  }, [isFavorite, removeFavorite, addFavorite]);

  // Add to recent (called when playlist is selected)
  const addRecent = useCallback((playlist) => {
    setRecent(prev => {
      // Remove if already exists (to move to top)
      const filtered = prev.filter(p => p.id !== playlist.id);
      
      const newRecent = [
        { ...playlist, usedAt: new Date().toISOString() },
        ...filtered
      ].slice(0, MAX_RECENT);
      
      saveRecent(newRecent);
      return newRecent;
    });
  }, [saveRecent]);

  // Clear recent
  const clearRecent = useCallback(() => {
    saveRecent([]);
  }, [saveRecent]);

  return {
    favorites,
    recent,
    isLoaded,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    addRecent,
    clearRecent
  };
}

// Playlist Item Component
const PlaylistItem = memo(function PlaylistItem({ 
  playlist, 
  onSelect, 
  isFavorite, 
  onToggleFavorite,
  showFavoriteButton = true
}) {
  const { lightImpact } = useHaptics();

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-all group">
      <button
        onClick={() => {
          lightImpact();
          onSelect(playlist.id, playlist.name, playlist.image, playlist.owner);
        }}
        className="flex-1 flex items-center gap-3 text-left"
      >
        {playlist.image ? (
          <img 
            src={playlist.image} 
            alt="" 
            className="w-12 h-12 rounded-lg object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center">
            <Music className="w-5 h-5 text-slate-500" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium text-white truncate">{playlist.name}</p>
          {playlist.owner && (
            <p className="text-xs text-slate-400 truncate">von {playlist.owner}</p>
          )}
        </div>
      </button>
      
      {showFavoriteButton && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            lightImpact();
            onToggleFavorite(playlist);
          }}
          className={`p-2 rounded-lg transition-all btn-press ${
            isFavorite 
              ? 'text-pink-400 bg-pink-500/20' 
              : 'text-slate-500 hover:text-pink-400 hover:bg-slate-700'
          }`}
          aria-label={isFavorite ? 'Von Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
        >
          <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      )}
    </div>
  );
});

// Saved Playlists Section Component
const SavedPlaylistsSection = memo(function SavedPlaylistsSection({ 
  onSelect 
}) {
  const { 
    favorites, 
    recent, 
    isLoaded, 
    isFavorite, 
    toggleFavorite, 
    clearRecent 
  } = useSavedPlaylists();
  const { lightImpact } = useHaptics();

  if (!isLoaded) return null;
  if (favorites.length === 0 && recent.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Favorites */}
      {favorites.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-slate-300">Favoriten</span>
          </div>
          <div className="space-y-2">
            {favorites.map(playlist => (
              <PlaylistItem
                key={playlist.id}
                playlist={playlist}
                onSelect={onSelect}
                isFavorite={true}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent */}
      {recent.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-300">Zuletzt verwendet</span>
            </div>
            <button
              onClick={() => {
                lightImpact();
                clearRecent();
              }}
              className="text-xs text-slate-500 hover:text-slate-400 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Löschen
            </button>
          </div>
          <div className="space-y-2">
            {recent.map(playlist => (
              <PlaylistItem
                key={playlist.id}
                playlist={playlist}
                onSelect={onSelect}
                isFavorite={isFavorite(playlist.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export { SavedPlaylistsSection, PlaylistItem };
export default SavedPlaylistsSection;
