import { ProgressBar, SkillTag, Badge, SectionTitle } from '../../components/ui';
import { skillGap } from '../../data/mock';

export default function SkillGap() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="m-0 font-serif text-[22px]">Your skill gap</h2>
        <select className="rounded-lg border border-sand-line px-3 py-2 text-sm">
          <option>Target role: {skillGap.targetRole}</option>
        </select>
      </div>

      <div className="card my-4.5">
        <div className="mb-1.5 text-[12.5px]">Current skills vs target \u2014 {skillGap.currentPct}%</div>
        <ProgressBar value={skillGap.currentPct} />
        <hr className="my-4.5 border-sand-line" />
        <div className="grid grid-cols-3 gap-4.5">
          {skillGap.have.map((s) => <div key={s.name}><SkillTag label={`${s.name} ✓`} state="have" source={s.source} /></div>)}
          {skillGap.missing.map((s) => <div key={s.name}><SkillTag label={`${s.name} ✕`} state="missing" /></div>)}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4.5">
        {skillGap.priorities.map((p) => (
          <div key={p.skill} className="card">
            <Badge kind={p.kind}>{p.level}</Badge>
            <h3 className="my-2.5 text-[15px] font-serif">{p.skill}</h3>
            <p className="text-[13px]">{p.note}</p>
          </div>
        ))}
      </div>

      <SectionTitle title="Learning roadmap" />
      {skillGap.roadmap.map((r, i) => (
        <div key={r.step} className="mb-5.5 flex gap-4">
          <div
            className={`flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${
              r.locked ? 'bg-sand text-ink-soft' : 'bg-signal-soft text-signal'
            }`}
          >
            {i + 1}
          </div>
          <div>
            <b>{r.step}</b>
            <p className="mt-0.5 text-[13px]">{r.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
