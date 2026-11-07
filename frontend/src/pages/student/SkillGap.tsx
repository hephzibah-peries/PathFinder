import { ProgressBar, SkillTag, Badge, SectionTitle } from '../../components/ui';
import { skillGap } from '../../data/mock';

export default function SkillGap() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="m-0 font-serif text-3xl font-bold text-[#2B1B17]">Your Skill Gap Diagnostics</h2>
        <select className="form-select w-[280px] text-sm font-semibold">
          <option>Target role: {skillGap.targetRole}</option>
        </select>
      </div>

      <div className="card my-5">
        <div className="mb-2 text-sm font-semibold text-[#2B1B17]">Current skills vs target — {skillGap.currentPct}%</div>
        <ProgressBar value={skillGap.currentPct} />
        <hr className="my-5 border-[#E5D5CE]" />
        <div className="grid grid-cols-3 gap-5">
          {skillGap.have.map((s) => <div key={s.name}><SkillTag label={`${s.name} ✓`} state="have" source={s.source} /></div>)}
          {skillGap.missing.map((s) => <div key={s.name}><SkillTag label={`${s.name} ✕`} state="missing" /></div>)}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {skillGap.priorities.map((p) => (
          <div key={p.skill} className="card">
            <Badge kind={p.kind}>{p.level}</Badge>
            <h3 className="my-3 text-lg font-serif font-bold text-[#2B1B17]">{p.skill}</h3>
            <p className="text-sm text-[#7A6A65] leading-relaxed font-medium">{p.note}</p>
          </div>
        ))}
      </div>

      <SectionTitle title="Learning Roadmap" />
      {skillGap.roadmap.map((r, i) => (
        <div key={r.step} className="mb-6 flex gap-4">
          <div
            className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
              r.locked ? 'bg-[#FAF6F4] text-[#7A6A65] border border-[#E5D5CE]' : 'bg-[#EBF5F0] text-[#2D6A4F] border border-[#2D6A4F]/30'
            }`}
          >
            {i + 1}
          </div>
          <div>
            <b className="text-base font-bold text-[#2B1B17]">{r.step}</b>
            <p className="mt-1 text-sm text-[#7A6A65] leading-relaxed font-medium">{r.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
