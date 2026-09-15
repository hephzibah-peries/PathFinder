import { Link } from 'react-router-dom';
import { ProgressBar, ScoreRing, WhyBox } from '../../components/ui';
import { readiness } from '../../data/mock';

export default function Readiness() {
  return (
    <div className="mx-auto max-w-[900px]">
      <div className="card flex items-center gap-7.5">
        <ScoreRing score={readiness.score} label="Career Ready" size={160} />
        <div className="flex-1">
          {readiness.breakdown.map((b) => (
            <div key={b.label} className="mb-2.5">
              <div className="mb-1.5 text-[13px]">{b.label} \u2014 {b.value}%</div>
              <ProgressBar value={b.value} warn={b.warn} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4.5">
        <div className="card">
          <h3 className="mb-2.5 text-[15px] font-serif">Strengths</h3>
          {readiness.strengths.map((s) => (
            <p key={s} className="my-1 text-[13.5px]">&#10003; {s}</p>
          ))}
        </div>
        <div className="card">
          <h3 className="mb-2.5 text-[15px] font-serif">Where to improve</h3>
          {readiness.improvements.map((s) => (
            <p key={s} className="my-1 text-[13.5px] text-amber">&#9888; {s}</p>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <WhyBox title="AI career advice">
          Your technical foundation is ahead of most applicants at your level. The fastest way to raise
          your score is certifications and experience \u2014 a short cloud certificate and one part-time or
          volunteer technical role would likely move you from 82 to the high 80s within a term.
        </WhyBox>
      </div>

      <Link to="/student/roadmap" className="btn btn-primary mt-5 inline-block">
        View Career Roadmap
      </Link>
    </div>
  );
}
