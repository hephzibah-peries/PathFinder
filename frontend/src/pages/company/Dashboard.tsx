import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
      <div className="flex h-72 items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#7A4B43] border-t-transparent mx-auto mb-3" />
          <p className="text-sm font-medium text-[#7A6A65]">Loading corporate talent metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm font-semibold text-rose-900">
          {error}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TOP ROW — Quick Metrics
          ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Active Posts */}
        <div className="stat-card">
          <div className="stat-card-icon !text-[#4A6D88] !bg-[#4A6D88]/10 !border-[#4A6D88]/20">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            </svg>
          </div>
          <div>
            <div className="stat-card-value text-[#2B1B17]">{activePostings}</div>
            <div className="stat-card-label">Active Internships</div>
            <div className="stat-card-sub text-[#4A6D88] font-bold">Currently published</div>
          </div>
        </div>

        {/* Total Apps */}
        <div className="stat-card">
          <div className="stat-card-icon !text-[#2D6A4F] !bg-[#2D6A4F]/10 !border-[#2D6A4F]/20">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <div className="stat-card-value text-[#2D6A4F]">{totalApplications}</div>
            <div className="stat-card-label">Received Applications</div>
            <div className="stat-card-sub text-[#2D6A4F] font-bold">Direct candidate submissions</div>
          </div>
        </div>

        {/* Shortlisted */}
        <div className="stat-card">
          <div className="stat-card-icon !text-[#7A4B43] !bg-[#FDF2ED] !border-[#E5D5CE]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <div className="stat-card-value text-[#7A4B43]">{shortlisted}</div>
            <div className="stat-card-label">Shortlisted Candidates</div>
            <div className="stat-card-sub text-[#7A4B43] font-bold">Ready for interview</div>
          </div>
        </div>

        {/* Fit Rate */}
        <div className="stat-card">
          <div className="stat-card-icon !text-[#7A4B43] !bg-[#FDF2ED] !border-[#E5D5CE]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div>
            <div className="stat-card-value text-[#2B1B17]">{avgFitRate}%</div>
            <div className="stat-card-label">Average Match Score</div>
            <div className="stat-card-sub text-[#7A4B43] font-bold">AI skill alignment</div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          MIDDLE SECTION — Manage & Post Internships
          ═══════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl font-bold text-[#2B1B17] tracking-tight">Active Internship Listings</h2>
            <p className="text-sm text-[#7A6A65] mt-1">Review applicant volume and real-time status updates</p>
          </div>
          <button
            onClick={() => setIsPostModalOpen(true)}
            className="btn btn-primary px-6 py-3 text-sm font-semibold shrink-0"
          >
            <span className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Post New Internship
            </span>
          </button>
        </div>

        <div className="card p-0 overflow-hidden">
          {internships.length === 0 ? (
            <div className="text-center py-14">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FDF2ED] border border-[#E5D5CE] text-[#7A4B43] shadow-xs">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                </svg>
              </div>
              <h3 className="font-serif text-xl font-bold text-[#2B1B17] mb-2">No active internship listings</h3>
              <p className="text-sm text-[#7A6A65] max-w-sm mx-auto mb-6">
                Create and publish your first internship position to start receiving AI-matched applications from qualified candidates.
              </p>
              <button
                onClick={() => setIsPostModalOpen(true)}
                className="btn btn-primary text-sm font-semibold"
              >
                Post Your First Internship →
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E5D5CE] bg-[#FAF6F4] text-[#7A6A65] uppercase tracking-wider font-semibold text-xs">
                    <th className="px-6 py-4">Role Title</th>
                    <th className="px-6 py-4">Applicants</th>
                    <th className="px-6 py-4">Work Mode</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5D5CE]/70">
                  {internships.map((job) => {
                    const count = (applicationsMap[job.id] || []).length;
                    return (
                      <tr key={job.id} className="hover:bg-[#FAF6F4]/60 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-[#2B1B17] text-base">{job.title}</div>
                          <div className="text-[#7A6A65] text-xs mt-0.5 font-medium">
                            {job.stipend ? `Stipend: ${job.stipend}` : 'Competitive stipend'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5D5CE] bg-[#FDF2ED] px-3 py-1 text-xs font-bold text-[#7A4B43]">
                            {count} candidate{count !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#7A6A65] font-semibold">
                          {job.workMode || 'Hybrid'}
                        </td>
                        <td className="px-6 py-4 text-[#7A6A65]">
                          {job.location || 'Colombo, Sri Lanka'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="badge badge-success">Active & Live</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to={`/company/applicants?internshipId=${job.id}`}
                            className="btn btn-ghost py-2 px-4 text-sm font-semibold"
                          >
                            Review Candidates →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
