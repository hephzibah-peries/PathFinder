import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui';
import { applicationApi, Application } from '../../services/api';
import { applications as fallbackApplications } from '../../data/mock';

const statusBadge: Record<string, 'success' | 'warn' | 'error' | 'info'> = {
  SHORTLISTED: 'success',
  Shortlisted: 'success',
  APPROVED: 'success',
  Approved: 'success',
  'UNDER REVIEW': 'warn',
  'Under Review': 'warn',
  PENDING: 'warn',
  Pending: 'warn',
  APPLIED: 'info',
  Applied: 'info',
  REJECTED: 'error',
  Rejected: 'error',
};

const timelineSteps = ['Applied', 'Under Review', 'Shortlisted', 'Interview', 'Decision'];

export default function Applications() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchApplications() {
      try {
        setLoading(true);
        setError(null);
        const data = await applicationApi.getMyApplications();
        setApps(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load applications');
        setApps(fallbackApplications as any);
      } finally {
        setLoading(false);
      }
    }
    fetchApplications();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#2B1B17] tracking-tight">Application Tracker</h1>
          <p className="text-sm text-[#7A6A65] mt-1">Real-time status updates and corporate review milestones</p>
        </div>
        {error && (
          <span className="badge badge-warn self-start sm:self-auto">
            Offline Demo Data
          </span>
        )}
      </div>

      {/* ── Timeline Tracker ── */}
      <div className="card">
        <h3 className="font-serif text-base font-bold text-[#2B1B17] mb-5">Application Lifecycle Milestones</h3>
        <div className="flex items-center">
          {timelineSteps.map((step, i) => (
            <div key={step} className="relative flex-1 text-center text-xs text-[#7A6A65]">
              {i > 0 && <div className="absolute left-[-50%] top-[7px] h-0.5 w-full bg-[#E5D5CE]" />}
              <div
                className={`mx-auto mb-2.5 h-3.5 w-3.5 rounded-full border-2 ${
                  i === 0
                    ? 'bg-[#7A4B43] border-[#5E342D]'
                    : i === 1
                      ? 'bg-[#E6A694] border-[#CD8C7A]'
                      : 'bg-[#FAF6F4] border-[#E5D5CE]'
                }`}
              />
              <span className={`font-bold ${i <= 1 ? 'text-[#2B1B17]' : 'text-[#7A6A65]'}`}>{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[#7A6A65] text-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#7A4B43] border-t-transparent mx-auto mb-3" />
            Synchronizing application states...
          </div>
        ) : apps.length === 0 ? (
          <div className="py-16 text-center text-[#7A6A65] text-sm">
            <p className="mb-4 text-base">You haven&apos;t submitted any applications yet.</p>
            <Link to="/student/internships" className="btn btn-primary text-sm font-semibold">
              Explore Available Internships →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#E5D5CE] bg-[#FAF6F4] text-[#7A6A65] uppercase tracking-wider font-semibold text-xs">
                  <th className="px-6 py-4">Role Title</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Submission Date</th>
                  <th className="px-6 py-4">Review Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5D5CE]/70">
                {apps.map((a: any, idx: number) => {
                  const roleTitle = a.internshipTitle || a.internship || 'Software Intern';
                  const compName = a.companyName || a.company || 'Enterprise Partner';
                  const appliedDate = a.appliedAt
                    ? new Date(a.appliedAt).toLocaleDateString()
                    : a.applied || 'Recent';
                  const statusStr = a.status || 'PENDING';

                  return (
                    <tr key={a.id || idx} className="hover:bg-[#FAF6F4]/60 transition-colors">
                      <td className="px-6 py-4 font-bold text-[#2B1B17] text-base">
                        {roleTitle}
                      </td>
                      <td className="px-6 py-4 text-[#7A6A65] font-semibold">{compName}</td>
                      <td className="px-6 py-4 text-[#7A6A65]">{appliedDate}</td>
                      <td className="px-6 py-4">
                        <Badge kind={statusBadge[statusStr] || 'info'}>{statusStr}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {a.internshipId ? (
                          <Link
                            to={`/student/internships/${a.internshipId}`}
                            className="btn btn-ghost py-2 px-4 text-sm font-semibold"
                          >
                            View Role →
                          </Link>
                        ) : (
                          <span className="text-[#7A6A65] text-sm">Applied</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <Link to="/student/internships" className="btn btn-secondary text-sm font-semibold">
          Browse More Open Positions →
        </Link>
      </div>
    </div>
  );
}
