import { useState, useEffect } from 'react';
import { applicationApi, Application } from '../../services/api';

const statusBadge: Record<string, string> = {
  SHORTLISTED: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  Shortlisted: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  APPROVED: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  Approved: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  'UNDER REVIEW': 'border-amber-300 bg-amber-50 text-amber-900',
  'Under Review': 'border-amber-300 bg-amber-50 text-amber-900',
  PENDING: 'border-amber-300 bg-amber-50 text-amber-900',
  Pending: 'border-amber-300 bg-amber-50 text-amber-900',
  APPLIED: 'border-sky-300 bg-sky-50 text-sky-900',
  Applied: 'border-sky-300 bg-sky-50 text-sky-900',
  REJECTED: 'border-rose-300 bg-rose-50 text-rose-900',
  Rejected: 'border-rose-300 bg-rose-50 text-rose-900',
};

export default function Applications() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const appsData = await applicationApi.getMyApplications();
      setApps(appsData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load application data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      {/* ── Page Header ── */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-[#2B1B17] tracking-tight">My Applications</h1>
        <p className="text-base text-[#7A6A65] mt-1">
          Track and monitor the status of all your submitted internship applications
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm font-semibold text-rose-900">
          {error}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          Applied Companies List
          ══════════════════════════════════════════════════════════ */}
      <div className="card p-0 overflow-hidden">
        <div className="p-6 border-b border-[#E5D5CE]">
          <h2 className="font-serif text-xl font-bold text-[#2B1B17]">Applied Companies</h2>
          <p className="text-sm text-[#7A6A65] mt-0.5">Summary of all internship applications submitted from your profile</p>
        </div>

        {loading ? (
          <div className="py-16 text-center text-[#7A6A65] text-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#7A4B43] border-t-transparent mx-auto mb-3" />
            Loading application history...
          </div>
        ) : apps.length === 0 ? (
          <div className="py-16 text-center text-[#7A6A65] text-sm">
            <p className="mb-2 text-base font-semibold text-[#2B1B17]">No applications submitted yet</p>
            <p className="text-sm text-[#7A6A65]">
              Head to <strong>Explore Internships</strong> to discover opportunities and submit your CV.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#E5D5CE] bg-[#FAF6F4] text-[#7A6A65] uppercase tracking-wider font-semibold text-xs">
                  <th className="px-6 py-4">Company Name</th>
                  <th className="px-6 py-4">Position</th>
                  <th className="px-6 py-4">Applied Date</th>
                  <th className="px-6 py-4">Application Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5D5CE]">
                {apps.map((a: any, idx: number) => {
                  const compName = a.companyName || a.company || 'Corporate Partner';
                  const roleTitle = a.internshipTitle || a.internship || 'Software Engineer Intern';
                  const appliedDate = a.appliedAt
                    ? new Date(a.appliedAt).toLocaleDateString()
                    : 'Recent';
                  const statusStr = a.status || 'PENDING';
                  const badgeClass = statusBadge[statusStr] || 'border-amber-300 bg-amber-50 text-amber-900';

                  return (
                    <tr key={a.id || idx} className="hover:bg-[#FAF6F4]/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-[#2B1B17] text-base">
                        {compName}
                      </td>
                      <td className="px-6 py-4 font-semibold text-[#7A6A65]">
                        {roleTitle}
                      </td>
                      <td className="px-6 py-4 text-[#7A6A65]">
                        {appliedDate}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${badgeClass}`}>
                          {statusStr}
                        </span>
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
