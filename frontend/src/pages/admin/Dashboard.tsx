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
    <div>
      <div className="mb-6.5 grid grid-cols-3 gap-4.5">
        <div className="card"><span className="text-[12.5px] text-ink-soft">Total students</span><div className="font-serif text-[30px]">5,240</div></div>
        <div className="card"><span className="text-[12.5px] text-ink-soft">Companies</span><div className="font-serif text-[30px]">328</div></div>
        <div className="card"><span className="text-[12.5px] text-ink-soft">Applications</span><div className="font-serif text-[30px]">18,430</div></div>
      </div>

      <SectionTitle title="Companies pending approval" />
      <table className="w-full border-collapse text-[13.5px]">
        <thead>
          <tr>
            {['Company', 'Industry', 'Location', 'Registered', ''].map((h) => (
              <th key={h} className="border-b border-sand-line px-2.5 py-2 text-left text-[11.5px] font-semibold text-ink-soft">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pendingCompanies.map((c) => (
            <tr key={c.name}>
              <td className="border-b border-sand-line px-2.5 py-3">{c.name}</td>
              <td className="border-b border-sand-line px-2.5 py-3">{c.industry}</td>
              <td className="border-b border-sand-line px-2.5 py-3">{c.location}</td>
              <td className="border-b border-sand-line px-2.5 py-3">{c.registered}</td>
              <td className="border-b border-sand-line px-2.5 py-3">
                <button className="btn btn-signal mr-2 px-3.5 py-1.5">Approve</button>
                <button className="btn btn-ghost px-3.5 py-1.5">Reject</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <SectionTitle title="Most in-demand skills" />
      <div className="card">
        {skillDemand.map((s) => (
          <div key={s.skill} className="mb-3 last:mb-0">
            <div className="mb-1.5 text-[13px]">{s.skill}</div>
            <ProgressBar value={s.value} warn={s.warn} />
          </div>
        ))}
      </div>
    </div>
  );
}
