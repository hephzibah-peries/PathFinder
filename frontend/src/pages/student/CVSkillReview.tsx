import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SkillSourceBadge } from '../../components/ui';
import { resumeApi, studentApi } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { JargonTooltip } from '../../components/JargonTooltip';

export interface ParsedSkill {
  id: string;
  name: string;
  category: string;
  confidence: number;
  state: 'pending' | 'confirmed' | 'removed';
}

function confidenceLabel(pct: number, lang: 'en' | 'ta'): string {
  if (pct >= 90) return lang === 'ta' ? 'மிக உயர்ந்த நம்பகத்தன்மை' : 'Very high confidence';
  if (pct >= 75) return lang === 'ta' ? 'உயர் நம்பகத்தன்மை' : 'High confidence';
  if (pct >= 60) return lang === 'ta' ? 'மிதமான நம்பகத்தன்மை' : 'Moderate confidence';
  return lang === 'ta' ? 'குறைந்த நம்பகத்தன்மை' : 'Low confidence';
}

function confidenceColor(pct: number): string {
  if (pct >= 90) return '#2D6A4F';
  if (pct >= 75) return '#2D6A4F';
  if (pct >= 60) return '#7A4B43';
  return '#B3392F';
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function CVSkillReview() {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [skills, setSkills] = useState<ParsedSkill[]>([]);
  const [existingSkills, setExistingSkills] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [parsingStep, setParsingStep] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load existing profile skills
  useEffect(() => {
    async function loadExistingSkills() {
      try {
        const profile = await studentApi.getProfile();
        if (profile?.skills) {
          const loaded = profile.skills.split(',').map((s) => s.trim()).filter(Boolean);
          setExistingSkills(loaded);
          // If no resume uploaded yet, display existing skills as confirmed
          if (loaded.length > 0) {
            setSkills(
              loaded.map((name, idx) => ({
                id: `existing-${idx}`,
                name,
                category: lang === 'ta' ? 'சுயவிவர திறன்' : 'Profile Skill',
                confidence: 95,
                state: 'confirmed',
              }))
            );
          }
        }
      } catch {
        // Ignored if profile not created yet
      }
    }
    loadExistingSkills();
  }, [lang]);

  // Simulated parsing progress ticker during analyzing
  useEffect(() => {
    let interval: any;
    if (analyzing) {
      setParsingStep(1);
      interval = setInterval(() => {
        setParsingStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 700);
    } else {
      setParsingStep(0);
    }
    return () => clearInterval(interval);
  }, [analyzing]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(
        lang === 'ta'
          ? 'கோப்பு அளவு 5MB க்கும் குறைவாக இருக்க வேண்டும்.'
          : 'File size must be less than 5MB.'
      );
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);
      setSuccessMsg(null);
      setFileName(file.name);
      setFileSize(formatBytes(file.size));

      const result = await resumeApi.analyze(file);
      const extracted = result.extractedSkills || [];

      if (extracted.length === 0) {
        setError(
          lang === 'ta'
            ? 'இந்த ஆவணத்தில் எந்த தொழில்நுட்பத் திறன்களும் கண்டறியப்படவில்லை. மற்றொரு CV-ஐப் பதிவேற்றவும்.'
            : 'No technical skills were identified in this document. You can still confirm your existing skills or try another CV format.'
        );
        return;
      }

      // Merge newly extracted skills with state
      const newSkills: ParsedSkill[] = extracted.map((name, idx) => ({
        id: `extracted-${Date.now()}-${idx}`,
        name,
        category: lang === 'ta' ? 'CV-லிருந்து பிரித்தெடுக்கப்பட்டது' : 'Extracted from Resume',
        confidence: 90,
        state: existingSkills.includes(name) ? 'confirmed' : 'pending',
      }));

      // Combine keeping unique by name
      setSkills((prev) => {
        const existingNames = new Set(prev.map((s) => s.name.toLowerCase()));
        const uniqueNew = newSkills.filter((s) => !existingNames.has(s.name.toLowerCase()));
        return [...uniqueNew, ...prev];
      });

      setSuccessMsg(
        lang === 'ta'
          ? `வெற்றிகரமாக ${extracted.length} திறன்கள் உங்கள் CV-லிருந்து கண்டறியப்பட்டன!`
          : `Successfully extracted ${extracted.length} skills from your resume!`
      );
    } catch (err: any) {
      setError(
        err.message ||
          (lang === 'ta'
            ? 'CV ஆவணத்தைப் பகுப்பாய்வு செய்வதில் பிழை ஏற்பட்டது. தயவுசெய்து PDF அல்லது DOCX கோப்பைப் பயன்படுத்தவும்.'
            : 'Failed to analyze resume file. Please ensure it is a valid PDF or DOCX file.')
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const confirm = (id: string) => {
    setSkills((prev) => prev.map((s) => (s.id === id ? { ...s, state: 'confirmed' } : s)));
  };

  const remove = (id: string) => {
    setSkills((prev) => prev.map((s) => (s.id === id ? { ...s, state: 'removed' } : s)));
  };

  const restore = (id: string) => {
    setSkills((prev) => prev.map((s) => (s.id === id ? { ...s, state: 'pending' } : s)));
  };

  const confirmAll = () => {
    setSkills((prev) => prev.map((s) => (s.state === 'pending' ? { ...s, state: 'confirmed' } : s)));
  };

  const pending = skills.filter((s) => s.state === 'pending');
  const confirmed = skills.filter((s) => s.state === 'confirmed');
  const removed = skills.filter((s) => s.state === 'removed');

  const handleSave = async () => {
    if (confirmed.length === 0) return;

    try {
      setSaving(true);
      setError(null);

      // Join confirmed skills by comma
      const skillsCsv = confirmed.map((s) => s.name.trim()).join(', ');

      await studentApi.updateProfile({ skills: skillsCsv });

      setSaved(true);
      setTimeout(() => {
        navigate('/student');
      }, 1500);
    } catch (err: any) {
      setError(
        err.message ||
          (lang === 'ta'
            ? 'சுயவிவரத்தில் திறன்களைச் சேமிக்க முடியவில்லை.'
            : 'Failed to save confirmed skills to profile.')
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[880px]">
      {/* ── Page Header ── */}
      <div className="mb-6">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#E5D5CE] bg-[#FAF6F4] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#7A6A65]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          {lang === 'ta' ? 'CV திறன் பகுப்பாய்வு' : 'CV Skill Parsing'}
        </div>
        <h1 className="mb-1.5 font-serif text-3xl text-[#2B1B17] font-bold">
          {lang === 'ta'
            ? 'உங்கள் CV-லிருந்து திறன்களை பிரித்தெடுத்து உறுதிப்படுத்தவும்'
            : 'Extract & Verify Skills from Your CV'}
        </h1>
        <p className="m-0 text-base text-[#7A6A65] leading-relaxed">
          {lang === 'ta'
            ? 'உங்கள் ரெஸ்யூமை (PDF/DOCX) இங்கே பதிவேற்றவும். எங்கள் Apache Tika NLP இயந்திரம் உங்கள் திறன்களை உடனடியாகப் பகுப்பாய்வு செய்து சுயவிவரத்தில் சேர்க்கும்.'
            : 'Upload your resume in PDF or DOCX format. Our Apache Tika NLP engine will automatically scan and extract your technical skills into your profile.'}
        </p>
      </div>

      {/* ── Direct Drag-and-Drop Resume Box ── */}
      <div
        id="cv-dropzone"
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`card relative mb-6 border-2 border-dashed transition-all duration-300 p-8 text-center cursor-pointer select-none ${
          isDragging
            ? 'border-[#C8A84B] bg-[#FDF2ED] ring-4 ring-[#C8A84B]/25 scale-[1.01] shadow-lg'
            : 'border-[#E5D5CE] bg-[#FAF6F4]/60 hover:border-[#C8A84B]/80 hover:bg-[#FAF6F4] shadow-xs'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Cloud Upload Icon */}
        <div
          className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border transition-transform duration-300 ${
            isDragging
              ? 'scale-110 bg-[#C8A84B] text-white border-[#C8A84B] shadow-md animate-bounce'
              : 'bg-[#FDF2ED] border-[#E5D5CE] text-[#7A4B43]'
          }`}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>

        {/* Drag/Drop Title & Instructions */}
        <h3 className="font-serif text-xl font-bold text-[#2B1B17] mb-1.5">
          {isDragging
            ? t('dropActive', 'Drop your resume file here to start scanning!')
            : fileName
            ? `${fileName} ${fileSize ? `(${fileSize})` : ''}`
            : t('dragDropTitle', 'Drag & Drop your CV / Resume here')}
        </h3>

        <p className="text-sm text-[#7A6A65] mb-4 max-w-md mx-auto">
          {isDragging
            ? lang === 'ta'
              ? 'கோப்பை விடுங்கள், தானாகவே பதிவேற்றம் தொடங்கும்!'
              : 'Release the file now to begin instant NLP scanning!'
            : t('dragDropSubtitle', 'Supports PDF, Word (.docx), and TXT documents up to 5MB')}
        </p>

        {/* Action Button inside dropzone */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            disabled={analyzing}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="btn btn-primary px-7 py-3 text-sm font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50"
          >
            {analyzing
              ? lang === 'ta'
                ? 'AI ஆய்வு செய்கிறது...'
                : 'Scanning Resume with NLP...'
              : fileName
              ? lang === 'ta'
                ? 'வேறு கோப்பைத் தேர்ந்தெடுக்கவும்'
                : 'Upload Different File'
              : t('browseFiles', 'or Browse Files from Device')}
          </button>
        </div>

        {/* Instant NLP Parsing Progress Indicator */}
        {analyzing && (
          <div className="mt-6 rounded-2xl border border-[#C8A84B]/40 bg-[#FAF6F4] p-4 text-left shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#7A4B43]">
                <span className="h-2 w-2 rounded-full bg-[#C8A84B] animate-ping" />
                {lang === 'ta' ? 'அதிவேக AI பகுப்பாய்வு' : 'Real-time NLP Skill Extractor'}
              </span>
              <span className="text-xs font-bold text-[#7A4B43]">
                {parsingStep === 1 && '35%'}
                {parsingStep === 2 && '70%'}
                {parsingStep >= 3 && '95%'}
              </span>
            </div>

            {/* Visual Step Timeline */}
            <div className="space-y-1.5 text-xs">
              <div className={`flex items-center gap-2 ${parsingStep >= 1 ? 'text-[#2D6A4F] font-bold' : 'text-[#7A6A65]'}`}>
                <span>{parsingStep >= 1 ? '✓' : '○'}</span>
                <span>
                  {lang === 'ta'
                    ? '1. Apache Tika மூலம் ஆவண வரிகளைப் படித்தல்'
                    : '1. Reading document text with Apache Tika'}
                </span>
              </div>
              <div className={`flex items-center gap-2 ${parsingStep >= 2 ? 'text-[#2D6A4F] font-bold' : 'text-[#7A6A65]'}`}>
                <span>{parsingStep >= 2 ? '✓' : '○'}</span>
                <span>
                  {lang === 'ta'
                    ? '2. தொழில்நுட்பத் திறன்களைப் பிரித்தெடுத்தல்'
                    : '2. Extracting technical skill entities'}
                </span>
              </div>
              <div className={`flex items-center gap-2 ${parsingStep >= 3 ? 'text-[#2D6A4F] font-bold' : 'text-[#7A6A65]'}`}>
                <span>{parsingStep >= 3 ? '✓' : '○'}</span>
                <span>
                  {lang === 'ta'
                    ? '3. தகுதி மதிப்பெண்களைக் கணக்கிடுதல்'
                    : '3. Benchmarking skill confidence scores'}
                </span>
              </div>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#E5D5CE]">
              <div
                className="h-full bg-linear-to-r from-[#7A4B43] via-[#C8A84B] to-[#2D6A4F] transition-all duration-500 rounded-full"
                style={{
                  width: parsingStep === 1 ? '35%' : parsingStep === 2 ? '70%' : '95%',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Success Notification */}
      {successMsg && !analyzing && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900 shadow-xs">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-700 shrink-0">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <div className="flex-1">{successMsg}</div>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="mb-6 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm font-semibold text-rose-900 shadow-xs">
          {error}
        </div>
      )}

      {/* ── Progress Summary Strip ── */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          {
            label: lang === 'ta' ? 'மதிப்பாய்வு தேவை' : 'Pending review',
            value: pending.length,
            textClass: 'text-[#7A4B43]',
            bgClass: 'border-[#E5D5CE] bg-[#FDF2ED]',
          },
          {
            label: lang === 'ta' ? 'உறுதி செய்யப்பட்டது' : 'Confirmed',
            value: confirmed.length,
            textClass: 'text-[#2D6A4F]',
            bgClass: 'border-emerald-300 bg-emerald-50',
          },
          {
            label: lang === 'ta' ? 'விலக்கப்பட்டது' : 'Excluded',
            value: removed.length,
            textClass: 'text-[#B3392F]',
            bgClass: 'border-rose-300 bg-rose-50',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`flex items-center gap-3.5 rounded-2xl border px-4 py-3.5 ${stat.bgClass}`}
          >
            <span className={`font-serif text-3xl font-bold leading-none ${stat.textClass}`}>
              {stat.value}
            </span>
            <span className={`text-xs font-bold uppercase tracking-wider ${stat.textClass}`}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* ── Pending skills ── */}
      {pending.length > 0 && (
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="m-0 font-serif text-xl font-bold text-[#2B1B17]">
              {lang === 'ta' ? 'மதிப்பாய்வுக்கான திறன்கள்' : 'Pending Review'}
              <span className="ml-2 font-sans text-sm font-normal text-[#7A6A65]">
                ({pending.length} {lang === 'ta' ? 'திறன்(கள்)' : `skill${pending.length !== 1 ? 's' : ''}`})
              </span>
            </h2>
            <button
              onClick={confirmAll}
              className="btn btn-ghost py-2 text-sm font-semibold"
            >
              {lang === 'ta' ? 'அனைத்தையும் உறுதி செய்' : 'Confirm all'}
            </button>
          </div>
          <div className="space-y-2.5">
            {pending.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                lang={lang}
                onConfirm={() => confirm(skill.id)}
                onRemove={() => remove(skill.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Confirmed skills ── */}
      {confirmed.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 font-serif text-xl font-bold text-[#2B1B17]">
            {lang === 'ta' ? 'உறுதி செய்யப்பட்ட சுயவிவரத் திறன்கள்' : 'Confirmed Profile Skills'}
            <span className="ml-2 font-sans text-sm font-normal text-[#7A6A65]">
              ({confirmed.length} {lang === 'ta' ? 'திறன்(கள்)' : `skill${confirmed.length !== 1 ? 's' : ''}`})
            </span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {confirmed.map((skill) => (
              <span
                key={skill.id}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2D6A4F]/10 border border-[#2D6A4F]/30 px-3.5 py-2 text-sm font-semibold text-[#2D6A4F]"
              >
                <JargonTooltip term={skill.name}>{skill.name}</JargonTooltip>
                <SkillSourceBadge source="self" />
                <button
                  onClick={() => restore(skill.id)}
                  className="ml-1 text-[#2D6A4F]/70 hover:text-[#2D6A4F]"
                  title={lang === 'ta' ? 'மீண்டும் மதிப்பாய்வுக்கு மாற்று' : 'Move back to pending'}
                  aria-label={`Undo confirm ${skill.name}`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 .49-4.59" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── Excluded skills ── */}
      {removed.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 font-serif text-xl font-bold text-[#2B1B17]">
            {lang === 'ta' ? 'விலக்கப்பட்ட திறன்கள்' : 'Excluded Skills'}
            <span className="ml-2 font-sans text-sm font-normal text-[#7A6A65]">
              ({removed.length})
            </span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {removed.map((skill) => (
              <span
                key={skill.id}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2 text-sm font-semibold text-rose-900 line-through"
              >
                <JargonTooltip term={skill.name}>{skill.name}</JargonTooltip>
                <button
                  onClick={() => restore(skill.id)}
                  className="ml-1 text-rose-700 hover:text-rose-950 no-underline"
                  title={lang === 'ta' ? 'மீட்டெடு' : 'Restore skill'}
                  aria-label={`Restore ${skill.name}`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 .49-4.59" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── Footer CTA ── */}
      <div className="sticky bottom-0 -mx-6 border-t border-[#E5D5CE] bg-white/95 px-6 py-4 backdrop-blur-md z-10">
        <div className="flex items-center justify-between">
          <p className="m-0 text-sm text-[#7A6A65]">
            {confirmed.length === 0
              ? lang === 'ta'
                ? 'குறைந்தது ஒரு திறனை உறுதி செய்யவும் அல்லது புதிய CV-ஐப் பதிவேற்றவும்.'
                : 'Confirm at least one skill or upload a CV to save to your profile.'
              : lang === 'ta'
              ? `${confirmed.length} திறன்கள் உங்கள் சுயவிவரத்தில் நேரடியாகச் சேமிக்கப்படும்.`
              : `${confirmed.length} skill${confirmed.length !== 1 ? 's' : ''} will be saved directly to your PostgreSQL profile.`}
          </p>
          <button
            id="cv-review-save"
            disabled={confirmed.length === 0 || saving || saved}
            onClick={handleSave}
            className={`btn btn-primary px-7 py-3 text-sm font-semibold transition-all ${
              confirmed.length === 0 ? 'cursor-not-allowed opacity-40' : ''
            } ${saved ? 'opacity-80' : ''}`}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {lang === 'ta' ? 'சேமிக்கப்படுகிறது...' : 'Saving...'}
              </span>
            ) : saved ? (
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {lang === 'ta' ? 'சுயவிவரத்தில் சேமிக்கப்பட்டது!' : 'Saved to Profile!'}
              </span>
            ) : (
              lang === 'ta' ? 'சுயவிவரத்தில் சேமிக்கவும்' : 'Save to my profile'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-component: individual skill card with JargonTooltip ── */
function SkillCard({
  skill,
  lang,
  onConfirm,
  onRemove,
}: {
  skill: ParsedSkill;
  lang: 'en' | 'ta';
  onConfirm: () => void;
  onRemove: () => void;
}) {
  const color = confidenceColor(skill.confidence);
  const label = confidenceLabel(skill.confidence, lang);

  return (
    <div className="card flex items-center gap-4 py-3.5 hover:border-[#C8A84B]/40 transition-colors">
      {/* Confidence ring */}
      <div className="relative flex-shrink-0">
        <svg width="52" height="52" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r="20" fill="none" stroke="#E5D5CE" strokeWidth="5" />
          <circle
            cx="26"
            cy="26"
            r="20"
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeDasharray={2 * Math.PI * 20}
            strokeDashoffset={2 * Math.PI * 20 * (1 - skill.confidence / 100)}
            strokeLinecap="round"
            transform="rotate(-90 26 26)"
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center font-sans text-xs font-bold"
          style={{ color }}
        >
          {skill.confidence}%
        </span>
      </div>

      {/* Info with JargonTooltip */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-[#2B1B17]">
            <JargonTooltip term={skill.name}>{skill.name}</JargonTooltip>
          </span>
          <span className="text-xs text-[#7A6A65] font-medium">{skill.category}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-[#E5D5CE]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${skill.confidence}%`, backgroundColor: color }}
            />
          </div>
          <span className="text-xs font-semibold" style={{ color }}>{label}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <button
          id={`skill-remove-${skill.id}`}
          onClick={onRemove}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#7A6A65] transition-colors hover:bg-rose-50 hover:text-rose-700"
          title={lang === 'ta' ? 'திறனை நீக்கு' : 'Remove skill'}
          aria-label={`Remove ${skill.name}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
          </svg>
        </button>
        <button
          id={`skill-confirm-${skill.id}`}
          onClick={onConfirm}
          className="btn btn-signal px-5 py-2 text-sm font-semibold"
        >
          {lang === 'ta' ? 'உறுதி செய்' : 'Confirm'}
        </button>
      </div>
    </div>
  );
}
