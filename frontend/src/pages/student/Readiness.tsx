import { Link } from 'react-router-dom';
import { ProgressBar, ScoreRing, WhyBox } from '../../components/ui';
import { readiness } from '../../data/mock';

export default function Readiness() {
  return (
    <div className="mx-auto max-w-[900px]">
      <div className="card flex items-center gap-8">
        <ScoreRing score={readiness.score} label="Career Ready" size={160} />
        <div className="flex-1">
          {readiness.breakdown.map((b) => (
            <div key={b.label} className="mb-3">
              <div className="mb-1.5 text-sm font-semibold text-[#2B1B17]">{b.label} — {b.value}%</div>
              <ProgressBar value={b.value} warn={b.warn} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-5">
        <div className="card">
          <h3 className="mb-3 text-lg font-serif font-bold text-[#2B1B17]">Strengths</h3>
          {readiness.strengths.map((s) => (
            <p key={s} className="my-1.5 text-sm text-[#2D6A4F] font-semibold">&#10003; {s}</p>
          ))}
        </div>
        <div className="card">
          <h3 className="mb-3 text-lg font-serif font-bold text-[#2B1B17]">Where to improve</h3>
          {readiness.improvements.map((s) => (
            <p key={s} className="my-1.5 text-sm text-[#7A4B43] font-semibold">&#9888; {s}</p>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <WhyBox title="AI career advice">
          Your technical foundation is ahead of most applicants at your level. The fastest way to raise
          your score is certifications and experience — a short cloud certificate and one part-time or
          volunteer technical role would likely move you from 82 to the high 80s within a term.
        </WhyBox>
      </div>

      <Link to="/student/roadmap" className="btn btn-primary mt-6 inline-block px-7 py-3.5 text-base font-semibold">
        View Career Roadmap
      </Link>
    </div>
  );
}
