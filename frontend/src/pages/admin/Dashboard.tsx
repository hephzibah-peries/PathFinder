import { ProgressBar, SectionTitle } from '../../components/ui';
import { pendingCompanies } from '../../data/mock';

const skillDemand = [
  { skill: 'Java', value: 82 },
  { skill: 'React', value: 74 },
  { skill: 'Python', value: 68 },
  { skill: 'Docker', value: 41, warn: true },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card">
          <span className="text-sm font-semibold text-[#7A6A65]">Total Students</span>
          <div className="font-serif text-4xl font-bold text-[#2B1B17] mt-1">5,240</div>
        </div>
        <div className="card">
          <span className="text-sm font-semibold text-[#7A6A65]">Registered Companies</span>
          <div className="font-serif text-4xl font-bold text-[#2B1B17] mt-1">328</div>
        </div>
        <div className="card">
          <span className="text-sm font-semibold text-[#7A6A65]">Live Applications</span>
          <div className="font-serif text-4xl font-bold text-[#2B1B17] mt-1">18,430</div>
        </div>
      </div>

      <SectionTitle title="Companies Pending Approval" />
      <div className="card p-0 overflow-hidden">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#E5D5CE] bg-[#FAF6F4] text-[#7A6A65] uppercase tracking-wider font-semibold text-xs">
              {['Company', 'Industry', 'Location', 'Registered', 'Actions'].map((h) => (
                <th key={h} className="px-6 py-4 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5D5CE]/70">
            {pendingCompanies.map((c) => (
              <tr key={c.name} className="hover:bg-[#FAF6F4]/60 transition-colors">
                <td className="px-6 py-4 font-bold text-[#2B1B17] text-base">{c.name}</td>
                <td className="px-6 py-4 text-[#7A6A65] font-semibold">{c.industry}</td>
                <td className="px-6 py-4 text-[#7A6A65]">{c.location}</td>
                <td className="px-6 py-4 text-[#7A6A65]">{c.registered}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button className="btn btn-primary px-4 py-2 text-sm font-semibold">Approve</button>
                    <button className="btn btn-ghost px-4 py-2 text-sm font-semibold text-[#7A6A65] hover:text-rose-600">Reject</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionTitle title="Most In-Demand Skills" />
      <div className="card space-y-4">
        {skillDemand.map((s) => (
          <div key={s.skill}>
            <div className="mb-1.5 flex justify-between text-sm font-semibold text-[#2B1B17]">
              <span>{s.skill}</span>
              <span className="text-[#7A6A65]">{s.value}% demand</span>
            </div>
            <ProgressBar value={s.value} warn={s.warn} />
          </div>
        ))}
      </div>
    </div>
  );
}
