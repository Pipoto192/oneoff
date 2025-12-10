'use client';
import { useState, useRef, useCallback, memo } from 'react';
import { Share2, Download, X, Instagram, Copy, Check } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/components/Toast';
import useHaptics from '@/hooks/useHaptics';

// Generate result image as canvas
const generateResultImage = async (resultData) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Set canvas size (Instagram story ratio)
  canvas.width = 1080;
  canvas.height = 1920;
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#1e1b4b');
  gradient.addColorStop(0.5, '#581c87');
  gradient.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add pattern overlay
  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  for (let i = 0; i < canvas.height; i += 40) {
    ctx.fillRect(0, i, canvas.width, 1);
  }
  
  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 80px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🎵 OneOff', canvas.width / 2, 200);
  
  // Result emoji and text
  const isWin = resultData.imposterCaught;
  const resultEmoji = isWin ? '🎉' : '😈';
  const resultText = isWin ? 'Imposter gefasst!' : 'Imposter gewinnt!';
  
  ctx.font = '150px system-ui';
  ctx.fillText(resultEmoji, canvas.width / 2, 450);
  
  ctx.font = 'bold 60px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = isWin ? '#22c55e' : '#ef4444';
  ctx.fillText(resultText, canvas.width / 2, 560);
  
  // Imposter info
  ctx.fillStyle = '#ffffff';
  ctx.font = '36px system-ui, -apple-system, sans-serif';
  ctx.fillText('Der Imposter war:', canvas.width / 2, 700);
  
  ctx.font = 'bold 50px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#f472b6';
  const imposterNames = resultData.imposters?.map(i => i.name).join(', ') || resultData.imposter?.name || 'Unbekannt';
  ctx.fillText(imposterNames, canvas.width / 2, 770);
  
  // Songs section
  ctx.fillStyle = '#ffffff';
  ctx.font = '32px system-ui, -apple-system, sans-serif';
  ctx.fillText('🎧 Songs', canvas.width / 2, 900);
  
  // Normal song box
  ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
  ctx.lineWidth = 3;
  roundRect(ctx, 100, 950, canvas.width - 200, 150, 20);
  ctx.fill();
  ctx.stroke();
  
  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 28px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText('Normaler Song', 130, 1000);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px system-ui';
  const normalSong = resultData.songs?.common?.title || 'Unknown';
  ctx.fillText(normalSong.substring(0, 25), 130, 1050);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '28px system-ui';
  ctx.fillText(resultData.songs?.common?.artist || '', 130, 1085);
  
  // Imposter song box
  ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
  ctx.textAlign = 'center';
  roundRect(ctx, 100, 1130, canvas.width - 200, 150, 20);
  ctx.fill();
  ctx.stroke();
  
  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 28px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText('Imposter Song', 130, 1180);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px system-ui';
  const imposterSong = resultData.songs?.imposter?.title || 'Unknown';
  ctx.fillText(imposterSong.substring(0, 25), 130, 1230);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '28px system-ui';
  ctx.fillText(resultData.songs?.imposter?.artist || '', 130, 1265);
  
  // Stats if available
  if (resultData.playerStats) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px system-ui';
    ctx.fillText('Meine Stats', canvas.width / 2, 1400);
    
    ctx.font = '28px system-ui';
    ctx.fillStyle = '#a78bfa';
    ctx.fillText(`🏆 ${resultData.playerStats.gamesWon} Siege`, canvas.width / 2, 1450);
    ctx.fillText(`🎮 ${resultData.playerStats.gamesPlayed} Spiele`, canvas.width / 2, 1490);
    ctx.fillText(`🔥 ${resultData.playerStats.bestStreak} beste Serie`, canvas.width / 2, 1530);
  }
  
  // Footer
  ctx.fillStyle = '#64748b';
  ctx.font = '28px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('Spiel jetzt OneOff!', canvas.width / 2, 1750);
  ctx.fillText('oneoff.app', canvas.width / 2, 1790);
  
  return canvas.toDataURL('image/png');
};

