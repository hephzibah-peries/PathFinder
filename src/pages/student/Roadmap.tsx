import { ProgressBar } from '../../components/ui';
import { roadmapStages } from '../../data/mock';

export default function Roadmap() {
  return (
    <div className="mx-auto max-w-[760px]">
      <h2 className="font-serif text-[22px]">Roadmap to Backend Software Engineer</h2>
      <p>62% complete</p>
      <div className="mb-6.5"><ProgressBar value={62} /></div>

      {roadmapStages.map((s, i) => (
        <div key={s.title} className="mb-5.5 flex gap-4">
          <div
            className={`flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${
              s.done ? 'bg-signal-soft text-signal' : 'bg-sand text-ink-soft'
            }`}
          >
            {s.done ? '\u2713' : i + 1}
          </div>
          <div>
            <b>{s.title}</b>
            <p className="mt-0.5 text-[13px]">{s.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
