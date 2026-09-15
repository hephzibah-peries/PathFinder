import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SkillTag } from '../../components/ui';
import MatchExplanationDrawer from '../../components/MatchExplanationDrawer';
import { internships } from '../../data/mock';
import type { MissingSkillEntry } from '../../components/MatchExplanationDrawer';

const filterGroups = [
  { title: 'Technology', options: ['Java', 'React', 'Python'] },
  { title: 'Work mode', options: ['Remote', 'Hybrid', 'On-site'] },
  { title: 'Duration', options: ['3 months', '6 months'] },
];

export default function InternshipSearch() {
  const [drawerInternship, setDrawerInternship] = useState<typeof internships[0] | null>(null);

  return (
    <>
      <div>
        <h2 className="mb-4.5 font-serif text-[22px]">Find your internship</h2>
        <div className="grid grid-cols-[250px_1fr] gap-7">
          <aside>
            <input
              className="mb-5 w-full rounded-lg border border-sand-line bg-paper-raised px-3 py-2.5 text-sm"
              placeholder="Search role or company"
            />
            {filterGroups.map((g) => (
              <div key={g.title} className="mb-5">
                <h4 className="mb-2 text-[12.5px] font-serif">{g.title}</h4>
                {g.options.map((o) => (
                  <label key={o} className="block py-1.5 text-[13px] text-ink-soft">
                    <input type="checkbox" className="mr-2" /> {o}
                  </label>
                ))}
              </div>
            ))}
          </aside>

          <div>
            {internships.map((i) => (
              <div key={i.id} className="card mb-3">
                <div className="flex items-start justify-between">
                  <Link to={`/student/internships/${i.id}`} className="flex flex-1 gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] bg-ink font-serif text-[15px] text-white">
                      {i.logo}
                    </div>
                    <div>
                      <b>{i.title}</b>
                      <div className="my-1 text-[12.5px] text-ink-soft">
                        {i.company} · {i.location} · {i.mode} · {i.duration} · Deadline {i.deadline}
                      </div>
                    </div>
                  </Link>
                  <div className="ml-4 text-right">
                    <span className="font-serif text-[15px] text-signal">{i.match}%</span>
                    <div className="text-[11px] text-ink-soft">match</div>
                  </div>
                </div>

                <div className="mt-2">
                  {i.matched.map((s) => (
                    <SkillTag key={s.name} label={s.name} state="have" source={s.source} />
                  ))}
                  {i.missing.map((s) => (
                    <SkillTag key={s.name} label={s.name} state="missing" />
                  ))}
                </div>

                {/* Why this match? inline button */}
                <button
                  id={`why-match-${i.id}`}
                  onClick={(e) => { e.preventDefault(); setDrawerInternship(i); }}
                  className="mt-2.5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-info hover:underline"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  Why this match?
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Drawer */}
      {drawerInternship && (
        <MatchExplanationDrawer
          open={!!drawerInternship}
          onClose={() => setDrawerInternship(null)}
          internshipTitle={drawerInternship.title}
          company={drawerInternship.company}
          overallMatch={drawerInternship.match}
          matched={drawerInternship.matched}
          missing={drawerInternship.missing as MissingSkillEntry[]}
          factorBreakdown={drawerInternship.factorBreakdown}
        />
      )}
    </>
  );
}
