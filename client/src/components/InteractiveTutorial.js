'use client';
import { useState, useEffect, memo } from 'react';
import { Music, Users, Headphones, Vote, Trophy, X, ChevronRight, ChevronLeft } from 'lucide-react';
import useHaptics from '@/hooks/useHaptics';

const tutorialSteps = [
  {
    id: 1,
    icon: Users,
    title: 'Lobby erstellen',
    description: 'Erstelle eine Lobby oder tritt mit einem Code einer bei. Teile den Code mit deinen Freunden!',
    color: 'purple',
    animation: 'bounce'
  },
  {
    id: 2,
    icon: Music,
    title: 'Playlist wählen',
    description: 'Der Host wählt eine Spotify-Playlist. Je bekannter die Songs, desto lustiger das Spiel!',
    color: 'green',
    animation: 'pulse'
  },
  {
    id: 3,
    icon: Headphones,
    title: 'Musik hören',
    description: 'Alle hören denselben Song... außer dem Imposter! Der hört etwas komplett anderes.',
    color: 'pink',
    animation: 'wave'
  },
  {
    id: 4,
    icon: Vote,
    title: 'Abstimmen',
    description: 'Beobachte die anderen! Wer tanzt nicht im Takt? Wer kennt den Song nicht? Vote für den Imposter!',
    color: 'orange',
    animation: 'shake'
  },
  {
    id: 5,
    icon: Trophy,
    title: 'Gewinnen',
    description: 'Findet den Imposter → Normalspieler gewinnen! Imposter überlebt → Imposter gewinnt!',
    color: 'yellow',
    animation: 'celebrate'
  }
];

const AnimatedIcon = memo(function AnimatedIcon({ step, isActive }) {
  const Icon = step.icon;
  const colorClasses = {
    purple: 'from-purple-500 to-purple-700',
    green: 'from-green-500 to-green-700',
    pink: 'from-pink-500 to-pink-700',
    orange: 'from-orange-500 to-orange-700',
    yellow: 'from-yellow-500 to-yellow-700'
  };

  const animationClasses = {
    bounce: 'animate-bounce',
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    shake: 'animate-shake',
    celebrate: 'animate-celebrate'
  };

  return (
    <div className={`
      relative p-6 rounded-3xl bg-gradient-to-br ${colorClasses[step.color]} 
      shadow-2xl transform transition-all duration-500
      ${isActive ? 'scale-110 ' + animationClasses[step.animation] : 'scale-90 opacity-50'}
    `}>
      <Icon className="w-16 h-16 text-white" />
      
      {/* Glow effect */}
      {isActive && (
        <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${colorClasses[step.color]} blur-xl opacity-50 -z-10`} />
      )}
      
      {/* Sparkles */}
      {isActive && step.animation === 'celebrate' && (
        <>
          <div className="absolute -top-2 -right-2 w-3 h-3 bg-yellow-300 rounded-full animate-ping" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping" style={{ animationDelay: '0.3s' }} />
          <div className="absolute top-1/2 -right-3 w-2 h-2 bg-orange-300 rounded-full animate-ping" style={{ animationDelay: '0.6s' }} />
        </>
      )}
    </div>
  );
});

const ProgressDots = memo(function ProgressDots({ currentStep, totalSteps, onSelect }) {
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={`
            transition-all duration-300 rounded-full
            ${i === currentStep 
              ? 'w-8 h-3 bg-purple-500' 
              : 'w-3 h-3 bg-slate-600 hover:bg-slate-500'
            }
          `}
          aria-label={`Schritt ${i + 1}`}
        />
      ))}
    </div>
  );
});

const InteractiveTutorial = memo(function InteractiveTutorial({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const { lightImpact, success } = useHaptics();

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
      lightImpact();
    } else {
      handleClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
      lightImpact();
    }
  };

  const handleClose = () => {
    localStorage.setItem('hasSeenTutorial', 'true');
    success();
    onClose();
  };

  const goToStep = (index) => {
    setDirection(index > currentStep ? 1 : -1);
    setCurrentStep(index);
    lightImpact();
  };

  if (!isOpen) return null;

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg safe-area-top safe-area-bottom">
      <div className="relative w-full max-w-md">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute -top-12 right-0 text-slate-400 hover:text-white p-2 hover:bg-slate-700/50 rounded-full transition-all z-10"
          aria-label="Überspringen"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Card */}
        <div className="glass rounded-3xl p-8 shadow-2xl border border-purple-500/20 overflow-hidden">
          {/* Step counter */}
          <div className="text-center text-slate-400 text-sm mb-6">
            Schritt {currentStep + 1} von {tutorialSteps.length}
          </div>

          {/* Icon Animation */}
          <div className="flex justify-center mb-8">
            <AnimatedIcon step={step} isActive={true} />
          </div>

          {/* Content */}
          <div 
            className={`text-center transition-all duration-300 transform ${
              direction === 1 ? 'animate-slide-left' : 'animate-slide-right'
            }`}
            key={step.id}
          >
            <h2 className="text-2xl font-black text-white mb-3">
              {step.title}
            </h2>
            <p className="text-slate-300 leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Progress Dots */}
          <ProgressDots 
            currentStep={currentStep} 
            totalSteps={tutorialSteps.length}
            onSelect={goToStep}
          />

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 btn-press"
              >
                <ChevronLeft className="w-5 h-5" />
                Zurück
              </button>
            )}
            
            <button
              onClick={nextStep}
              className={`flex-1 py-4 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 btn-press ${
                isLastStep
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
              } text-white`}
            >
              {isLastStep ? (
                <>
                  Los geht's! 🎮
                </>
              ) : (
                <>
                  Weiter
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default InteractiveTutorial;
