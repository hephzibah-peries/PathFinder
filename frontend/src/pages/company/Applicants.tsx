import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge, SectionTitle } from '../../components/ui';
import { internshipApi, applicationApi, Internship, Application } from '../../services/api';

const statusBadge: Record<string, 'success' | 'warn' | 'error' | 'info'> = {
  SHORTLISTED: 'success',
  Shortlisted: 'success',
  APPROVED: 'success',
  Approved: 'success',
  'UNDER REVIEW': 'warn',
  'Under Review': 'warn',
  PENDING: 'warn',
  Pending: 'warn',
  REJECTED: 'error',
  Rejected: 'error',
  APPLIED: 'info',
  Applied: 'info',
};

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
      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, status: newStatus } : app))
      );
    } catch (err: any) {
      alert(`Failed to update application status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = applications.filter((app) => {
    const term = searchQuery.toLowerCase();
    if (!term) return true;
    return (
      (app.studentName && app.studentName.toLowerCase().includes(term)) ||
      (app.internshipTitle && app.internshipTitle.toLowerCase().includes(term)) ||
      (app.status && app.status.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      <SectionTitle title="Applicants & Talent Pipeline" />

      {error && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm font-semibold text-rose-900">
          {error}
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        {/* Filters & Search Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5D5CE] bg-[#FAF6F4] px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold uppercase tracking-wider text-[#7A6A65]">Filter Position:</span>
            <select
              value={selectedInternshipId}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="form-select w-[280px] py-2 text-sm font-medium"
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
              width="16"
              height="16"
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
              placeholder="Search candidate name or status..."
              className="form-input py-2 pl-10 text-sm w-[280px]"
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
            <p className="mb-2 text-base">No applicant candidates found for this selection.</p>
            {selectedInternshipId !== 'all' && (
              <button
                onClick={() => handleRoleChange('all')}
                className="text-sm text-[#7A4B43] font-bold hover:underline"
              >
                Clear filter to view all candidates
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#E5D5CE] bg-[#FAF6F4] text-[#7A6A65] uppercase tracking-wider font-semibold text-xs">
                  <th className="px-6 py-4">Candidate</th>
                  <th className="px-6 py-4">Target Internship</th>
                  <th className="px-6 py-4">Applied Date</th>
                  <th className="px-6 py-4">Review Status</th>
                  <th className="px-6 py-4 text-right">Update Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5D5CE]/70">
                {filtered.map((app) => {
                  const initial = (app.studentName || 'S').charAt(0).toUpperCase();
                  const isUpdating = updatingId === app.id;

                  return (
                    <tr key={app.id} className="hover:bg-[#FAF6F4]/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FAF6F4] border border-[#E5D5CE] text-sm font-bold text-[#2B1B17] shadow-xs">
                            {initial}
                          </div>
                          <div>
                            <div className="font-bold text-[#2B1B17] text-base">
                              {app.studentName || `Student #${app.studentId || app.id}`}
                            </div>
                            <div className="text-xs text-[#7A6A65] font-medium">Verified PathFinder Profile</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-[#7A6A65] font-semibold">
                        {app.internshipTitle || 'General Application'}
                      </td>

                      <td className="px-6 py-4 text-[#7A6A65]">
                        {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'Recent'}
                      </td>

                      <td className="px-6 py-4">
                        <Badge kind={statusBadge[app.status] || 'warn'}>{app.status}</Badge>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {isUpdating ? (
                            <span className="text-sm text-[#7A4B43] animate-pulse font-bold">Updating...</span>
                          ) : (
                            <select
                              value={app.status}
                              onChange={(e) => handleStatusChange(app.id, e.target.value)}
                              className="form-select py-1.5 px-3 text-sm font-semibold w-[150px]"
                            >
                              <option value="APPLIED">Applied</option>
                              <option value="UNDER REVIEW">Under Review</option>
                              <option value="SHORTLISTED">Shortlisted</option>
                              <option value="APPROVED">Approved</option>
                              <option value="REJECTED">Rejected</option>
                            </select>
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
    </div>
  );
}
