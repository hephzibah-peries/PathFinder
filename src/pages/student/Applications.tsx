import { Badge } from '../../components/ui';
import { applications } from '../../data/mock';

const statusBadge = {
  Shortlisted: 'success',
  'Under Review': 'warn',
  Rejected: 'error',
} as const;

const timelineSteps = ['Applied', 'Under Review', 'Shortlisted', 'Interview', 'Decision'];

export default function Applications() {
  return (
    <div>
      <h2 className="font-serif text-[22px]">Your applications</h2>

      <div className="card my-4.5">
        <b>Application submitted \u2014 Software Engineer Intern, Nimbus Systems</b>
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

      <table className="w-full border-collapse text-[13.5px]">
        <thead>
          <tr>
            {['Internship', 'Company', 'Applied', 'Match', 'Status'].map((h) => (
              <th key={h} className="border-b border-sand-line px-2.5 py-2 text-left text-[11.5px] font-semibold text-ink-soft">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {applications.map((a) => (
            <tr key={a.internship}>
              <td className="border-b border-sand-line px-2.5 py-3">{a.internship}</td>
              <td className="border-b border-sand-line px-2.5 py-3">{a.company}</td>
              <td className="border-b border-sand-line px-2.5 py-3">{a.applied}</td>
              <td className="border-b border-sand-line px-2.5 py-3">{a.match}%</td>
              <td className="border-b border-sand-line px-2.5 py-3"><Badge kind={statusBadge[a.status]}>{a.status}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
