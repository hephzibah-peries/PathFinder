import { useState, useEffect } from 'react';

interface PostInternshipModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PostInternshipModal({ open, onClose }: PostInternshipModalProps) {
  const [step, setStep] = useState(1);
  const [closing, setClosing] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Form State - Step 1
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('3 Months');
  const [workMode, setWorkMode] = useState('Hybrid');
  const [stipend, setStipend] = useState('');

  // Form State - Step 2
  const [requiredSkills, setRequiredSkills] = useState<string[]>(['Java', 'Spring Boot']);
  const [preferredSkills, setPreferredSkills] = useState<string[]>(['Docker']);
  const [newReqSkill, setNewReqSkill] = useState('');
  const [newPrefSkill, setNewPrefSkill] = useState('');
  const [minGpa, setMinGpa] = useState('');
  const [academicYear, setAcademicYear] = useState(['Final Year']);
  const [experience, setExperience] = useState('');

  useEffect(() => {
    if (open) {
      setClosing(false);
      setMounted(true);
      setStep(1); // Reset to step 1 on open
    }
  }, [open]);

  function handleClose() {
    setClosing(true);
    setTimeout(() => {
      setMounted(false);
      onClose();
    }, 180); // matches CSS animation duration
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

  function handleSubmit() {
    // Submit logic here
    handleClose();
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
          <button onClick={handleClose} className="text-ink-soft hover:text-ink">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

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
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="form-label">Duration <span className="text-error">*</span></label>
                  <select className="form-select" value={duration} onChange={(e) => setDuration(e.target.value)}>
                    <option>3 Months</option>
                    <option>6 Months</option>
                    <option>1 Year</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Work Mode <span className="text-error">*</span></label>
                  <select className="form-select" value={workMode} onChange={(e) => setWorkMode(e.target.value)}>
                    <option>On-site</option>
                    <option>Hybrid</option>
                    <option>Remote</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Stipend / Compensation <span className="font-normal text-ink-soft">(Optional)</span></label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. LKR 40,000 / month"
                  value={stipend}
                  onChange={(e) => setStipend(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="form-label">Required Skills <span className="text-error">*</span></label>
                <p className="form-hint mb-2">Press enter to add a skill.</p>
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
                    placeholder="Add required skill..."
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
                    placeholder="Add preferred skill..."
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
                  <label className="form-label">Academic Level</label>
                  <div className="mt-2 space-y-2">
                    {['3rd Year', 'Final Year', 'Graduated'].map(year => (
                      <label key={year} className="flex items-center gap-2 text-[13px]">
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
                <label className="form-label">Experience / Projects Expected</label>
                <textarea 
                  className="form-input min-h-[80px] resize-y" 
                  placeholder="Describe any relevant projects or prior experience expected..."
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
            onClick={step === 2 ? () => setStep(1) : handleClose}
            className="btn btn-ghost"
          >
            {step === 2 ? 'Back' : 'Cancel'}
          </button>
          
          <button 
            onClick={step === 1 ? () => setStep(2) : handleSubmit}
            className="btn btn-signal"
          >
            {step === 1 ? 'Next: Requirements' : 'Post Internship'}
          </button>
        </div>
      </div>
    </>
  );
}
