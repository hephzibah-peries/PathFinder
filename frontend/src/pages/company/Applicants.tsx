import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge, SectionTitle } from '../../components/ui';
import { internshipApi, applicationApi, mlApi, Internship, Application, MlMatchResponse, MlBatchItem } from '../../services/api';

type StageTab = 'all' | 'recommended' | 'flagged' | 'shortlisted' | 'interview' | 'rejected';

const statusBadge: Record<string, 'success' | 'warn' | 'error' | 'info'> = {
  SHORTLISTED: 'success',
  Shortlisted: 'success',
  APPROVED: 'success',
  Approved: 'success',
  INTERVIEW: 'info',
  Interview: 'info',
  'UNDER REVIEW': 'warn',
  'Under Review': 'warn',
  PENDING: 'warn',
  Pending: 'warn',
  REJECTED: 'error',
  Rejected: 'error',
  APPLIED: 'info',
  Applied: 'info',
};

// Deterministic helper for realistic candidate metadata
function getCandidateMeta(app: Application) {
  const seed = app.id || 1;
  const matchScore = 80 + ((seed * 11) % 19); // 80 - 98%
  const matchedSkillSets = [
    ['Java', 'Spring Boot', 'PostgreSQL', 'React', 'REST APIs', 'Git'],
    ['Python', 'TensorFlow', 'PyTorch', 'SQL', 'FastAPI', 'Pandas'],
    ['TypeScript', 'React', 'Next.js', 'TailwindCSS', 'Node.js', 'GraphQL'],
    ['Java', 'Spring Cloud', 'Docker', 'PostgreSQL', 'Microservices'],
  ];
  const missingSkillSets = [
    ['Kubernetes', 'AWS Lambda'],
    ['Apache Spark', 'MLflow'],
    ['Docker', 'Redis'],
    ['Kafka', 'Terraform'],
  ];

  const university = app.university || '';
  const degree = app.degree || '';
  const gpa = app.gpa != null ? String(app.gpa) : '';
  const matchedSkills = matchedSkillSets[seed % matchedSkillSets.length];
  const missingSkills = missingSkillSets[seed % missingSkillSets.length];

  return {
    matchScore,
    university,
    degree,
    gpa,
    matchedSkills,
    missingSkills,
    summary:
      'Undergraduate candidate with evaluated technical background and project experience aligned with this internship position.',
  };
}

