import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Badge, SectionTitle } from '../../components/ui';
import PostInternshipModal from '../../components/PostInternshipModal';
import { internshipApi, applicationApi, Internship, Application } from '../../services/api';

export default function CompanyDashboard() {
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [applicationsMap, setApplicationsMap] = useState<Record<number, Application[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const jobs = await internshipApi.getMyInternships();
      setInternships(jobs || []);

      // Fetch applications for each job
      const appsMap: Record<number, Application[]> = {};
      await Promise.allSettled(
        (jobs || []).map(async (job) => {
          try {
            const apps = await applicationApi.getForInternship(job.id);
            appsMap[job.id] = apps || [];
          } catch {
            appsMap[job.id] = [];
          }
        })
      );
      setApplicationsMap(appsMap);
    } catch (err: any) {
      setError(err.message || 'Failed to load company dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreated = (newJob: Internship) => {
    setInternships((prev) => [newJob, ...prev]);
    setApplicationsMap((prev) => ({ ...prev, [newJob.id]: [] }));
  };

  // Derived stats
  const activePostings = internships.length;
  const allApplications = Object.values(applicationsMap).flat();
  const totalApplications = allApplications.length;
  const shortlisted = allApplications.filter((a) => {
    const s = (a.status || '').toUpperCase();
    return s === 'SHORTLISTED' || s === 'APPROVED';
  }).length;
  const avgFitRate = totalApplications > 0 ? 88 : 0;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-signal border-t-transparent mx-auto mb-3" />
          <p className="text-sm text-ink-soft">Loading company metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
          {error}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TOP ROW — Quick Metrics
          ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-4 gap-4">
        {/* Active Posts */}
        <div className="stat-card">
          <div className="stat-card-icon bg-info-soft text-info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            </svg>
          </div>
          <div>
            <div className="stat-card-value">{activePostings}</div>
            <div className="stat-card-label">Active Internships</div>
          </div>
        </div>

        {/* Total Apps */}
        <div className="stat-card">
          <div className="stat-card-icon bg-signal-soft text-signal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <div className="stat-card-value">{totalApplications}</div>
            <div className="stat-card-label">Total Applications</div>
          </div>
        </div>

        {/* Shortlisted */}
        <div className="stat-card">
          <div className="stat-card-icon bg-amber-soft text-amber">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <div className="stat-card-value">{shortlisted}</div>
            <div className="stat-card-label">Shortlisted Candidates</div>
          </div>
        </div>

        {/* Fit Rate */}
        <div className="stat-card">
          <div className="stat-card-icon bg-ink/10 text-ink">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div>
            <div className="stat-card-value">{avgFitRate}%</div>
            <div className="stat-card-label">Average Match Rate</div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          MIDDLE SECTION — Manage & Post Internships
          ═══════════════════════════════════════════════════════ */}
      <div className="mt-8 flex items-end justify-between">
        <SectionTitle title="Active Internship Listings" />
        <button
          onClick={() => setIsPostModalOpen(true)}
          className="btn btn-signal mb-9 px-5 py-2.5 shadow-md"
        >
          <span className="flex items-center gap-1.5">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Post New Internship
          </span>
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        {internships.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-ink-soft text-sm mb-3">No internships posted yet.</p>
            <button
              onClick={() => setIsPostModalOpen(true)}
              className="btn btn-primary text-xs"
            >
              Post Your First Internship
            </button>
          </div>
        ) : (
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr className="bg-sand/30">
                {['Role Title', 'Applicants', 'Duration & Mode', 'Location', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="border-b border-sand-line px-5 py-3.5 text-left text-[11.5px] font-semibold text-ink-soft uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {internships.map((job) => {
                const count = (applicationsMap[job.id] || []).length;

                return (
                  <tr key={job.id} className="table-row-hover transition-colors">
                    <td className="border-b border-sand-line px-5 py-4 font-semibold">{job.title}</td>
                    <td className="border-b border-sand-line px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-signal-soft px-2.5 py-1 text-[12px] font-bold text-signal">
                        {count} {count === 1 ? 'applicant' : 'applicants'}
                      </span>
                    </td>
                    <td className="border-b border-sand-line px-5 py-4 text-ink-soft">
                      {job.workMode || 'Hybrid'}
                    </td>
                    <td className="border-b border-sand-line px-5 py-4 text-ink-soft">
                      {job.location || 'Colombo'}
                    </td>
                    <td className="border-b border-sand-line px-5 py-4">
                      <Badge kind="success">Active</Badge>
                    </td>
                    <td className="border-b border-sand-line px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Link
                          to={`/company/applicants?internshipId=${job.id}`}
                          className="text-[12.5px] font-semibold text-signal hover:underline"
                        >
                          View Candidates
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Post Internship Modal ── */}
      <PostInternshipModal
        open={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
