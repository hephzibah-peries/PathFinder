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
    <div>
      <SectionTitle title="Applicants & Shortlists" />

      {error && (
        <div className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
          {error}
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        {/* Filters & Search Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-sand-line bg-sand/20 px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="text-[12.5px] font-semibold text-ink">Filter by role:</span>
            <select
              value={selectedInternshipId}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="form-select w-[240px] py-1.5 text-[12.5px] bg-white border border-sand-line rounded-lg"
            >
              <option value="all">All Internships ({applications.length})</option>
              {internships.map((job) => (
                <option key={job.id} value={String(job.id)}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
              width="14"
              height="14"
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
              placeholder="Search candidate or role..."
              className="form-input py-1.5 pl-9 text-[12.5px] w-[240px] border border-sand-line rounded-lg"
            />
          </div>
        </div>

        {/* Candidate Applications Table */}
        {loading ? (
          <div className="py-12 text-center text-ink-soft text-sm">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-signal border-t-transparent mx-auto mb-2" />
            Loading candidates...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-ink-soft text-sm">
            <p>No applicant candidates found.</p>
            {selectedInternshipId !== 'all' && (
              <button
                onClick={() => handleRoleChange('all')}
                className="mt-2 text-xs font-semibold text-signal hover:underline"
              >
                View candidates across all roles
              </button>
            )}
          </div>
        ) : (
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr className="bg-sand/30">
                {['Candidate', 'Role Applied', 'Applied Date', 'Current Status', 'Review Decision'].map((h) => (
                  <th
                    key={h}
                    className="border-b border-sand-line px-5 py-3.5 text-left text-[11.5px] font-semibold text-ink-soft uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const isUpdating = updatingId === c.id;

                return (
                  <tr key={c.id} className="table-row-hover transition-colors">
                    <td className="border-b border-sand-line px-5 py-4 font-semibold text-ink">
                      {c.studentName || `Student #${c.studentId || c.id}`}
                    </td>
                    <td className="border-b border-sand-line px-5 py-4 text-ink">
                      {c.internshipTitle || 'Internship'}
                    </td>
                    <td className="border-b border-sand-line px-5 py-4 text-ink-soft text-[12.5px]">
                      {c.appliedAt ? new Date(c.appliedAt).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="border-b border-sand-line px-5 py-4">
                      <Badge kind={statusBadge[c.status] || 'warn'}>{c.status}</Badge>
                    </td>
                    <td className="border-b border-sand-line px-5 py-4">
                      <div className="flex items-center gap-2">
                        <select
                          disabled={isUpdating}
                          value={c.status}
                          onChange={(e) => handleStatusChange(c.id, e.target.value)}
                          className="text-xs rounded border border-sand-line bg-paper px-2 py-1 font-medium text-ink focus:outline focus:outline-signal disabled:opacity-50"
                        >
                          <option value="APPLIED">Applied</option>
                          <option value="UNDER REVIEW">Under Review</option>
                          <option value="SHORTLISTED">Shortlist</option>
                          <option value="APPROVED">Approve / Offer</option>
                          <option value="REJECTED">Reject</option>
                        </select>
                        {isUpdating && (
                          <span className="text-[11px] text-signal font-semibold animate-pulse">Saving...</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