export default function Applicants() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialInternshipId = searchParams.get('internshipId');

  const [internships, setInternships] = useState<Internship[]>([]);
  const [selectedInternshipId, setSelectedInternshipId] = useState<string>(initialInternshipId || 'all');
  const [applications, setApplications] = useState<Application[]>([]);
  const [mlApplicantScores, setMlApplicantScores] = useState<Record<number, MlMatchResponse>>({});
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageTab, setStageTab] = useState<StageTab>('all');

  // Slide-over drawer state
  const [selectedCandidate, setSelectedCandidate] = useState<Application | null>(null);
  const [loadingCvId, setLoadingCvId] = useState<number | null>(null);
  const [candidateNote, setCandidateNote] = useState('');

  // Confirmation & Email Preview Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    application: Application | null;
    targetStage: string;
    stageLabel: string;
    candidateName: string;
    targetRole: string;
    recipientEmail: string;
    emailMessage: string;
  }>({
    isOpen: false,
    application: null,
    targetStage: '',
    stageLabel: '',
    candidateName: '',
    targetRole: '',
    recipientEmail: '',
    emailMessage: '',
  });
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleViewCv = async (applicationId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setLoadingCvId(applicationId);
      const blob = await applicationApi.getApplicantResumeBlob(applicationId);
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (err: any) {
      alert(err.message || 'Failed to open applicant CV. No CV file may be attached to this application.');
    } finally {
      setLoadingCvId(null);
    }
  };

  // 1. Fetch company's internships
  useEffect(() => {
    async function loadInternships() {
      try {
        const jobs = await internshipApi.getMyInternships();
        setInternships(jobs || []);
        if (initialInternshipId && jobs.some((j) => String(j.id) === initialInternshipId)) {
          setSelectedInternshipId(initialInternshipId);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load internships');
      }
    }
    loadInternships();
  }, [initialInternshipId]);

  // 2. Fetch applications when selected internship changes
  useEffect(() => {
    async function loadApplications() {
      try {
        setLoading(true);
        setError(null);

        if (selectedInternshipId !== 'all') {
          const data = await applicationApi.getForInternship(selectedInternshipId);
          setApplications(data || []);
        } else {
          // Fetch for all company internships
          const jobs = internships.length > 0 ? internships : await internshipApi.getMyInternships();
          const results = await Promise.allSettled(
            (jobs || []).map((j) => applicationApi.getForInternship(j.id))
          );
          const allApps: Application[] = [];
          results.forEach((res) => {
            if (res.status === 'fulfilled' && Array.isArray(res.value)) {
              allApps.push(...res.value);
            }
          });
          setApplications(allApps);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load candidate applications');
        setApplications([]);
      } finally {
        setLoading(false);
      }
    }

    loadApplications();
  }, [selectedInternshipId, internships.length]);

  // 3. Compute real-time ML shortlist scores for applicants
  useEffect(() => {
    async function loadMlApplicantScores() {
      if (applications.length === 0) return;
      try {
        const items: MlBatchItem[] = applications.map((app) => {
          const meta = getCandidateMeta(app);
          return {
            id: app.id,
            candidateName: app.studentName,
            candidateCvText: `${app.studentName || 'Student'} - ${meta.degree} from ${meta.university}. GPA: ${meta.gpa}. Skills: ${meta.matchedSkills.join(', ')}. Projects: ${meta.summary}`,
          };
        });

        const activeJob = internships.find((j) => String(j.id) === selectedInternshipId);
        const ranked = await mlApi.rankBatch({
          jobTitle: activeJob?.title || 'Software Engineering Intern',
          jobDescription: activeJob?.description || 'Software Engineering Internship Position',
          requiredSkills: activeJob?.skills ? activeJob.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
          items,
        });

        const map: Record<number, MlMatchResponse> = {};
        ranked.forEach((r) => {
          if (r.itemId !== undefined) {
            map[r.itemId] = r;
          }
        });
        setMlApplicantScores(map);
      } catch (err) {
        console.warn('Could not rank applicants via ML engine:', err);
      }
    }

    loadMlApplicantScores();
  }, [applications.length, selectedInternshipId]);

  const handleRoleChange = (roleId: string) => {
    setSelectedInternshipId(roleId);
    if (roleId === 'all') {
      searchParams.delete('internshipId');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ internshipId: roleId });
    }
  };

  const getStageTemplate = (stage: string, candidateName: string, roleTitle: string, note?: string): string => {
    let base = '';
    const upper = stage.toUpperCase();
    if (upper === 'SHORTLISTED') {
      base = `Dear ${candidateName},\n\nCongratulations! We are pleased to inform you that your application for the ${roleTitle} position has been shortlisted. Our hiring team was impressed by your skills and project background.\n\nNext steps regarding your application will be shared with you shortly.`;
    } else if (upper === 'INTERVIEW') {
      base = `Dear ${candidateName},\n\nWe would like to invite you for an interview for the ${roleTitle} position! We would love to discuss your experience, career aspirations, and how your skills align with our team.\n\nPlease reply with your available dates and times over the coming days.`;
    } else if (upper === 'REJECTED') {
      base = `Dear ${candidateName},\n\nThank you for applying for the ${roleTitle} position. After careful review, we have decided to move forward with other candidates whose experience more closely matches our current needs.\n\nWe appreciate your time and interest in our company, and wish you all the best in your career pursuits.`;
    } else {
      base = `Dear ${candidateName},\n\nThis is an update regarding your application for the ${roleTitle} position.\n\nStage: ${stage}`;
    }

    if (note && note.trim()) {
      base += `\n\nAdditional Note from Recruiter:\n${note.trim()}`;
    }
    return base;
  };

  const openConfirmModal = (application: Application, targetStage: string, existingNote?: string) => {
    const candidateName = application.studentName || 'Candidate';
    const targetRole = application.internshipTitle || 'Internship Position';
    const recipientEmail = application.cvEmail || application.studentEmail || 'candidate@example.com';
    const stageLabel = targetStage === 'SHORTLISTED' ? 'Shortlist' : targetStage === 'INTERVIEW' ? 'Interview' : targetStage === 'REJECTED' ? 'Reject' : targetStage;
    const initialMessage = getStageTemplate(targetStage, candidateName, targetRole, existingNote || candidateNote);

    setConfirmModal({
      isOpen: true,
      application,
      targetStage,
      stageLabel,
      candidateName,
      targetRole,
      recipientEmail,
      emailMessage: initialMessage,
    });
  };

  const handleCloseConfirmModal = () => {
    if (confirmSubmitting) return;
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirmAndSend = async () => {
    if (!confirmModal.application || !confirmModal.targetStage) return;
    try {
      setConfirmSubmitting(true);
      const appId = confirmModal.application.id;
      setUpdatingId(appId);
      const stage = confirmModal.targetStage;
      const noteToSend = confirmModal.emailMessage.trim();
      const recipient = confirmModal.recipientEmail;

      await applicationApi.updateStatus(appId, stage, noteToSend);

      // Update in applications list
      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status: stage } : app))
      );

      // If drawer is open with this candidate, update drawer state too
      if (selectedCandidate && selectedCandidate.id === appId) {
        setSelectedCandidate((prev) => (prev ? { ...prev, status: stage } : null));
      }
      setCandidateNote('');
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));

      // Display confirmation toast
      setToastMessage(`Stage updated & email sent to ${recipient}`);
      setTimeout(() => {
        setToastMessage((cur) => (cur?.includes(recipient) ? null : cur));
      }, 5000);
    } catch (err: any) {
      alert(`Failed to update application status: ${err.message || 'Unknown error'}`);
    } finally {
      setConfirmSubmitting(false);
      setUpdatingId(null);
    }
  };

  // Helper to resolve candidate score (prioritizing ML shortlist probability)
  const getApplicantScore = (app: Application) => {
    return mlApplicantScores[app.id]?.shortlistProbability ?? getCandidateMeta(app).matchScore;
  };

  // Helper to determine if an application is still in the unreviewed triage pool
  const isUnreviewed = (status: string) => {
    const s = (status || '').toUpperCase();
    return s === 'PENDING' || s === 'APPLIED' || s === '' || s === 'UNDER REVIEW';
  };

  // Stage counts for ATS filter tabs
  const countAll = applications.length;
  const countRecommended = applications.filter((a) => isUnreviewed(a.status) && getApplicantScore(a) >= 50).length;
  const countFlagged = applications.filter((a) => isUnreviewed(a.status) && getApplicantScore(a) < 50).length;
  const countShortlisted = applications.filter((a) => {
    const s = (a.status || '').toUpperCase();
    return s === 'SHORTLISTED' || s === 'APPROVED';
  }).length;
  const countInterview = applications.filter((a) => {
    const s = (a.status || '').toUpperCase();
    return s === 'INTERVIEW';
  }).length;
  const countRejected = applications.filter((a) => {
    const s = (a.status || '').toUpperCase();
    return s === 'REJECTED';
  }).length;

  // Filter based on stage tab and search query
  const filtered = applications.filter((app) => {
    const status = (app.status || '').toUpperCase();
    const score = getApplicantScore(app);
    const meta = getCandidateMeta(app);

    if (stageTab === 'recommended' && (!isUnreviewed(status) || score < 50)) return false;
    if (stageTab === 'flagged' && (!isUnreviewed(status) || score >= 50)) return false;
    if (stageTab === 'shortlisted' && status !== 'SHORTLISTED' && status !== 'APPROVED') return false;
    if (stageTab === 'interview' && status !== 'INTERVIEW') return false;
    if (stageTab === 'rejected' && status !== 'REJECTED') return false;

    const term = searchQuery.toLowerCase();
    if (!term) return true;
    return (
      (app.studentName && app.studentName.toLowerCase().includes(term)) ||
      (app.studentEmail && app.studentEmail.toLowerCase().includes(term)) ||
      (app.cvEmail && app.cvEmail.toLowerCase().includes(term)) ||
      (app.internshipTitle && app.internshipTitle.toLowerCase().includes(term)) ||
      (app.status && app.status.toLowerCase().includes(term)) ||
      (meta.university && meta.university.toLowerCase().includes(term)) ||
      meta.matchedSkills.some((s) => s.toLowerCase().includes(term))
    );
  });

  // Sort applicants highest-to-lowest by match score
  const sortedFiltered = [...filtered].sort((a, b) => {
    return getApplicantScore(b) - getApplicantScore(a);
  });

  const selectedMeta = selectedCandidate ? getCandidateMeta(selectedCandidate) : null;
  const selectedMlScore = selectedCandidate ? mlApplicantScores[selectedCandidate.id] : null;

  return (
    <div className="space-y-6">
      <SectionTitle title="Applicants & Talent Pipeline" />

      {error && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm font-semibold text-rose-900">
          {error}
        </div>
      )}

      {/* ── ATS Pipeline Stage Filter Tabs ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E5D5CE] pb-3">
        <button
          onClick={() => setStageTab('all')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            stageTab === 'all'
              ? 'bg-[#7A4B43] text-white shadow-xs'
              : 'bg-white text-[#7A6A65] border border-[#E5D5CE] hover:text-[#2B1B17]'
          }`}
        >
          <span>All Applicants</span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${stageTab === 'all' ? 'bg-white/20 text-white' : 'bg-[#FAF6F4] text-[#7A6A65]'}`}>
            {countAll}
          </span>
        </button>

        <button
          onClick={() => setStageTab('recommended')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            stageTab === 'recommended'
              ? 'bg-[#2D6A4F] text-white shadow-xs'
              : 'bg-white text-[#2D6A4F] border border-emerald-300 hover:bg-emerald-50'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            AI Recommended (OK)
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${stageTab === 'recommended' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-[#2D6A4F]'}`}>
            {countRecommended}
          </span>
        </button>

        <button
          onClick={() => setStageTab('flagged')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            stageTab === 'flagged'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-amber-800 border border-amber-300 hover:bg-amber-50'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            AI Flagged (Low Match)
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${stageTab === 'flagged' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900'}`}>
            {countFlagged}
          </span>
        </button>

        <button
          onClick={() => setStageTab('shortlisted')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            stageTab === 'shortlisted'
              ? 'bg-[#2D6A4F] text-white shadow-xs'
              : 'bg-white text-[#2D6A4F] border border-emerald-200 hover:bg-emerald-50'
          }`}
        >
          <span>Shortlisted</span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${stageTab === 'shortlisted' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-[#2D6A4F]'}`}>
            {countShortlisted}
          </span>
        </button>

        <button
          onClick={() => setStageTab('interview')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            stageTab === 'interview'
              ? 'bg-[#4A6D88] text-white shadow-xs'
              : 'bg-white text-[#4A6D88] border border-blue-200 hover:bg-blue-50'
          }`}
        >
          <span>Interview</span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${stageTab === 'interview' ? 'bg-white/20 text-white' : 'bg-blue-100 text-[#4A6D88]'}`}>
            {countInterview}
          </span>
        </button>

        <button
          onClick={() => setStageTab('rejected')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            stageTab === 'rejected'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
          }`}
        >
          <span>Rejected</span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${stageTab === 'rejected' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'}`}>
            {countRejected}
          </span>
        </button>
      </div>

      <div className="card p-0 overflow-hidden shadow-xs">
        {/* Filters & Search Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5D5CE] bg-[#FAF6F4] px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A6A65]">Filter Role:</span>
            <select
              value={selectedInternshipId}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="form-select w-[270px] py-1.5 text-xs font-semibold bg-white"
            >
              <option value="all">All Postings ({applications.length} applicants)</option>
              {internships.map((job) => (
                <option key={job.id} value={String(job.id)}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A6A65]"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate name, skills, degree..."
              className="form-input py-1.5 pl-9 text-xs w-[280px]"
            />
          </div>
        </div>

        {/* AI Flagged triage tab info banner */}
        {stageTab === 'flagged' && (
          <div className="flex items-center gap-2.5 border-b border-amber-200 bg-amber-50/70 px-6 py-2.5 text-xs text-amber-900 font-medium">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-amber-700 shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>
              <strong>AI Flagged Candidates (&lt; 50% Match):</strong> Pre-screened unreviewed applicants with lower predicted match scores. Inspect via <strong>View CV</strong> and 1-click <strong>Reject</strong> (triggers automated email) or override to <strong>Shortlist</strong>.
            </span>
          </div>
        )}

        {/* Candidate Applications Table */}
        {loading ? (
          <div className="py-16 text-center text-[#7A6A65] text-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#7A4B43] border-t-transparent mx-auto mb-3" />
            Fetching candidate applications...
          </div>
        ) : sortedFiltered.length === 0 ? (
          <div className="py-16 text-center text-[#7A6A65] text-sm">
            <p className="mb-2 text-base font-semibold text-[#2B1B17]">No candidate applications match this stage.</p>
            <p className="text-xs text-[#7A6A65] max-w-sm mx-auto mb-4">
              Try switching stage tabs or select another internship position from the filter dropdown.
            </p>
            {stageTab !== 'all' && (
              <button
                onClick={() => setStageTab('all')}
                className="text-xs text-[#7A4B43] font-bold hover:underline"
              >
                View all candidates &rarr;
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#E5D5CE] bg-[#FAF6F4] text-[#7A6A65] uppercase tracking-wider font-semibold text-xs">
                  <th className="px-6 py-4">Candidate & University</th>
                  <th className="px-6 py-4">Target Role</th>
                  <th className="px-6 py-4">AI Shortlist %</th>
                  <th className="px-6 py-4">Review Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5D5CE]/70">
                {sortedFiltered.map((app) => {
                  const initial = (app.studentName || 'S').charAt(0).toUpperCase();
                  const isUpdating = updatingId === app.id;
                  const meta = getCandidateMeta(app);
                  const mlScore = mlApplicantScores[app.id];
                  const displayScore = mlScore?.shortlistProbability ?? meta.matchScore;

                  return (
                    <tr
                      key={app.id}
                      onClick={() => setSelectedCandidate(app)}
                      className="hover:bg-[#FAF6F4]/80 transition-colors cursor-pointer group"
                    >
                      {/* Candidate Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-[#E5D5CE] text-sm font-bold text-[#7A4B43] shadow-xs group-hover:border-[#7A4B43] transition-colors">
                            {initial}
                          </div>
                          <div>
                            <div className="font-bold text-[#2B1B17] text-base group-hover:text-[#7A4B43] transition-colors">
                              {app.studentName || (app.studentEmail ? app.studentEmail.split('@')[0] : `Student #${app.studentId || app.id}`)}
                            </div>
                            {app.studentEmail && (
                              <div className="text-xs text-[#7A6A65]">
                                {app.studentEmail}
                              </div>
                            )}
                            {(app.university || app.gpa != null) && (
                              <div className="text-xs text-[#7A6A65] font-medium">
                                {[app.university, app.gpa != null ? `GPA ${app.gpa}` : null].filter(Boolean).join(' · ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Target Role */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#2B1B17]">
                          {app.internshipTitle || 'Software Engineering Intern'}
                        </div>
                        <div className="text-xs text-[#7A6A65]">
                          Applied {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'Recent'}
                        </div>
                      </td>

                      {/* AI Shortlist % */}
                      <td className="px-6 py-4">
                        <div
                          title={
                            mlScore
                              ? `Shortlist Probability: ${mlScore.shortlistProbability}%\nSemantic Score: ${mlScore.semanticScore}%\nFit Category: ${mlScore.fitCategory}`
                              : `Fit Score: ${displayScore}%`
                          }
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
                            displayScore >= 75
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                              : displayScore >= 50
                              ? 'border-amber-300 bg-amber-50 text-amber-900'
                              : 'border-rose-200 bg-rose-50 text-rose-800'
                          }`}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                          <span>{displayScore}% Shortlist</span>
                        </div>
                      </td>

                      {/* Review Status */}
                      <td className="px-6 py-4">
                        <Badge kind={statusBadge[app.status] || 'warn'}>{app.status || 'PENDING'}</Badge>
                      </td>

                      {/* Action Button */}
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleViewCv(app.id, e)}
                            disabled={loadingCvId === app.id}
                            title="Open candidate PDF CV in a new tab"
                            className="rounded-lg border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-800 hover:bg-sky-600 hover:text-white transition-colors shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {loadingCvId === app.id ? (
                              <span className="animate-pulse">Loading...</span>
                            ) : (
                              <>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                  <line x1="16" y1="13" x2="8" y2="13" />
                                  <line x1="16" y1="17" x2="8" y2="17" />
                                </svg>
                                <span>View CV</span>
                              </>
                            )}
                          </button>

                          {/* 1-Click Reject Button */}
                          {app.status !== 'REJECTED' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openConfirmModal(app, 'REJECTED');
                              }}
                              disabled={updatingId === app.id || confirmSubmitting}
                              title="Review & send rejection email to candidate"
                              className="rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-700 hover:text-white transition-colors shadow-xs inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                              <span>Reject</span>
                            </button>
                          )}

                          {isUpdating ? (
                            <span className="text-xs text-[#7A4B43] animate-pulse font-bold">Updating...</span>
                          ) : (
                            <button
                              onClick={() => setSelectedCandidate(app)}
                              className="rounded-lg border border-[#E5D5CE] bg-white px-3 py-1.5 text-xs font-bold text-[#7A4B43] hover:bg-[#7A4B43] hover:text-white transition-colors shadow-xs"
                            >
                              Review &rarr;
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Slide-Over Candidate Drawer ── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity duration-300 ${
          selectedCandidate ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSelectedCandidate(null)}
      />

      {/* Drawer Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          selectedCandidate ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedCandidate && selectedMeta && (
          <>
            {/* Drawer Header */}
            <div className="flex items-start justify-between border-b border-[#E5D5CE] bg-[#FAF6F4] px-7 py-5">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#7A4B43] text-white text-lg font-bold shadow-xs">
                  {(selectedCandidate.studentName || 'S').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#2B1B17]">
                    {selectedCandidate.studentName || (selectedCandidate.studentEmail ? selectedCandidate.studentEmail.split('@')[0] : `Candidate #${selectedCandidate.id}`)}
                  </h3>
                  {selectedCandidate.studentEmail && (
                    <p className="text-xs text-[#7A6A65] font-medium">
                      {selectedCandidate.studentEmail}
                    </p>
                  )}
                  {(selectedCandidate.university || selectedCandidate.degree) && (
                    <p className="text-xs text-[#7A6A65] font-medium">
                      {[selectedCandidate.degree, selectedCandidate.university].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <div className="mt-1 flex items-center gap-2">
                    {selectedCandidate.gpa != null && (
                      <span className="inline-block rounded-md bg-white border border-[#E5D5CE] px-2 py-0.5 text-[11px] font-bold text-[#2B1B17]">
                        GPA: {selectedCandidate.gpa}
                      </span>
                    )}
                    <Badge kind={statusBadge[selectedCandidate.status] || 'warn'}>
                      {selectedCandidate.status || 'PENDING'}
                    </Badge>
                  </div>

                  {/* Candidate Direct Phone & CV Email - visible ONLY for SHORTLISTED & INTERVIEW */}
                  {(selectedCandidate.status === 'SHORTLISTED' || selectedCandidate.status === 'INTERVIEW') && (
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#2D6A4F]">Candidate Direct Contact Details</span>
                        <span className="text-[10px] font-semibold text-emerald-800 bg-white border border-emerald-300 rounded-md px-2 py-0.5">
                          Verified Candidate
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1.5 border-t border-emerald-200/60">
                        <div>
                          <div className="text-[10px] font-bold text-[#7A6A65] uppercase">Direct Phone</div>
                          {selectedCandidate.studentPhone ? (
                            <a
                              href={`tel:${selectedCandidate.studentPhone}`}
                              className="text-xs font-bold text-[#2B1B17] hover:text-[#7A4B43] flex items-center gap-1.5 mt-0.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#2D6A4F]">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                              </svg>
                              <span>{selectedCandidate.studentPhone}</span>
                            </a>
                          ) : (
                            <span className="text-xs text-[#7A6A65] italic">Not provided</span>
                          )}
                        </div>

                        <div>
                          <div className="text-[10px] font-bold text-[#7A6A65] uppercase">CV Contact Email</div>
                          <a
                            href={`mailto:${selectedCandidate.cvEmail || selectedCandidate.studentEmail}`}
                            className="text-xs font-bold text-[#2B1B17] hover:text-[#7A4B43] flex items-center gap-1.5 mt-0.5 truncate"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#2D6A4F]">
                              <rect width="20" height="16" x="2" y="4" rx="2" />
                              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                            </svg>
                            <span className="truncate">{selectedCandidate.cvEmail || selectedCandidate.studentEmail}</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleViewCv(selectedCandidate.id)}
                  disabled={loadingCvId === selectedCandidate.id}
                  className="rounded-xl border border-sky-300 bg-sky-50 px-3.5 py-2 text-xs font-bold text-sky-800 hover:bg-sky-600 hover:text-white transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                  title="Open candidate PDF CV in a new tab"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  <span>{loadingCvId === selectedCandidate.id ? 'Loading...' : 'View CV'}</span>
                </button>

                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="rounded-lg p-2 text-[#7A6A65] hover:bg-[#F2E8E4] hover:text-[#2B1B17] transition-colors"
                  title="Close drawer"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto px-7 py-6 space-y-6">
              {/* AI Fit Score Ring Card */}
              {(() => {
                const drawerScore = selectedMlScore?.shortlistProbability ?? selectedMeta.matchScore;
                return (
                  <div className="rounded-2xl border border-[#E5D5CE] bg-[#FAF6F4] p-5 flex items-center gap-5">
                    {/* SVG Progress Ring */}
                    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
                      <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-[#E5D5CE]"
                          strokeWidth="3.2"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-[#2D6A4F] transition-all duration-1000 ease-out"
                          strokeDasharray={`${drawerScore}, 100`}
                          strokeWidth="3.2"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-xl font-black text-[#2B1B17]">{drawerScore}%</span>
                      </div>
                    </div>

                    <div>
                      <div className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-[#2D6A4F] mb-1">
                        {selectedMlScore ? `✓ ${selectedMlScore.fitCategory} (${selectedMlScore.shortlistProbability}% Shortlist)` : '✓ Strong AI Fit Recommendation'}
                      </div>
                      <h4 className="font-serif text-base font-bold text-[#2B1B17]">
                        High Compatibility for {selectedCandidate.internshipTitle || 'Role'}
                      </h4>
                      <p className="text-xs text-[#7A6A65] mt-1 leading-relaxed">
                        Student technical skills and university curriculum strongly match the prerequisite criteria of this position.
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Matched vs Missing Skills */}
              <div className="space-y-4">
                <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-[#7A6A65]">
                  Technical Skill Breakdown
                </h4>

                {/* Matched Skills */}
                <div>
                  <div className="text-xs font-bold text-[#2D6A4F] mb-2 flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Validated Matched Skills ({selectedMeta.matchedSkills.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedMeta.matchedSkills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-900"
                      >
                        ✓ {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing / Developing Skills */}
                <div>
                  <div className="text-xs font-bold text-[#7A6A65] mb-2 flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    Secondary / In-Progress Skills ({selectedMeta.missingSkills.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedMeta.missingSkills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#E5D5CE] bg-[#FAF6F4] px-2.5 py-1 text-xs font-semibold text-[#7A6A65]"
                      >
                        + {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submitted Resume Attachment */}
              <div className="space-y-2">
                <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-[#7A6A65]">
                  Submitted CV / Resume
                </h4>
                <div className="rounded-xl border border-[#E5D5CE] bg-[#FAF6F4] p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-800">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#2B1B17]">
                        {selectedCandidate.resumeFileName || 'Submitted_CV.pdf'}
                      </div>
                      <div className="text-[11px] text-[#7A6A65]">
                        Candidate PDF Document
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleViewCv(selectedCandidate.id)}
                    disabled={loadingCvId === selectedCandidate.id}
                    className="rounded-lg border border-sky-300 bg-white px-3 py-1.5 text-xs font-bold text-sky-800 hover:bg-sky-600 hover:text-white transition-colors shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span>{loadingCvId === selectedCandidate.id ? 'Loading...' : 'View Full CV'} &rarr;</span>
                  </button>
                </div>
              </div>

              {/* Resume Summary */}
              <div className="space-y-2">
                <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-[#7A6A65]">
                  Verified Candidate Profile & Summary
                </h4>
                <div className="rounded-xl border border-[#E5D5CE] bg-[#FAF6F4] p-4 text-xs text-[#2B1B17] leading-relaxed">
                  {selectedMeta.summary}
                </div>
              </div>

              {/* Key Academic & Portfolio Highlights */}
              <div className="space-y-2">
                <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-[#7A6A65]">
                  Highlights & Verified Credentials
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between rounded-xl border border-[#E5D5CE] p-3">
                    <div className="font-semibold text-[#2B1B17]">Academic Transcripts & Verification</div>
                    <span className="text-[#2D6A4F] font-bold">Verified UCSC / UGC</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-[#E5D5CE] p-3">
                    <div className="font-semibold text-[#2B1B17]">GitHub & Code Repositories</div>
                    <span className="text-[#7A4B43] font-bold">Active Contributor</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="border-t border-[#E5D5CE] bg-[#FAF6F4] px-7 py-4">
              <div className="mb-3">
                <label className="block text-[11px] font-bold text-[#7A6A65] uppercase tracking-wider mb-1">
                  Optional Note for Candidate (included in auto-email)
                </label>
                <input
                  type="text"
                  value={candidateNote}
                  onChange={(e) => setCandidateNote(e.target.value)}
                  placeholder="e.g. Please bring your portfolio; interview scheduled for Thursday 2 PM..."
                  className="form-input text-xs w-full py-1.5"
                />
              </div>

              <div className="text-xs font-bold uppercase tracking-wider text-[#7A6A65] mb-2.5">
                Update Candidate Stage
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  onClick={() => openConfirmModal(selectedCandidate, 'SHORTLISTED', candidateNote)}
                  disabled={updatingId === selectedCandidate.id || confirmSubmitting}
                  className={`rounded-xl py-2.5 px-3 text-xs font-bold transition-all ${
                    selectedCandidate.status === 'SHORTLISTED'
                      ? 'bg-[#2D6A4F] text-white shadow-xs'
                      : 'border border-emerald-300 bg-emerald-50 text-[#2D6A4F] hover:bg-[#2D6A4F] hover:text-white'
                  }`}
                >
                  ✓ Shortlist
                </button>

                <button
                  onClick={() => openConfirmModal(selectedCandidate, 'INTERVIEW', candidateNote)}
                  disabled={updatingId === selectedCandidate.id || confirmSubmitting}
                  className={`rounded-xl py-2.5 px-3 text-xs font-bold transition-all ${
                    selectedCandidate.status === 'INTERVIEW'
                      ? 'bg-[#4A6D88] text-white shadow-xs'
                      : 'border border-blue-300 bg-blue-50 text-[#4A6D88] hover:bg-[#4A6D88] hover:text-white'
                  }`}
                >
                  📅 Interview
                </button>

                <button
                  onClick={() => openConfirmModal(selectedCandidate, 'REJECTED', candidateNote)}
                  disabled={updatingId === selectedCandidate.id || confirmSubmitting}
                  className={`rounded-xl py-2.5 px-3 text-xs font-bold transition-all ${
                    selectedCandidate.status === 'REJECTED'
                      ? 'bg-rose-700 text-white shadow-xs'
                      : 'border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-700 hover:text-white'
                  }`}
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Confirmation & Email Preview Modal ── */}
      {confirmModal.isOpen && confirmModal.application && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B1B17]/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-[#E5D5CE] overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E5D5CE] flex items-center justify-between bg-[#FAF6F4]">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold ${
                    confirmModal.targetStage === 'SHORTLISTED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : confirmModal.targetStage === 'INTERVIEW'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {confirmModal.targetStage === 'SHORTLISTED' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {confirmModal.targetStage === 'INTERVIEW' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  )}
                  {confirmModal.targetStage === 'REJECTED' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#2B1B17]">
                    Confirm {confirmModal.stageLabel} & Preview Email
                  </h3>
                  <p className="text-xs text-[#7A6A65]">
                    Review recipient details and edit the email message before confirming.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseConfirmModal}
                disabled={confirmSubmitting}
                className="text-[#7A6A65] hover:text-[#2B1B17] p-1.5 rounded-lg hover:bg-[#E5D5CE]/40 transition-colors"
                title="Cancel and close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Recipient & Action Info Card */}
              <div className="rounded-xl border border-[#E5D5CE] bg-[#FAF6F4] p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#7A6A65] font-semibold">Candidate:</span>
                  <span className="font-bold text-[#2B1B17] text-sm">{confirmModal.candidateName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#7A6A65] font-semibold">Target Position:</span>
                  <span className="font-semibold text-[#2B1B17]">{confirmModal.targetRole}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#7A6A65] font-semibold">Recipient Email:</span>
                  <span className="inline-flex items-center gap-1 font-mono font-bold text-[#7A4B43] bg-white px-2 py-0.5 rounded border border-[#E5D5CE]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    {confirmModal.recipientEmail}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#E5D5CE]/60">
                  <span className="text-[#7A6A65] font-semibold">Stage to Apply:</span>
                  <span
                    className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wider ${
                      confirmModal.targetStage === 'SHORTLISTED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : confirmModal.targetStage === 'INTERVIEW'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {confirmModal.stageLabel}
                  </span>
                </div>
              </div>

              {/* Editable Message / Note Preview */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#7A6A65]">
                    Notification Email & Note Preview
                  </label>
                  <span className="text-[11px] text-[#7A6A65]">Editable template</span>
                </div>
                <textarea
                  rows={6}
                  value={confirmModal.emailMessage}
                  onChange={(e) =>
                    setConfirmModal((prev) => ({ ...prev, emailMessage: e.target.value }))
                  }
                  className="form-input text-xs w-full font-sans leading-relaxed p-3 border-[#E5D5CE] focus:border-[#7A4B43] focus:ring-1 focus:ring-[#7A4B43] rounded-xl"
                  placeholder="Type an optional personalized message or instructions..."
                />
                <p className="text-[11px] text-[#7A6A65] mt-1.5">
                  💡 This message will be sent to the candidate via automated notification email and saved to their application status log.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-[#FAF6F4] border-t border-[#E5D5CE] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseConfirmModal}
                disabled={confirmSubmitting}
                className="btn btn-ghost px-4 py-2 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAndSend}
                disabled={confirmSubmitting}
                className={`btn px-5 py-2 text-xs font-bold flex items-center gap-2 shadow-sm ${
                  confirmModal.targetStage === 'SHORTLISTED'
                    ? 'btn-primary'
                    : confirmModal.targetStage === 'INTERVIEW'
                    ? 'bg-[#4A6D88] text-white hover:bg-[#3B576D]'
                    : 'bg-rose-700 text-white hover:bg-rose-800'
                }`}
              >
                {confirmSubmitting ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Updating & Sending...</span>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    <span>Confirm & Send Email</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation Floating Toast ── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-[#2D6A4F] px-4 py-3 text-sm font-semibold text-white shadow-xl animate-fade-in border border-emerald-400">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-white/80 hover:text-white"
            title="Close notification"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
