import { Link } from 'react-router-dom';
import { Badge, SectionTitle } from '../../components/ui';
import { companyApplicants } from '../../data/mock';

const statusBadge = { Shortlisted: 'success', 'Under Review': 'warn' } as const;

export default function Applicants() {
  return (
    <div>
      <SectionTitle title="Applicants & Shortlists" />
      
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-sand-line bg-sand/20 px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="text-[12.5px] font-semibold text-ink">Filter by role:</span>
            <select className="form-select w-[240px] py-1.5 text-[12.5px] bg-white">
              <option>All Internships</option>
              <option>Backend Java Intern</option>
              <option>Frontend Developer Intern</option>
              <option>DevOps Intern</option>
            </select>
          </div>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" placeholder="Search by name or uni..." className="form-input py-1.5 pl-9 text-[12.5px] w-[220px]" />
          </div>
        </div>

        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr className="bg-sand/30">
              {['Candidate', 'University', 'Top Skills', 'AI Match', 'Status', 'Action'].map((h) => (
                <th key={h} className="border-b border-sand-line px-5 py-3.5 text-left text-[11.5px] font-semibold text-ink-soft uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {companyApplicants.map((c) => (
              <tr key={c.name} className="table-row-hover transition-colors">
                <td className="border-b border-sand-line px-5 py-4 font-semibold">{c.name}</td>
                <td className="border-b border-sand-line px-5 py-4 text-ink-soft">{c.university}</td>
                <td className="border-b border-sand-line px-5 py-4 text-[12.5px]">{c.skills}</td>
                <td className="border-b border-sand-line px-5 py-4">
                  <span className="inline-flex items-center justify-center rounded-md bg-signal-soft px-2 py-1 font-serif text-[14px] font-bold text-signal">
                    {c.match}%
                  </span>
                </td>
                <td className="border-b border-sand-line px-5 py-4">
                  <Badge kind={statusBadge[c.status]}>{c.status}</Badge>
                </td>
                <td className="border-b border-sand-line px-5 py-4">
                  <Link to="/company/applicants/alex-kumar" className="text-[12.5px] font-semibold text-signal hover:underline">
                    View Profile
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
