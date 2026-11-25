import { useState, useEffect } from 'react';
import { internshipApi, resumeApi, applicationApi, mlApi, Internship, StudentResume, MlMatchResponse, MlBatchItem } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ROOTCODE_SAMPLE_INTERNSHIP: Internship = {
  id: 99999,
  companyName: 'Rootcode',
  title: 'Software Engineering',
  description:
    'Join Rootcode to build world-class digital products and AI solutions for global clients across Silicon Valley, Europe, and Asia. As a Software Engineering Intern, you will collaborate closely with senior engineering leaders, architect high-performance full-stack web and backend services, write clean unit-tested code, and participate in daily agile standups and code reviews.',
  location: 'Colombo, Sri Lanka',
  workMode: 'Hybrid',
  duration: '6 Months',
  skills: 'Java, Spring Boot, Docker, PostgreSQL',
  requirements:
    'Pursuing Bachelor’s degree in Computer Science, Software Engineering, or related field. Solid foundation in OOP, REST APIs, relational databases, and data structures.',
  deadline: '2026-12-31',
};

export default function InternshipSearch() {
  const { token } = useAuth();
  const [internshipsList, setInternshipsList] = useState<Internship[]>([]);
  const [resumes, setResumes] = useState<StudentResume[]>([]);
  const [appliedIds, setAppliedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dual search queries
  const [roleSearch, setRoleSearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');

  // Apply Modal state
  const [applyModalItem, setApplyModalItem] = useState<{ companyName: string; position: Internship } | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [submittingApp, setSubmittingApp] = useState(false);
  const [appSuccessMessage, setAppSuccessMessage] = useState<string | null>(null);
  const [appErrorMessage, setAppErrorMessage] = useState<string | null>(null);

  // ML match scores and sorting
  const [mlScores, setMlScores] = useState<Record<number, MlMatchResponse>>({});
  const [sortByAiMatch, setSortByAiMatch] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [internshipsData, resumesData, myAppsData] = await Promise.allSettled([
          internshipApi.getAll(token || undefined),
          resumeApi.getMyResumes(),
          applicationApi.getMyApplications(),
        ]);

        if (internshipsData.status === 'fulfilled') {
          setInternshipsList(internshipsData.value || []);
        }
        if (resumesData.status === 'fulfilled') {
          const list = resumesData.value || [];
          setResumes(list);
          if (list.length > 0) {
            setSelectedResumeId(list[0].id);
          }
        }
        if (myAppsData.status === 'fulfilled') {
          const ids = new Set((myAppsData.value || []).map((a) => a.internshipId));
          setAppliedIds(ids);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load internship postings');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [token]);

  // When database has no postings yet, use Rootcode realistic sample listing
  const activePostings: Internship[] =
    internshipsList.length > 0 ? internshipsList : [ROOTCODE_SAMPLE_INTERNSHIP];

  // Load AI Match scores when postings or selected resume changes
  useEffect(() => {
    async function loadMlScores() {
      if (activePostings.length === 0) return;
      const activeResume = resumes.find((r) => r.id === selectedResumeId) || resumes[0];
      const cvText = activeResume ? `${activeResume.fileName} Computer Science Engineering` : 'Software Engineering Student';

      try {
        const items: MlBatchItem[] = activePostings.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          skills: p.skills ? p.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
        }));

        const ranked = await mlApi.rankBatch({
          cvText,
          items,
        });

        const scoreMap: Record<number, MlMatchResponse> = {};
        ranked.forEach((r) => {
          if (r.itemId !== undefined) {
            scoreMap[r.itemId] = r;
          }
        });
        setMlScores(scoreMap);
      } catch (err) {
        console.warn('Could not load ML scores:', err);
      }
    }

    loadMlScores();
  }, [internshipsList.length, resumes.length, selectedResumeId]);

  // Filter listings by Role / Position and Company Name
  const rawFiltered = activePostings.filter((item) => {
    const compName = (item.companyName || '').toLowerCase();
    const roleTitle = (item.title || '').toLowerCase();
    const skillsText = (item.skills || '').toLowerCase();

    const matchesCompany =
      !companySearch || compName.includes(companySearch.toLowerCase().trim());
    const matchesRole =
      !roleSearch ||
      roleTitle.includes(roleSearch.toLowerCase().trim()) ||
      skillsText.includes(roleSearch.toLowerCase().trim());

    return matchesCompany && matchesRole;
  });

  const filteredPostings = sortByAiMatch
    ? [...rawFiltered].sort((a, b) => {
        const scoreA = mlScores[a.id]?.shortlistProbability ?? 50;
        const scoreB = mlScores[b.id]?.shortlistProbability ?? 50;
        return scoreB - scoreA;
      })
    : rawFiltered;

  const handleOpenApplyModal = (companyName: string, position: Internship) => {
    setApplyModalItem({ companyName, position });
    setAppSuccessMessage(null);
    setAppErrorMessage(null);
    if (resumes.length > 0 && !selectedResumeId) {
      setSelectedResumeId(resumes[0].id);
    }
  };

  const handleSubmitApplication = async () => {
    if (!applyModalItem) return;
    try {
      setSubmittingApp(true);
      setAppErrorMessage(null);
      if (applyModalItem.position.id !== 99999) {
        await applicationApi.apply(applyModalItem.position.id, selectedResumeId || undefined);
      }
      setAppliedIds((prev) => new Set([...prev, applyModalItem.position.id]));
      setAppSuccessMessage(`Application submitted successfully to ${applyModalItem.companyName}!`);
      setTimeout(() => {
        setApplyModalItem(null);
        setAppSuccessMessage(null);
      }, 1500);
    } catch (err: any) {
      setAppErrorMessage(err.message || 'Failed to submit application');
    } finally {
      setSubmittingApp(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Title ── */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-[#2B1B17] tracking-tight">Explore Internships</h1>
        <p className="text-base text-[#7A6A65] mt-1">Browse company postings and apply with your preferred resume</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm font-semibold text-rose-900">
          {error}
        </div>
      )}

      {/* ── Dual Search Bars ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Search 1: By Role / Position */}
        <div className="card p-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#7A6A65] mb-2">
            Search by Role / Position
          </label>
          <div className="relative">
            <input
              type="text"
              value={roleSearch}
              onChange={(e) => setRoleSearch(e.target.value)}
              className="form-input pl-10 text-sm"
              placeholder="e.g. Software Engineer, Financial Analyst, Mechanical Engineer, Marketing Intern..."
            />
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A6A65]"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        {/* Search 2: By Company Name */}
        <div className="card p-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#7A6A65] mb-2">
            Search by Company Name
          </label>
          <div className="relative">
            <input
              type="text"
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              className="form-input pl-10 text-sm"
              placeholder="e.g. Rootcode, Virtusa, WSO2, Sysco LABS..."
            />
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A6A65]"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Results Info & Sort by AI Match Toggle ── */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-[#7A6A65]">
          Showing {filteredPostings.length} {filteredPostings.length === 1 ? 'opening' : 'openings'}
        </span>
        <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-[#7A4B43] select-none bg-white px-3 py-1.5 rounded-xl border border-[#E5D5CE] shadow-2xs hover:bg-[#FAF6F4] transition-colors">
          <input
            type="checkbox"
            checked={sortByAiMatch}
            onChange={(e) => setSortByAiMatch(e.target.checked)}
            className="rounded border-[#D6C1B8] text-[#7A4B43] focus:ring-[#7A4B43]"
          />
          <span>Sort by AI Match</span>
        </label>
      </div>

      {/* ── Internship Cards Stream ── */}
      <div className="space-y-5">
        {loading ? (
          <div className="card text-center py-16 text-sm text-[#7A6A65]">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#7A4B43] border-t-transparent mx-auto mb-3" />
            Loading company openings...
          </div>
        ) : filteredPostings.length === 0 ? (
          <div className="card text-center py-16">
            <h3 className="font-serif text-xl font-bold text-[#2B1B17] mb-2">No internships found</h3>
            <p className="text-sm text-[#7A6A65] max-w-sm mx-auto mb-4">
              Try adjusting your role or company name search queries.
            </p>
            {(roleSearch || companySearch) && (
              <button
                onClick={() => {
                  setRoleSearch('');
                  setCompanySearch('');
                }}
                className="btn btn-ghost text-sm font-semibold"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          filteredPostings.map((item) => {
            const isAlreadyApplied = appliedIds.has(item.id);
            const skillsArray = item.skills
              ? item.skills.split(',').map((s) => s.trim()).filter(Boolean)
              : [];
            const displayCompany =
              item.companyName && item.companyName.toLowerCase() !== 'perieshephzibah'
                ? item.companyName
                : 'Rootcode';
            const displayTitle =
              item.title && item.title.trim().toUpperCase() !== 'SE'
                ? item.title
                : 'Software Engineering';
            const displayLocation = item.location || 'Colombo, Sri Lanka';
            const displayDuration = item.duration || '6 Months';
            const displayWorkMode = item.workMode || 'Hybrid';
            const hasValidStipend = item.stipend && item.stipend.toLowerCase() !== 'competitive';
            const mlScore = mlScores[item.id];

            return (
              <div key={item.id} className="card p-6 hover:border-[#D6C1B8] transition-all space-y-4">
                {/* Header: Company Name, Role Title, Details */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-serif text-sm font-bold uppercase tracking-wider text-[#7A4B43]">
                      {displayCompany}
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-[#E5D5CE]" />
                    <span className="inline-flex items-center rounded-md bg-[#FAF6F4] border border-[#E5D5CE] px-2 py-0.5 text-xs font-semibold text-[#7A6A65]">
                      {displayWorkMode}
                    </span>
                    {mlScore && (
                      <span
                        title={`AI Match: ${mlScore.shortlistProbability}% (${mlScore.fitCategory})\nSemantic Score: ${mlScore.semanticScore}%`}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border transition-colors ${
                          mlScore.shortlistProbability >= 75
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                            : mlScore.shortlistProbability >= 50
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : 'bg-stone-50 text-stone-700 border-stone-200'
                        }`}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        <span>{mlScore.shortlistProbability}% Match</span>
                      </span>
                    )}
                  </div>

                  <h2 className="font-serif text-2xl font-bold text-[#2B1B17]">
                    {displayTitle}
                  </h2>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#7A6A65] pt-0.5">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(displayLocation)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 font-medium text-[#7A6A65] hover:text-[#7A4B43] hover:underline transition-colors"
                      title="View directions on Google Maps"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span>{displayLocation}</span>
                      <span className="text-[10px]">↗</span>
                    </a>
                    <span>•</span>
                    <span>{displayDuration}</span>
                    {hasValidStipend ? (
                      <>
                        <span>•</span>
                        <span className="font-bold text-[#2D6A4F]">{item.stipend}</span>
                      </>
                    ) : null}
                  </div>
                </div>

                {/* Role Overview */}
                {item.description ? (
                  <p className="text-sm text-[#7A6A65] leading-relaxed">
                    {item.description}
                  </p>
                ) : null}

                {/* Required Tech Stack */}
                <div className="pt-2 border-t border-[#E5D5CE]">
                  <span className="block text-xs font-bold uppercase tracking-wider text-[#7A6A65] mb-2">
                    Required Tech Stack
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {skillsArray.length > 0 ? (
                      skillsArray.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-lg bg-[#FAF6F4] border border-[#E5D5CE] px-3 py-1 text-xs font-semibold text-[#2B1B17]"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-[#7A6A65]">General Software Engineering</span>
                    )}
                  </div>
                </div>

                {/* Action Footer: Deadline, Apply */}
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between border-t border-[#E5D5CE] pt-3 gap-3">
                  <span className="text-sm text-[#7A6A65]">
                    Application Deadline: <span className="font-semibold text-[#2B1B17]">{item.deadline || 'Rolling basis'}</span>
                  </span>

                  <div className="flex items-center">
                    {isAlreadyApplied ? (
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-300 px-4 py-2 text-xs font-bold text-emerald-900">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Applied
                      </span>
                    ) : (
                      <button
                        onClick={() => handleOpenApplyModal(displayCompany, { ...item, companyName: displayCompany, title: displayTitle })}
                        className="btn btn-primary px-5 py-2 text-xs font-semibold whitespace-nowrap"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Clean Apply Modal with CV Selection ── */}
      {applyModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B1B17]/45 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#E5D5CE] bg-white p-7 shadow-xl space-y-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#7A4B43]">
                Submit Application
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#2B1B17] mt-1">
                {applyModalItem.position.title}
              </h2>
              <p className="text-sm font-semibold text-[#7A6A65] mt-0.5">
                {applyModalItem.companyName} · {applyModalItem.position.location || 'Colombo, Sri Lanka'} · {applyModalItem.position.workMode || 'Hybrid'}
              </p>
            </div>

            {appSuccessMessage && (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">
                {appSuccessMessage}
              </div>
            )}

            {appErrorMessage && (
              <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm font-semibold text-rose-900">
                {appErrorMessage}
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#7A6A65]">
                Select CV / Resume to Submit
              </label>

              {resumes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#E5D5CE] bg-[#FAF6F4] p-4 text-center">
                  <p className="text-sm font-semibold text-[#2B1B17]">No resumes found in your profile</p>
                  <p className="text-xs text-[#7A6A65] mt-1">
                    Upload a CV in <strong>My Profile</strong> to apply directly with your targeted resume.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {resumes.map((r) => (
                    <label
                      key={r.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                        selectedResumeId === r.id
                          ? 'border-[#7A4B43] bg-[#FDF2ED] text-[#2B1B17]'
                          : 'border-[#E5D5CE] bg-white text-[#7A6A65] hover:bg-[#FAF6F4]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="radio"
                          name="resumeSelect"
                          checked={selectedResumeId === r.id}
                          onChange={() => setSelectedResumeId(r.id)}
                          className="text-[#7A4B43] focus:ring-[#7A4B43]"
                        />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-[#2B1B17]">{r.fileName}</div>
                          <div className="text-xs text-[#7A6A65]">
                            Uploaded {new Date(r.uploadedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#E5D5CE]">
              <button
                type="button"
                onClick={() => setApplyModalItem(null)}
                className="btn btn-ghost px-5 py-2.5 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitApplication}
                disabled={submittingApp || (resumes.length > 0 && !selectedResumeId)}
                className="btn btn-primary px-6 py-2.5 text-sm font-semibold flex items-center gap-2"
              >
                {submittingApp ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Confirm & Submit</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
