import { SkillTag, ProgressBar, SectionTitle } from '../../components/ui';
import { studentProfile, studentPreferences } from '../../data/mock';

export default function StudentProfile() {
  return (
    <div className="mx-auto max-w-[880px]">
      {/* ── Profile Header ── */}
      <div className="card flex items-center justify-between bg-gradient-to-br from-signal-soft/60 to-paper-raised">
        <div className="flex items-center gap-5">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-signal text-[22px] font-bold text-white">
            {studentProfile.avatar}
          </div>
          <div>
            <h1 className="m-0 font-serif text-[24px]">{studentProfile.name}</h1>
            <p className="mt-0.5 text-[13.5px] text-ink-soft">
              {studentProfile.degree} · {studentProfile.university} · GPA {studentProfile.gpa}
            </p>
            <p className="mt-0.5 text-[12.5px] text-ink-soft">{studentProfile.email} · {studentProfile.phone}</p>
          </div>
        </div>
        <button className="btn btn-ghost">Edit Profile</button>
      </div>

      {/* ── Profile Completion ── */}
      <div className="card mt-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="m-0 text-[14px] font-serif">Profile Completion</h3>
            <p className="mt-0.5 text-[12.5px] text-ink-soft">{studentProfile.completionTip}</p>
          </div>
          <span className="font-serif text-[22px] font-bold text-signal">{studentProfile.profileCompletion}%</span>
        </div>
        <div className="mt-3">
          <ProgressBar value={studentProfile.profileCompletion} />
        </div>
      </div>

      {/* ── Education ── */}
      <SectionTitle title="Education" action={<button className="text-[13px] font-semibold text-signal">Edit</button>} />
      <div className="space-y-3">
        {studentProfile.education.map((edu) => (
          <div key={edu.institution} className="card">
            <div className="flex items-start justify-between">
              <div>
                <b className="text-[14.5px]">{edu.institution}</b>
                <p className="mt-0.5 text-[13px] text-ink-soft">{edu.degree}</p>
              </div>
              <div className="text-right">
                <span className="text-[12.5px] text-ink-soft">{edu.period}</span>
                {edu.gpa && <div className="mt-0.5 text-[13px] font-semibold text-signal">GPA {edu.gpa}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Skills ── */}
      <SectionTitle title="Skills" action={<button className="text-[13px] font-semibold text-signal">Edit</button>} />
      <div className="card">
        <div className="mb-4">
          <div className="mb-2 text-[11.5px] font-semibold uppercase tracking-wider text-ink-soft">Verified (via Assessment)</div>
          {studentProfile.skills
            .filter((s) => s.source === 'verified')
            .map((s) => <SkillTag key={s.name} label={s.name} state="have" source={s.source} />)}
        </div>
        <div>
          <div className="mb-2 text-[11.5px] font-semibold uppercase tracking-wider text-ink-soft">Self-Declared</div>
          {studentProfile.skills
            .filter((s) => s.source === 'self')
            .map((s) => <SkillTag key={s.name} label={s.name} source={s.source} />)}
        </div>
      </div>

      {/* ── Projects ── */}
      <SectionTitle title="Projects" action={<button className="text-[13px] font-semibold text-signal">Add Project</button>} />
      <div className="space-y-3">
        {studentProfile.projects.map((p) => (
          <div key={p.title} className="card">
            <div className="flex items-start justify-between">
              <div>
                <b className="text-[14.5px]">{p.title}</b>
                <p className="mt-1 text-[12.5px] text-ink-soft">{p.tech}</p>
              </div>
              <button className="text-[12.5px] font-semibold text-signal">Edit</button>
            </div>
            <p className="mt-2 text-[13px]">{p.description}</p>
          </div>
        ))}
      </div>

      {/* ── Certifications ── */}
      <SectionTitle title="Certifications" action={<button className="text-[13px] font-semibold text-signal">Add</button>} />
      <div className="space-y-3">
        {studentProfile.certifications.map((c) => (
          <div key={c.title} className="card flex items-center justify-between">
            <div>
              <b className="text-[14.5px]">{c.title}</b>
              <p className="mt-0.5 text-[12.5px] text-ink-soft">{c.issuer} · {c.date}</p>
            </div>
            <button className="text-[12.5px] font-semibold text-signal">Edit</button>
          </div>
        ))}
      </div>

      {/* ── Preferences ── */}
      <SectionTitle title="Preferences" action={<button className="text-[13px] font-semibold text-signal">Edit</button>} />
      <div className="card">
        <dl className="grid grid-cols-2 gap-4">
          {[
            { label: 'Preferred Location', value: studentPreferences.preferredLocation },
            { label: 'Work Mode', value: studentPreferences.workMode },
            { label: 'Availability', value: studentPreferences.availability },
            { label: 'Career Goal', value: studentPreferences.careerGoal },
          ].map((item) => (
            <div key={item.label}>
              <dt className="text-[11.5px] font-semibold text-ink-soft">{item.label}</dt>
              <dd className="mt-0.5 text-[14px] font-medium">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
