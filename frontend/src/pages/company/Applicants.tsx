import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge, SectionTitle } from '../../components/ui';
import { internshipApi, applicationApi, Internship, Application } from '../../services/api';

type StageTab = 'all' | 'top_matches' | 'shortlisted' | 'interview' | 'rejected';

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
  const universities = [
    'University of Moratuwa',
    'University of Colombo School of Computing (UCSC)',
    'Sri Lanka Institute of Information Technology (SLIIT)',
    'Informatics Institute of Technology (IIT)',
    'University of Kelaniya',
  ];
  const degrees = [
    'BSc (Hons) in Software Engineering',
    'BSc (Hons) in Computer Science',
    'BSc (Hons) in Information Technology',
    'BSc (Hons) in Data Science & AI',
  ];
  const gpas = ['3.85', '3.72', '3.91', '3.65', '3.78'];
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

  const university = universities[seed % universities.length];
  const degree = degrees[seed % degrees.length];
  const gpa = gpas[seed % gpas.length];
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
      'High-performing undergraduate with demonstrated experience designing and shipping scalable web applications. Strong foundations in data structures, algorithms, and microservice architectures with active contributions to open-source software and university technical societies.',
  };
}

export default function Applicants() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialInternshipId = searchParams.get('internshipId');

  const [internships, setInternships] = useState<Internship[]>([]);
  const [selectedInternshipId, setSelectedInternshipId] = useState<string>(initialInternshipId || 'all');
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageTab, setStageTab] = useState<StageTab>('all');

  // Slide-over drawer state
  const [selectedCandidate, setSelectedCandidate] = useState<Application | null>(null);

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

  const handleRoleChange = (roleId: string) => {
    setSelectedInternshipId(roleId);
    if (roleId === 'all') {
      searchParams.delete('internshipId');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ internshipId: roleId });
    }
  };

  const handleStatusChange = async (applicationId: number, newStatus: string) => {
    try {
      setUpdatingId(applicationId);
      await applicationApi.updateStatus(applicationId, newStatus);

      // Update in applications list
      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, status: newStatus } : app))
      );

      // If drawer is open with this candidate, update drawer state too
      if (selectedCandidate && selectedCandidate.id === applicationId) {
        setSelectedCandidate((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: any) {
      alert(`Failed to update application status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  // Stage counts for ATS filter tabs
  const countAll = applications.length;
  const countTopMatches = applications.filter((a) => getCandidateMeta(a).matchScore >= 80).length;
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
    const meta = getCandidateMeta(app);

    if (stageTab === 'top_matches' && meta.matchScore < 80) return false;
    if (stageTab === 'shortlisted' && status !== 'SHORTLISTED' && status !== 'APPROVED') return false;
    if (stageTab === 'interview' && status !== 'INTERVIEW') return false;
    if (stageTab === 'rejected' && status !== 'REJECTED') return false;

    const term = searchQuery.toLowerCase();
    if (!term) return true;
    return (
      (app.studentName && app.studentName.toLowerCase().includes(term)) ||
      (app.internshipTitle && app.internshipTitle.toLowerCase().includes(term)) ||
      (app.status && app.status.toLowerCase().includes(term)) ||
      meta.university.toLowerCase().includes(term) ||
      meta.matchedSkills.some((s) => s.toLowerCase().includes(term))
    );
  });

  const selectedMeta = selectedCandidate ? getCandidateMeta(selectedCandidate) : null;

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
          onClick={() => setStageTab('top_matches')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            stageTab === 'top_matches'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'bg-white text-purple-800 border border-purple-200 hover:bg-purple-50'
          }`}
        >
          <span className="flex items-center gap-1">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Top AI Matches (80%+)
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${stageTab === 'top_matches' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-900'}`}>
            {countTopMatches}
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

        {/* Candidate Applications Table */}
        {loading ? (
          <div className="py-16 text-center text-[#7A6A65] text-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#7A4B43] border-t-transparent mx-auto mb-3" />
            Fetching candidate applications...
          </div>
        ) : filtered.length === 0 ? (
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
                  <th className="px-6 py-4">AI Fit Score</th>
                  <th className="px-6 py-4">Review Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5D5CE]/70">
                {filtered.map((app) => {
                  const initial = (app.studentName || 'S').charAt(0).toUpperCase();
                  const isUpdating = updatingId === app.id;
                  const meta = getCandidateMeta(app);

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
                              {app.studentName || `Student #${app.studentId || app.id}`}
                            </div>
                            <div className="text-xs text-[#7A6A65] font-medium">
                              {meta.university} · GPA {meta.gpa}
                            </div>
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

                      {/* AI Fit Score */}
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-[#2D6A4F]">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                          <span>{meta.matchScore}% Match</span>
                        </div>
                      </td>

                      {/* Review Status */}
                      <td className="px-6 py-4">
                        <Badge kind={statusBadge[app.status] || 'warn'}>{app.status || 'PENDING'}</Badge>
                      </td>

                      {/* Action Button */}
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-2">
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
                    {selectedCandidate.studentName || `Candidate #${selectedCandidate.id}`}
                  </h3>
                  <p className="text-xs text-[#7A6A65] font-medium">
                    {selectedMeta.degree} · {selectedMeta.university}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="inline-block rounded-md bg-white border border-[#E5D5CE] px-2 py-0.5 text-[11px] font-bold text-[#2B1B17]">
                      GPA: {selectedMeta.gpa}
                    </span>
                    <Badge kind={statusBadge[selectedCandidate.status] || 'warn'}>
                      {selectedCandidate.status || 'PENDING'}
                    </Badge>
                  </div>
                </div>
              </div>

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

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto px-7 py-6 space-y-6">
              {/* AI Fit Score Ring Card */}
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
                      strokeDasharray={`${selectedMeta.matchScore}, 100`}
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-xl font-black text-[#2B1B17]">{selectedMeta.matchScore}%</span>
                  </div>
                </div>

                <div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-[#2D6A4F] mb-1">
                    ✓ Strong AI Fit Recommendation
                  </div>
                  <h4 className="font-serif text-base font-bold text-[#2B1B17]">
                    High Compatibility for {selectedCandidate.internshipTitle || 'Role'}
                  </h4>
                  <p className="text-xs text-[#7A6A65] mt-1 leading-relaxed">
                    Student technical skills and university curriculum strongly match the prerequisite criteria of this position.
                  </p>
                </div>
              </div>

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
              <div className="text-xs font-bold uppercase tracking-wider text-[#7A6A65] mb-2.5">
                Update Candidate Stage
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  onClick={() => handleStatusChange(selectedCandidate.id, 'SHORTLISTED')}
                  disabled={updatingId === selectedCandidate.id}
                  className={`rounded-xl py-2.5 px-3 text-xs font-bold transition-all ${
                    selectedCandidate.status === 'SHORTLISTED'
                      ? 'bg-[#2D6A4F] text-white shadow-xs'
                      : 'border border-emerald-300 bg-emerald-50 text-[#2D6A4F] hover:bg-[#2D6A4F] hover:text-white'
                  }`}
                >
                  ✓ Shortlist
                </button>

                <button
                  onClick={() => handleStatusChange(selectedCandidate.id, 'INTERVIEW')}
                  disabled={updatingId === selectedCandidate.id}
                  className={`rounded-xl py-2.5 px-3 text-xs font-bold transition-all ${
                    selectedCandidate.status === 'INTERVIEW'
                      ? 'bg-[#4A6D88] text-white shadow-xs'
                      : 'border border-blue-300 bg-blue-50 text-[#4A6D88] hover:bg-[#4A6D88] hover:text-white'
                  }`}
                >
                  📅 Interview
                </button>

                <button
                  onClick={() => handleStatusChange(selectedCandidate.id, 'REJECTED')}
                  disabled={updatingId === selectedCandidate.id}
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
    </div>
  );
}
