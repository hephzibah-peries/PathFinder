import { ProgressBar } from '../../components/ui';
import { roadmapStages } from '../../data/mock';

export default function Roadmap() {
  return (
    <div className="mx-auto max-w-[780px]">
      <h2 className="font-serif text-3xl font-bold text-[#2B1B17]">Roadmap to Backend Software Engineer</h2>
      <p className="text-sm font-semibold text-[#7A6A65] mt-1 mb-2">62% complete</p>
      <div className="mb-7"><ProgressBar value={62} /></div>

      {roadmapStages.map((s, i) => (
        <div key={s.title} className="mb-6 flex gap-4">
          <div
            className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
              s.done ? 'bg-[#EBF5F0] text-[#2D6A4F] border border-[#2D6A4F]/30' : 'bg-[#FAF6F4] text-[#7A6A65] border border-[#E5D5CE]'
            }`}
          >
            {s.done ? '✓' : i + 1}
          </div>
          <div>
            <b className="text-base font-bold text-[#2B1B17]">{s.title}</b>
            <p className="mt-1 text-sm text-[#7A6A65] leading-relaxed font-medium">{s.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
