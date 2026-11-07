import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SkillSourceBadge } from '../../components/ui';
import { resumeApi, studentApi } from '../../services/api';

export interface ParsedSkill {
  id: string;
  name: string;
  category: string;
  confidence: number;
  state: 'pending' | 'confirmed' | 'removed';
}

function confidenceLabel(pct: number): string {
  if (pct >= 90) return 'Very high confidence';
  if (pct >= 75) return 'High confidence';
  if (pct >= 60) return 'Moderate confidence';
  return 'Low confidence';
}

function confidenceColor(pct: number): string {
  if (pct >= 90) return '#2F6F4F';
  if (pct >= 75) return '#3A7D5F';
  if (pct >= 60) return '#B7791F';
  return '#B23A3A';
}

export default function CVSkillReview() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [skills, setSkills] = useState<ParsedSkill[]>([]);
  const [existingSkills, setExistingSkills] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
                category: 'Profile Skill',
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
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    try {
      setAnalyzing(true);
      setError(null);
      setFileName(file.name);

      const result = await resumeApi.analyze(file);
      const extracted = result.extractedSkills || [];

      if (extracted.length === 0) {
        setError('No technical skills were identified in this document. You can still confirm your existing skills or try another CV format.');
        return;
      }

      // Merge newly extracted skills with state
      const newSkills: ParsedSkill[] = extracted.map((name, idx) => ({
        id: `extracted-${Date.now()}-${idx}`,
        name,
        category: 'Extracted from Resume',
        confidence: 90,
        state: existingSkills.includes(name) ? 'confirmed' : 'pending',
      }));

      // Combine keeping unique by name
      setSkills((prev) => {
        const existingNames = new Set(prev.map((s) => s.name.toLowerCase()));
        const uniqueNew = newSkills.filter((s) => !existingNames.has(s.name.toLowerCase()));
        return [...uniqueNew, ...prev];
      });
    } catch (err: any) {
      setError(err.message || 'Failed to analyze resume file. Please ensure it is a valid PDF or DOCX file.');
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

  const pending = skills.filter((s) => s.state === 'pending');
  const confirmed = skills.filter((s) => s.state === 'confirmed');
  const removed = skills.filter((s) => s.state === 'removed');

  function confirm(id: string) {
    setSkills((prev) => prev.map((s) => (s.id === id ? { ...s, state: 'confirmed' } : s)));
  }

  function remove(id: string) {
    setSkills((prev) => prev.map((s) => (s.id === id ? { ...s, state: 'removed' } : s)));
  }

  function restore(id: string) {
    setSkills((prev) => prev.map((s) => (s.id === id ? { ...s, state: 'pending' } : s)));
  }

  function confirmAll() {
    setSkills((prev) => prev.map((s) => (s.state === 'pending' ? { ...s, state: 'confirmed' } : s)));
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);

      // Collect confirmed skill names
      const confirmedNames = confirmed.map((s) => s.name.trim()).filter(Boolean);
      const allConfirmed = Array.from(new Set([...existingSkills, ...confirmedNames]));
      const skillsPayload = allConfirmed.join(', ');

      await studentApi.updateProfile({ skills: skillsPayload });

      setSaved(true);
      setTimeout(() => navigate('/student'), 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to save skills to profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[760px]">
      {/* ── Page header ── */}
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-widest text-ink-soft">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          CV Skill Parsing
        </div>
        <h1 className="mb-1 font-serif text-[26px]">Extract & Verify Skills from Your CV</h1>
        <p className="m-0 text-[14px] text-ink-soft">
          Upload your resume in PDF or DOCX format. Our Apache Tika NLP engine will automatically scan and extract your technical skills into your profile.
        </p>
      </div>

      {/* ── File Upload Box ── */}
      <div className="card mb-6 border-dashed border-2 border-sand-line bg-sand/10 p-6 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-signal-soft text-signal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>

        <h3 className="font-serif text-[16px] font-bold text-ink mb-1">
          {fileName ? `Uploaded: ${fileName}` : 'Choose a CV / Resume File'}
        </h3>
        <p className="text-xs text-ink-soft mb-4">Supported formats: PDF, DOCX, DOC, TXT (up to 5MB)</p>

        <button
          type="button"
          disabled={analyzing}
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-signal px-5 py-2 text-xs font-semibold disabled:opacity-50"
        >
          {analyzing ? 'Scanning Resume with NLP...' : fileName ? 'Upload Different File' : 'Browse & Upload Resume'}
        </button>

        {analyzing && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-signal font-medium animate-pulse">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-signal border-t-transparent" />
            Extracting skills using Apache Tika...
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-3.5 text-xs text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {/* ── Progress summary strip ── */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { label: 'Pending review', value: pending.length, color: '#B7791F', bg: '#F5EBDA' },
          { label: 'Confirmed', value: confirmed.length, color: '#2F6F4F', bg: '#E4EDE6' },
          { label: 'Removed', value: removed.length, color: '#B23A3A', bg: '#F5E3E1' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-[12px] border border-sand-line px-4 py-3"
            style={{ backgroundColor: stat.bg }}
          >
            <span
              className="font-serif text-[26px] font-bold leading-none"
              style={{ color: stat.color }}
            >
              {stat.value}
            </span>
            <span className="text-[12.5px] font-medium" style={{ color: stat.color }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* ── Pending skills ── */}
      {pending.length > 0 && (
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="m-0 font-serif text-[17px]">
              Pending Review
              <span className="ml-2 font-sans text-[13px] font-normal text-ink-soft">
                ({pending.length} skill{pending.length !== 1 ? 's' : ''})
              </span>
            </h2>
            <button
              onClick={confirmAll}
              className="btn btn-ghost py-2 text-[12.5px]"
            >
              Confirm all
            </button>
          </div>
          <div className="space-y-2.5">
            {pending.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
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
          <h2 className="mb-3 font-serif text-[17px]">
            Confirmed Profile Skills
            <span className="ml-2 font-sans text-[13px] font-normal text-ink-soft">
              ({confirmed.length} skill{confirmed.length !== 1 ? 's' : ''})
            </span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {confirmed.map((skill) => (
              <span
                key={skill.id}
                className="inline-flex items-center gap-1.5 rounded-lg bg-signal-soft px-3 py-1.5 text-[13px] font-medium text-signal"
              >
                {skill.name}
                <SkillSourceBadge source="self" />
                <button
                  onClick={() => restore(skill.id)}
                  className="ml-1 text-signal/60 hover:text-signal"
                  title="Move back to pending"
                  aria-label={`Undo confirm ${skill.name}`}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 .49-4.59" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── Removed skills ── */}
      {removed.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 font-serif text-[17px]">
            Excluded Skills
            <span className="ml-2 font-sans text-[13px] font-normal text-ink-soft">
              ({removed.length})
            </span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {removed.map((skill) => (
              <span
                key={skill.id}
                className="inline-flex items-center gap-1.5 rounded-lg bg-error-soft/60 px-3 py-1.5 text-[13px] font-medium text-error/70 line-through"
              >
                {skill.name}
                <button
                  onClick={() => restore(skill.id)}
                  className="ml-1 text-error/50 no-underline hover:text-error"
                  title="Restore skill"
                  aria-label={`Restore ${skill.name}`}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
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
      <div className="sticky bottom-0 -mx-6 border-t border-sand-line bg-paper/95 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <p className="m-0 text-[12.5px] text-ink-soft">
            {confirmed.length === 0
              ? 'Confirm at least one skill or upload a CV to save to your profile.'
              : `${confirmed.length} skill${confirmed.length !== 1 ? 's' : ''} will be saved directly to your PostgreSQL profile.`}
          </p>
          <button
            id="cv-review-save"
            disabled={confirmed.length === 0 || saving || saved}
            onClick={handleSave}
            className={`btn btn-signal px-6 transition-all ${
              confirmed.length === 0 ? 'cursor-not-allowed opacity-40' : ''
            } ${saved ? 'opacity-80' : ''}`}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </span>
            ) : saved ? (
              <span className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Saved to Profile!
              </span>
            ) : (
              'Save to my profile'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-component: individual skill card ─────────────────── */
function SkillCard({
  skill,
  onConfirm,
  onRemove,
}: {
  skill: ParsedSkill;
  onConfirm: () => void;
  onRemove: () => void;
}) {
  const color = confidenceColor(skill.confidence);
  const label = confidenceLabel(skill.confidence);

  return (
    <div className="card flex items-center gap-4 py-3.5">
      {/* Confidence ring */}
      <div className="relative flex-shrink-0">
        <svg width="48" height="48" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="18" fill="none" stroke="#EFE9DD" strokeWidth="5" />
          <circle
            cx="24"
            cy="24"
            r="18"
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeDasharray={2 * Math.PI * 18}
            strokeDashoffset={2 * Math.PI * 18 * (1 - skill.confidence / 100)}
            strokeLinecap="round"
            transform="rotate(-90 24 24)"
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center font-sans text-[11px] font-bold"
          style={{ color }}
        >
          {skill.confidence}%
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-[14.5px] font-semibold text-ink">{skill.name}</span>
          <span className="text-[11.5px] text-ink-soft">{skill.category}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-[5px] w-24 overflow-hidden rounded-full bg-sand">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${skill.confidence}%`, backgroundColor: color }}
            />
          </div>
          <span className="text-[11.5px]" style={{ color }}>{label}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          id={`skill-remove-${skill.id}`}
          onClick={onRemove}
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-error-soft hover:text-error"
          title="Remove skill"
          aria-label={`Remove ${skill.name}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
          </svg>
        </button>
        <button
          id={`skill-confirm-${skill.id}`}
          onClick={onConfirm}
          className="btn btn-signal px-4 py-2 text-[12.5px]"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