// Helper function for rounded rectangles
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Share Result Modal
const ShareResultModal = memo(function ShareResultModal({ isOpen, onClose, resultData, playerStats }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();
  const { lightImpact, success } = useHaptics();

  const generateImage = useCallback(async () => {
    setIsGenerating(true);
    try {
      const url = await generateResultImage({ ...resultData, playerStats });
      setImageUrl(url);
    } catch (e) {
      console.error('Failed to generate image:', e);
      showToast('Fehler beim Erstellen des Bildes', 'error');
    }
    setIsGenerating(false);
  }, [resultData, playerStats, showToast]);

  const handleShare = useCallback(async () => {
    lightImpact();
    
    if (!imageUrl) {
      await generateImage();
    }

    const shareText = `🎵 OneOff Ergebnis!\n${resultData.imposterCaught ? '🎉 Imposter gefasst!' : '😈 Imposter gewinnt!'}\n\nSpiel jetzt: oneoff.app`;

    if (navigator.share && Capacitor.isNativePlatform()) {
      try {
        // Convert base64 to blob for sharing
        const response = await fetch(imageUrl || '');
        const blob = await response.blob();
        const file = new File([blob], 'oneoff-result.png', { type: 'image/png' });

        await navigator.share({
          text: shareText,
          files: [file]
        });
        success();
      } catch (e) {
        // Fallback to text share
        try {
          await navigator.share({ text: shareText });
        } catch (e2) {
          // User cancelled
        }
      }
    } else if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch (e) {
        // User cancelled
      }
    } else {
      // Fallback: copy to clipboard
      handleCopyText();
    }
  }, [imageUrl, resultData, generateImage, lightImpact, success]);

  const handleDownload = useCallback(async () => {
    lightImpact();
    
    if (!imageUrl) {
      await generateImage();
    }

    if (imageUrl) {
      const link = document.createElement('a');
      link.download = 'oneoff-result.png';
      link.href = imageUrl;
      link.click();
      success();
      showToast('Bild heruntergeladen!', 'success');
    }
  }, [imageUrl, generateImage, lightImpact, success, showToast]);

  const handleCopyText = useCallback(() => {
    const text = `🎵 OneOff Ergebnis!\n${resultData.imposterCaught ? '🎉 Imposter gefasst!' : '😈 Imposter gewinnt!'}\nImposter: ${resultData.imposters?.map(i => i.name).join(', ') || resultData.imposter?.name}\n\nSpiel jetzt: oneoff.app`;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    success();
    showToast('Text kopiert!', 'success');
    setTimeout(() => setCopied(false), 2000);
  }, [resultData, success, showToast]);

  // Generate image when modal opens
  useState(() => {
    if (isOpen && !imageUrl) {
      generateImage();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md safe-area-top safe-area-bottom">
      <div className="glass rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-slide-up border border-purple-500/20">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Share2 className="w-6 h-6 text-purple-400" />
            Ergebnis teilen
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-2 hover:bg-slate-700 rounded-full transition-all btn-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview */}
        <div className="mb-5 rounded-2xl overflow-hidden bg-slate-800/50 aspect-[9/16] max-h-64 flex items-center justify-center">
          {isGenerating ? (
            <div className="text-slate-400 text-sm">Erstelle Bild...</div>
          ) : imageUrl ? (
            <img src={imageUrl} alt="Result" className="w-full h-full object-contain" />
          ) : (
            <div className="text-slate-400 text-sm">Vorschau wird geladen...</div>
          )}
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleShare}
            className="py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 btn-press"
          >
            <Share2 className="w-5 h-5" />
            Teilen
          </button>
          
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="py-4 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 btn-press"
          >
            <Download className="w-5 h-5" />
            Speichern
          </button>
        </div>

        <button
          onClick={handleCopyText}
          className="mt-3 w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all flex items-center justify-center gap-2 btn-press text-sm"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Kopiert!' : 'Text kopieren'}
        </button>
      </div>
    </div>
  );
});

export default ShareResultModal;
