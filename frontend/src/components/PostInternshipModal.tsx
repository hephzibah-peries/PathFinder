import { useState, useEffect } from 'react';
import { internshipApi, Internship } from '../services/api';
import { useAuth } from '../context/AuthContext';

export interface PostInternshipModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (newInternship: Internship) => void;
  initialData?: Partial<Internship> | null;
  mode?: 'create' | 'edit';
}

export default function PostInternshipModal({
  open,
  onClose,
  onCreated,
  initialData,
  mode = 'create',
}: PostInternshipModalProps) {
  const { token } = useAuth();
  const [step, setStep] = useState(1);
  const [closing, setClosing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State - Step 1
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('3 Months');
  const [workMode, setWorkMode] = useState('Hybrid');
  const [location, setLocation] = useState('Colombo, Sri Lanka');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');

  // Form State - Step 2
  const [requiredSkills, setRequiredSkills] = useState<string[]>(['Java', 'Spring Boot']);
  const [preferredSkills, setPreferredSkills] = useState<string[]>(['Docker', 'PostgreSQL']);
  const [newReqSkill, setNewReqSkill] = useState('');
  const [newPrefSkill, setNewPrefSkill] = useState('');
  const [minGpa, setMinGpa] = useState('');
  const [experience, setExperience] = useState('');

  useEffect(() => {
    if (open) {
      setClosing(false);
      setMounted(true);
      setStep(1);
      setError(null);
      setLoading(false);

      if (initialData) {
        setTitle(initialData.title || '');
        setWorkMode(initialData.workMode || 'Hybrid');
        setLocation(initialData.location || (initialData.workMode === 'Remote' ? 'Remote' : 'Colombo, Sri Lanka'));
        setDeadline(initialData.deadline || '');
        setDescription(initialData.description || '');

        // Extract duration from requirements if present
        if (initialData.requirements?.includes('6 Months')) {
          setDuration('6 Months');
        } else if (initialData.requirements?.includes('1 Year')) {
          setDuration('1 Year');
        } else {
          setDuration('3 Months');
        }

        // Parse skills
        if (initialData.skills) {
          const parsed = initialData.skills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          if (parsed.length > 2) {
            setRequiredSkills(parsed.slice(0, Math.ceil(parsed.length * 0.6)));
            setPreferredSkills(parsed.slice(Math.ceil(parsed.length * 0.6)));
          } else if (parsed.length > 0) {
            setRequiredSkills(parsed);
            setPreferredSkills([]);
          }
        }

        // Extract experience/requirements
        if (initialData.requirements) {
          setExperience(initialData.requirements);
        }
      } else {
        resetForm();
      }
    }
  }, [open, initialData]);

  function resetForm() {
    setTitle('');
    setDuration('3 Months');
    setWorkMode('Hybrid');
    setLocation('Colombo, Sri Lanka');
    setDeadline('');
    setDescription('');
    setRequiredSkills(['Java', 'Spring Boot']);
    setPreferredSkills(['Docker', 'PostgreSQL']);
    setMinGpa('');
    setExperience('');
    setError(null);
  }

  function handleClose() {
    setClosing(true);
    setTimeout(() => {
      setMounted(false);
      resetForm();
      onClose();
    }, 180);
  }

  function handleAddReqSkill(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && newReqSkill.trim()) {
      e.preventDefault();
      if (!requiredSkills.includes(newReqSkill.trim())) {
        setRequiredSkills([...requiredSkills, newReqSkill.trim()]);
      }
      setNewReqSkill('');
    }
  }

  function handleRemoveReqSkill(skill: string) {
    setRequiredSkills(requiredSkills.filter((s) => s !== skill));
  }

  function handleAddPrefSkill(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && newPrefSkill.trim()) {
      e.preventDefault();
      if (!preferredSkills.includes(newPrefSkill.trim())) {
        setPreferredSkills([...preferredSkills, newPrefSkill.trim()]);
      }
      setNewPrefSkill('');
    }
  }

  function handleRemovePrefSkill(skill: string) {
    setPreferredSkills(preferredSkills.filter((s) => s !== skill));
  }

  function handleNextStep() {
    if (!title.trim()) {
      setError('Please provide an internship title.');
      return;
    }
    setError(null);
    setStep(2);
  }

  async function handleSubmit() {
    if (!title.trim()) {
      setStep(1);
      setError('Please provide an internship title.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Aggregate skills into comma-separated string
      const allSkills = [...requiredSkills, ...preferredSkills]
        .map((s) => s.trim())
        .filter(Boolean);
      const skillsStr = allSkills.length > 0 ? allSkills.join(', ') : 'Software Engineering';

      // Aggregate requirements
      const reqList: string[] = [];
      if (minGpa.trim()) {
        const parsed = parseFloat(minGpa.trim());
        if (!isNaN(parsed)) {
          reqList.push(`Minimum GPA: ${parsed}`);
        } else {
          reqList.push(`Minimum GPA: ${minGpa.trim()}`);
        }
      }
      if (duration) {
        reqList.push(`Duration: ${duration}`);
      }
      if (experience.trim()) {
        reqList.push(experience.trim());
      }
      const requirementsStr = reqList.join('. ');

      const desc = description.trim()
        ? description.trim()
        : `${title} (${duration}) - ${workMode} opportunity at ${location}. ${experience ? experience.trim() : ''}`;

      // Default deadline to 30 days ahead if not specified
      const finalDeadline = deadline.trim()
        ? deadline.trim()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const payload: Partial<Internship> = {
        title: title.trim(),
        description: desc,
        location: location.trim() || (workMode === 'Remote' ? 'Remote' : 'Colombo, Sri Lanka'),
        workMode,
        requirements: requirementsStr,
        skills: skillsStr,
        stipend: '',
        deadline: finalDeadline,
      };

      const created = await internshipApi.create(payload, token || undefined);

      if (onCreated) {
        onCreated(created);
      }

      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to post internship. Please verify your company session and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop */}
      <div className={`modal-overlay ${closing ? 'modal-overlay-closing' : ''}`} onClick={handleClose} />

      {/* Modal Panel */}
      <div className={`modal-panel ${closing ? 'modal-panel-closing' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5D5CE] bg-[#FAF6F4] px-7 py-5">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#2B1B17]">
              {mode === 'edit' ? 'Edit Internship Position' : 'Post New Internship'}
            </h2>
            <div className="mt-1.5 flex items-center gap-2 text-xs">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-bold ${
                  step === 1 ? 'bg-[#FDF2ED] text-[#7A4B43] border border-[#E5D5CE]' : 'text-[#7A6A65]'
                }`}
              >
                Step 1: Role Overview
              </span>
              <span className="text-[#7A6A65]">&rarr;</span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-bold ${
                  step === 2 ? 'bg-[#FDF2ED] text-[#7A4B43] border border-[#E5D5CE]' : 'text-[#7A6A65]'
                }`}
              >
                Step 2: Technical Skills & Criteria
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-[#7A6A65] hover:bg-[#F2E8E4] hover:text-[#2B1B17] transition-colors"
            disabled={loading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mx-7 mt-5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900">
            {error}
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-7 py-6">
          {step === 1 ? (
            <div className="space-y-5">
              <div>
                <label className="form-label">
                  Internship Title <span className="text-[#7A4B43]">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Software Engineer, Financial Analyst, Mechanical Engineer, Marketing Intern"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">
                    Work Mode <span className="text-[#7A4B43]">*</span>
                  </label>
                  <select className="form-select" value={workMode} onChange={(e) => setWorkMode(e.target.value)}>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">
                    Duration <span className="text-[#7A4B43]">*</span>
                  </label>
                  <select className="form-select" value={duration} onChange={(e) => setDuration(e.target.value)}>
                    <option value="3 Months">3 Months</option>
                    <option value="6 Months">6 Months</option>
                    <option value="1 Year">1 Year</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="form-label">Location</label>
                    {location.trim() && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.trim())}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-[#7A4B43] hover:underline inline-flex items-center gap-0.5"
                        title="Preview this location on Google Maps"
                      >
                        Preview on Google Maps ↗
                      </a>
                    )}
                  </div>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Colombo, Sri Lanka or office address"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Application Deadline</label>
                  <input
                    type="date"
                    className="form-input"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Role Overview & Responsibilities</label>
                <textarea
                  className="form-input min-h-[90px] resize-y"
                  placeholder="Briefly describe what the intern will be doing, projects involved, and mentoring support..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="form-label">
                  Required Skills & Competencies <span className="text-[#7A4B43]">*</span>
                </label>
                <p className="text-xs text-[#7A6A65] mb-2 font-medium">Type a skill name and press Enter to append.</p>
                <div className="rounded-xl border border-[#E5D5CE] bg-[#FAF6F4] p-3.5 flex flex-wrap gap-2">
                  {requiredSkills.map((skill) => (
                    <span key={skill} className="skill-tag skill-tag-have text-sm">
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveReqSkill(skill)}
                        className="ml-1.5 text-emerald-900 hover:text-emerald-950 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    className="flex-1 min-w-[140px] bg-transparent outline-none text-sm text-[#2B1B17] placeholder-[#9C8E89]"
                    placeholder="Add skill (e.g. Financial Modeling, AutoCAD, Python)..."
                    value={newReqSkill}
                    onChange={(e) => setNewReqSkill(e.target.value)}
                    onKeyDown={handleAddReqSkill}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">
                  Preferred / Nice-to-Have Skills <span className="text-[#7A6A65]">(Optional)</span>
                </label>
                <div className="rounded-xl border border-[#E5D5CE] bg-[#FAF6F4] p-3.5 flex flex-wrap gap-2">
                  {preferredSkills.map((skill) => (
                    <span key={skill} className="skill-tag text-sm">
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemovePrefSkill(skill)}
                        className="ml-1.5 text-[#7A6A65] hover:text-[#2B1B17] font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    className="flex-1 min-w-[140px] bg-transparent outline-none text-sm text-[#2B1B17] placeholder-[#9C8E89]"
                    placeholder="Add skill (e.g. SQL, PowerBI, Clinical Research)..."
                    value={newPrefSkill}
                    onChange={(e) => setNewPrefSkill(e.target.value)}
                    onKeyDown={handleAddPrefSkill}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">
                  Min. Academic GPA <span className="text-[#7A6A65]">(Optional)</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  className="form-input"
                  placeholder="e.g. 3.0 or 3.25"
                  value={minGpa}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      setMinGpa(val);
                    }
                  }}
                />
              </div>

              <div>
                <label className="form-label">Prerequisites & Coursework</label>
                <textarea
                  className="form-input min-h-[80px] resize-y"
                  placeholder="Describe any specific academic coursework or project experience expected..."
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-[#E5D5CE] bg-[#FAF6F4] px-7 py-4">
          <button
            type="button"
            onClick={step === 2 ? () => setStep(1) : handleClose}
            className="btn btn-ghost px-5 py-2.5 text-sm"
            disabled={loading}
          >
            {step === 2 ? '← Back to Details' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={step === 1 ? handleNextStep : handleSubmit}
            className="btn btn-primary px-6 py-2.5 text-sm font-semibold"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving Role...
              </span>
            ) : step === 1 ? (
              'Next: Candidate Requirements →'
            ) : mode === 'edit' ? (
              'Save Internship Changes'
            ) : (
              'Confirm & Publish Internship'
            )}
          </button>
        </div>
      </div>
    </>
  );
}
