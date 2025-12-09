'use client';
import { memo, useState } from 'react';
import { X, Copy, Share2, Check, QrCode } from 'lucide-react';
import useHaptics from '@/hooks/useHaptics';

/**
 * Share Modal for room code sharing
 */
const ShareModal = memo(function ShareModal({ isOpen, onClose, roomId }) {
  const [copied, setCopied] = useState(false);
  const { success } = useHaptics();

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      success();
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'OneOff Spiel',
          text: `Tritt meinem OneOff Spiel bei! Code: ${roomId}`,
        });
        success();
      } catch (e) {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md safe-area-top safe-area-bottom">
      <div className="glass rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-slide-up gpu-accelerate border border-purple-500/20">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Share2 className="w-6 h-6 text-purple-400" />
            Freunde einladen
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-2 hover:bg-slate-700 rounded-full transition-all btn-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-slate-300 text-sm text-center">
            Teile diesen Code mit deinen Freunden, damit sie beitreten können.
          </p>

          {/* Large Code Display */}
          <div className="py-6 px-4 bg-slate-900 rounded-2xl text-center border border-slate-700">
            <p className="text-4xl font-mono font-black tracking-[0.4em] text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              {roomId}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className={`flex-1 py-4 rounded-2xl font-bold transition-all btn-press flex items-center justify-center gap-2 ${
                copied 
                  ? 'bg-green-600 text-white' 
                  : 'bg-slate-700 hover:bg-slate-600 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  Kopiert!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Kopieren
                </>
              )}
            </button>
            
            {typeof navigator !== 'undefined' && navigator.share && (
              <button
                onClick={handleShare}
                className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-2xl transition-all btn-press flex items-center justify-center gap-2"
              >
                <Share2 className="w-5 h-5" />
                Teilen
              </button>
            )}
          </div>

          <p className="text-xs text-slate-500 text-center pt-2">
            Deine Freunde können den Code auf der Startseite eingeben.
          </p>
        </div>
      </div>
    </div>
  );
});

export default ShareModal;
