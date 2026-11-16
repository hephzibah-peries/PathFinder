import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';

export interface TourStep {
  targetSelector: string;
  titleEn: string;
  titleTa: string;
  descriptionEn: string;
  descriptionTa: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    targetSelector: '[data-tour="tour-cv-upload"]',
    titleEn: 'Step 1: Upload Your CV / Resume',
    titleTa: 'படி 1: இங்கு உங்கள் CV-ஐ பதிவேற்றவும்',
    descriptionEn: 'Start your journey here! Upload your resume in PDF or Word format. Our NLP engine automatically extracts your verified technical skills into your profile.',
    descriptionTa: 'முதலில் உங்கள் ரெஸ்யூமை பதிவேற்றுங்கள்! எங்கள் AI உங்கள் தொழில்நுட்பத் திறன்களை தானாகவே படித்து சுயவிவரத்தில் சேர்க்கும்.',
    position: 'bottom',
  },
  {
    targetSelector: '[data-tour="tour-readiness"]',
    titleEn: 'Step 2: Check Your Profile Readiness Score',
    titleTa: 'படி 2: உங்கள் தயார்நிலை சதவீதத்தைப் பார்க்கவும்',
    descriptionEn: 'View your real-time traffic-light readiness score. Green means 100% ready to apply, while yellow highlights the exact 1 skill gap to close.',
    descriptionTa: 'நிறுவனங்களின் தேவைக்கு ஏற்ப உங்கள் தகுதி நிலையை வண்ணக் குறியீட்டுடன் உடனுக்குடன் இங்கே அறிந்து கொள்ளுங்கள்.',
    position: 'bottom',
  },
  {
    targetSelector: '[data-tour="tour-mock-interview"]',
    titleEn: 'Step 3: Practice with AI Mock Interview',
    titleTa: 'படி 3: AI நேர்காணல் பயிற்சியைத் தொடங்கவும்',
    descriptionEn: 'Simulate high-stakes technical & behavioral interview rounds. Use your microphone for real-time speech-to-text dictation and receive instant AI feedback with model answers.',
    descriptionTa: 'நேர்காணல் கேள்விகளுக்கு குரல் அல்லது தட்டச்சு மூலம் பதிலளித்து உடனடி AI மதிப்பீட்டையும் சிறந்த மாதிரி பதில்களையும் பெறுங்கள்.',
    position: 'bottom',
  },
];

const TOUR_STORAGE_KEY = 'pathfinder_tour_completed';

interface GuidedTourProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export default function GuidedTour({ forceOpen = false, onClose }: GuidedTourProps) {
  const { lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Initialize: run on first visit if not completed, or if forceOpen is true
  useEffect(() => {
    if (forceOpen) {
      setCurrentStep(0);
      setIsOpen(true);
      return;
    }
    const hasSeen = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!hasSeen) {
      // Small timeout to allow the DOM to render
      const timer = setTimeout(() => {
        setCurrentStep(0);
        setIsOpen(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [forceOpen]);

  // Update target rect on step change or resize/scroll
  const updateTargetPosition = useCallback(() => {
    if (!isOpen) return;
    const stepConfig = TOUR_STEPS[currentStep];
    if (!stepConfig) return;

    const el = document.querySelector(stepConfig.targetSelector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [isOpen, currentStep]);

  useEffect(() => {
    updateTargetPosition();
    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition);
    return () => {
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition);
    };
  }, [updateTargetPosition]);

  // Handle keyboard events (ESC to close, Left/Right arrow keys)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handleBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep]);

  const handleNext = () => {
    if (currentStep + 1 < TOUR_STEPS.length) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setIsOpen(false);
    onClose?.();
  };

  const handleDismiss = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setIsOpen(false);
    onClose?.();
  };

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const title = lang === 'ta' ? step.titleTa : step.titleEn;
  const description = lang === 'ta' ? step.descriptionTa : step.descriptionEn;

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto animate-fade-in" aria-live="polite">
      {/* ── Dark Backdrop with Spotlight Cutout ── */}
      <svg className="absolute inset-0 h-full w-full pointer-events-none transition-all duration-300">
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="16"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(43, 27, 23, 0.72)"
          mask="url(#tour-mask)"
        />
      </svg>

      {/* Spotlight Ring Border */}
      {targetRect && (
        <div
          className="fixed pointer-events-none rounded-2xl border-3 border-[#C8A84B] shadow-[0_0_25px_rgba(200,168,75,0.8)] transition-all duration-300 z-51"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      )}

      {/* ── Guided Step Card ── */}
      <div
        className="fixed z-52 transition-all duration-300 max-w-sm sm:max-w-md w-[calc(100vw-32px)]"
        style={{
          top: targetRect
            ? Math.min(window.innerHeight - 320, Math.max(20, targetRect.bottom + 16))
            : '50%',
          left: targetRect
            ? Math.min(window.innerWidth - 400, Math.max(16, targetRect.left))
            : '50%',
          transform: !targetRect ? 'translate(-50%, -50%)' : undefined,
        }}
      >
        <div className="card rounded-2xl border-2 border-[#C8A84B] bg-[#2B1B17] text-[#FAF6F4] p-6 shadow-2xl space-y-4">
          {/* Header & Step Counter */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="inline-flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-[#C8A84B] animate-ping" />
              <span className="font-serif font-bold text-xs uppercase tracking-widest text-[#C8A84B]">
                {lang === 'ta' ? 'வழிகாட்டி சுற்றுலா' : 'Interactive Walkthrough'}
              </span>
            </div>
            <span className="text-xs font-bold text-[#E5D5CE] bg-white/10 px-2.5 py-0.5 rounded-full">
              {currentStep + 1} / {TOUR_STEPS.length}
            </span>
          </div>

          {/* Title & Description */}
          <div className="space-y-1.5">
            <h3 className="font-serif text-lg font-bold text-white tracking-tight">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-[#E5D5CE] leading-relaxed">
              {description}
            </p>
          </div>

          {/* Step Progress Indicators */}
          <div className="flex items-center gap-1.5 pt-1">
            {TOUR_STEPS.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? 'w-6 bg-[#C8A84B]'
                    : idx < currentStep
                    ? 'w-2 bg-[#7A4B43]'
                    : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* Buttons Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={handleDismiss}
              className="text-xs font-semibold text-[#E5D5CE]/70 hover:text-white transition-colors"
            >
              {lang === 'ta' ? 'தவிர்க்க' : 'Skip Tour'}
            </button>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="rounded-xl border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition-all"
                >
                  {lang === 'ta' ? '← முந்தையது' : '← Back'}
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                className="rounded-xl bg-[#C8A84B] px-4 py-1.5 text-xs font-bold text-[#2B1B17] hover:bg-[#d6b75a] shadow-md transition-all active:scale-95"
              >
                {currentStep + 1 === TOUR_STEPS.length
                  ? lang === 'ta' ? 'முடிந்தது ✓' : 'Finish ✓'
                  : lang === 'ta' ? 'அடுத்தது →' : 'Next →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
