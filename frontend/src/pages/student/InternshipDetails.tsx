import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ProgressBar, ScoreRing, SkillTag, WhyBox } from '../../components/ui';
import MatchExplanationDrawer from '../../components/MatchExplanationDrawer';
import { internships } from '../../data/mock';

export default function InternshipDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const internship = internships.find((i) => i.id === id) ?? internships[0];
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <div className="mx-auto max-w-[880px]">
        <div className="flex items-center gap-3.5">
          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[10px] bg-ink font-serif text-xl text-white">
            {internship.logo}
          </div>
          <div>
            <h2 className="m-0 font-serif text-[22px]">{internship.title}</h2>
            <p className="mt-0.5">
              {internship.company} · {internship.location} · {internship.mode} · {internship.duration} · Deadline {internship.deadline}
            </p>
          </div>
        </div>

        <div className="card mt-5.5">
          <div className="flex items-center gap-6.5">
            <ScoreRing score={internship.match} label="match" />
            <div className="flex-1">
              {internship.factorBreakdown.slice(0, 3).map((f) => (
                <div key={f.label} className="mb-2">
                  <div className="mb-1.5 text-[12.5px]">{f.label} — {f.score}%</div>
                  <ProgressBar value={f.score} warn={f.score < 70} />
                </div>
              ))}
            </div>
          </div>
          <WhyBox title="Why you match">
            Your Java, Spring Boot and SQL skills line up directly with the core requirements, and your
            Library Management System project used the same REST API pattern this role asks for. Your
            degree (BSc Data Science) satisfies the education requirement.
          </WhyBox>

          {/* Missing skill tags */}
          <div className="mt-3.5">
            {internship.missing.map((s) => (
              <SkillTag key={s.name} label={`${s.name} — not yet on your profile`} state="missing" />
            ))}
          </div>

          {/* Why this match? CTA */}
          <button
            id="why-match-btn"
            onClick={() => setDrawerOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-info-soft bg-info-soft px-4 py-2 text-[12.5px] font-semibold text-info transition-colors hover:bg-[#d6e0f5]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Why this match?
          </button>
        </div>

        <h2 className="my-9 font-serif text-[21px]">About this internship</h2>
        <p>
          You&apos;ll work within {internship.company}&apos;s platform engineering team, building and
          maintaining backend services that power their internal tools. Expect close mentorship and
          real production code from week one.
        </p>

        <div className="mt-2 grid grid-cols-2 gap-4.5">
          <div>
            <h3 className="text-[14.5px] font-serif">Required skills</h3>
            {internship.matched.map((s) => (
              <SkillTag key={s.name} label={s.name} state="have" source={s.source} />
            ))}
          </div>
          <div>
            <h3 className="text-[14.5px] font-serif">Preferred skills</h3>
            {internship.missing.map((s) => (
              <SkillTag key={s.name} label={s.name} state="missing" />
            ))}
            <SkillTag label="Git" state="have" source="verified" />
          </div>
        </div>

        <button onClick={() => navigate('/student/applications')} className="btn btn-primary mt-6.5 px-6 py-3">
          Apply Now
        </button>
      </div>

      {/* Match explanation drawer */}
      <MatchExplanationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        internshipTitle={internship.title}
        company={internship.company}
        overallMatch={internship.match}
        matched={internship.matched}
        missing={internship.missing}
        factorBreakdown={internship.factorBreakdown}
      />
    </>
  );
}
