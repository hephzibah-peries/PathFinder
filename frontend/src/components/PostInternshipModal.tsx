import { useState, useEffect } from 'react';
import { internshipApi, Internship } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface PostInternshipModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (newInternship: Internship) => void;
}

export default function PostInternshipModal({ open, onClose, onCreated }: PostInternshipModalProps) {
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
  const [stipend, setStipend] = useState('');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');

  // Form State - Step 2
  const [requiredSkills, setRequiredSkills] = useState<string[]>(['Java', 'Spring Boot']);
  const [preferredSkills, setPreferredSkills] = useState<string[]>(['Docker', 'PostgreSQL']);
  const [newReqSkill, setNewReqSkill] = useState('');
  const [newPrefSkill, setNewPrefSkill] = useState('');
  const [minGpa, setMinGpa] = useState('');
  const [academicYear, setAcademicYear] = useState<string[]>(['Final Year']);
  const [experience, setExperience] = useState('');

  useEffect(() => {
    if (open) {
      setClosing(false);
      setMounted(true);
      setStep(1);
      setError(null);
      setLoading(false);
    }
  }, [open]);

  function resetForm() {
    setTitle('');
    setDuration('3 Months');
    setWorkMode('Hybrid');
    setLocation('Colombo, Sri Lanka');
    setStipend('');
    setDeadline('');
    setDescription('');
    setRequiredSkills(['Java', 'Spring Boot']);
    setPreferredSkills(['Docker', 'PostgreSQL']);
    setMinGpa('');
    setAcademicYear(['Final Year']);
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
    setRequiredSkills(requiredSkills.filter(s => s !== skill));
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
    setPreferredSkills(preferredSkills.filter(s => s !== skill));
  }

  function toggleAcademicYear(year: string) {
    if (academicYear.includes(year)) {
      setAcademicYear(academicYear.filter(y => y !== year));
    } else {
      setAcademicYear([...academicYear, year]);
    }
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
      if (academicYear.length > 0) {
        reqList.push(`Academic Level: ${academicYear.join(', ')}`);
      }
      if (minGpa.trim()) {
        reqList.push(`Minimum GPA: ${minGpa}`);
      }
      if (duration) {
        reqList.push(`Duration: ${duration}`);
      }
      if (experience.trim()) {
        reqList.push(experience.trim());
      }
      const requirementsStr = reqList.join('. ');

      // Build description
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
        stipend: stipend.trim() || 'Competitive',
        deadline: finalDeadline,
      };

      // Ensure active user's JWT token is passed in Authorization header
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
        <div className="flex items-center justify-between border-b border-sand-line px-7 py-5">
          <div>
            <h2 className="m-0 font-serif text-[20px]">Post New Internship</h2>
            <p className="mt-1 text-[12.5px] text-ink-soft">
              Step {step} of 2: {step === 1 ? 'Basic Details' : 'Candidate Requirements'}
            </p>
          </div>
          <button onClick={handleClose} className="text-ink-soft hover:text-ink" disabled={loading}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mx-7 mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {error}
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-7 py-6">
          {step === 1 ? (
            <div className="space-y-5">
              <div>
                <label className="form-label">Internship Title <span className="text-error">*</span></label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Backend Developer Intern"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="form-label">Work Mode <span className="text-error">*</span></label>
                  <select className="form-select" value={workMode} onChange={(e) => setWorkMode(e.target.value)}>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Duration <span className="text-error">*</span></label>
                  <select className="form-select" value={duration} onChange={(e) => setDuration(e.target.value)}>
                    <option value="3 Months">3 Months</option>
                    <option value="6 Months">6 Months</option>
                    <option value="1 Year">1 Year</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="form-label">Location</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Colombo, Sri Lanka"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Stipend / Compensation</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. LKR 40,000 / month"
                    value={stipend}
                    onChange={(e) => setStipend(e.target.value)}
                  />
                </div>
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

              <div>
                <label className="form-label">Role Overview / Description</label>
                <textarea 
                  className="form-input min-h-[90px] resize-y" 
                  placeholder="Briefly describe what the intern will be doing and the team they will join..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="form-label">Required Skills <span className="text-error">*</span></label>
                <p className="form-hint mb-2">Type a skill and press Enter to add.</p>
                <div className="form-tags-input">
                  {requiredSkills.map(skill => (
                    <span key={skill} className="form-tag">
                      {skill}
                      <button type="button" onClick={() => handleRemoveReqSkill(skill)} className="ml-0.5 text-ink-soft hover:text-ink">&times;</button>
                    </span>
                  ))}
                  <input 
                    type="text" 
                    className="flex-1 min-w-[120px] bg-transparent outline-none text-[13px]" 
                    placeholder="Add required skill (e.g. Java)..."
                    value={newReqSkill}
                    onChange={(e) => setNewReqSkill(e.target.value)}
                    onKeyDown={handleAddReqSkill}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Preferred Skills <span className="font-normal text-ink-soft">(Optional)</span></label>
                <div className="form-tags-input">
                  {preferredSkills.map(skill => (
                    <span key={skill} className="form-tag">
                      {skill}
                      <button type="button" onClick={() => handleRemovePrefSkill(skill)} className="ml-0.5 text-ink-soft hover:text-ink">&times;</button>
                    </span>
                  ))}
                  <input 
                    type="text" 
                    className="flex-1 min-w-[120px] bg-transparent outline-none text-[13px]" 
                    placeholder="Add preferred skill (e.g. Docker)..."
                    value={newPrefSkill}
                    onChange={(e) => setNewPrefSkill(e.target.value)}
                    onKeyDown={handleAddPrefSkill}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="form-label">Min. GPA <span className="font-normal text-ink-soft">(Optional)</span></label>
                  <input 
                    type="number" 
                    step="0.1"
                    className="form-input" 
                    placeholder="e.g. 3.0"
                    value={minGpa}
                    onChange={(e) => setMinGpa(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Target Academic Level</label>
                  <div className="mt-2 space-y-2">
                    {['3rd Year', 'Final Year', 'Graduated'].map(year => (
                      <label key={year} className="flex items-center gap-2 text-[13px] cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={academicYear.includes(year)}
                          onChange={() => toggleAcademicYear(year)}
                        /> 
                        {year}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="form-label">Experience / Requirements Details</label>
                <textarea 
                  className="form-input min-h-[80px] resize-y" 
                  placeholder="Describe any coursework, projects, or prerequisites expected from candidates..."
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-sand-line bg-sand/30 px-7 py-4">
          <button 
            type="button"
            onClick={step === 2 ? () => setStep(1) : handleClose}
            className="btn btn-ghost"
            disabled={loading}
          >
            {step === 2 ? 'Back' : 'Cancel'}
          </button>
          
          <button 
            type="button"
            onClick={step === 1 ? handleNextStep : handleSubmit}
            className="btn btn-signal"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Posting Internship...
              </span>
            ) : step === 1 ? (
              'Next: Requirements'
            ) : (
              'Post Internship'
            )}
          </button>
        </div>
      </div>
    </>
  );
}