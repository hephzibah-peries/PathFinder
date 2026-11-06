import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui';
import { applicationApi } from '../../services/api';
import { applications as fallbackApplications } from '../../data/mock';

const statusBadge: Record<string, 'success' | 'warn' | 'error' | 'info'> = {
  Shortlisted: 'success',
  'Under Review': 'warn',
  Pending: 'warn',
  APPLIED: 'info',
  APPROVED: 'success',
  REJECTED: 'error',
  Rejected: 'error',
};

const timelineSteps = ['Applied', 'Under Review', 'Shortlisted', 'Interview', 'Decision'];

export default function Applications() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchApplications() {
      try {
        setLoading(true);
        setError(null);
        const data = await applicationApi.getMyApplications();
        if (data && data.length > 0) {
          setApps(data);
        } else {
          setApps(fallbackApplications);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load applications');
        setApps(fallbackApplications);
      } finally {
        setLoading(false);
      }
    }
    fetchApplications();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-[22px]">Your applications</h2>
        {error && (
          <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
            Note: Showing sample applications ({error})
          </span>
        )}
      </div>

      <div className="card my-4.5">
        <b>Active Application Tracker</b>
        <div className="my-4.5 flex items-center">
          {timelineSteps.map((step, i) => (
            <div key={step} className="relative flex-1 text-center text-xs text-ink-soft">
              {i > 0 && <div className="absolute left-[-50%] top-[5px] h-px w-full bg-sand-line" />}
              <div
                className="mx-auto mb-1.5 h-[11px] w-[11px] rounded-full"
                style={{ background: i === 0 ? '#2F6F4F' : i === 1 ? '#B7791F' : '#DED6C4' }}
              />
              {step}
            </div>
          ))}
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-sm text-ink-soft">
            Loading your applications from backend...
          </div>
        ) : (
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr className="bg-sand/30">
                {['Internship', 'Company', 'Applied Date', 'Match', 'Status'].map((h) => (
                  <th key={h} className="border-b border-sand-line px-4 py-3 text-left text-[11.5px] font-semibold text-ink-soft uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apps.map((a: any, idx: number) => {
                const roleTitle = a.internshipTitle || a.internship || 'Software Intern';
                const compName = a.companyName || a.company || 'Enterprise Partner';
                const appliedDate = a.appliedAt
                  ? new Date(a.appliedAt).toLocaleDateString()
                  : a.applied || 'Recent';
                const matchPct = a.match || 88;
                const statusStr = a.status || 'Pending';

                return (
                  <tr key={a.id || idx} className="hover:bg-sand/20 transition">
                    <td className="border-b border-sand-line px-4 py-3.5 font-semibold text-ink">
                      {roleTitle}
                    </td>
                    <td className="border-b border-sand-line px-4 py-3.5 text-ink-soft">{compName}</td>
                    <td className="border-b border-sand-line px-4 py-3.5 text-ink-soft">{appliedDate}</td>
                    <td className="border-b border-sand-line px-4 py-3.5">
                      <span className="font-semibold text-signal">{matchPct}%</span>
                    </td>
                    <td className="border-b border-sand-line px-4 py-3.5">
                      <Badge kind={statusBadge[statusStr] || 'info'}>{statusStr}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-5">
        <Link to="/student/internships" className="btn btn-secondary text-sm">
          Browse More Internships
        </Link>
      </div>
    </div>
  );
}
