import { ScoreRing, SkillTag, WhyBox, SectionTitle } from '../../components/ui';

export default function CandidateDetails() {
  return (
    <div className="mx-auto max-w-[880px]">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="m-0 font-serif text-[22px]">Alex Kumar</h2>
          <p className="mt-0.5">NSBM Green University \u00b7 BSc Data Science \u00b7 GPA 3.7 \u00b7 Colombo</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost">Reject</button>
          <button className="btn btn-signal">Shortlist</button>
        </div>
      </div>

      <div className="card mt-5">
        <div className="flex items-center gap-6.5">
          <ScoreRing score={94} label="match" />
          <div className="flex-1">
            <SkillTag label="\u2713 Java" state="have" />
            <SkillTag label="\u2713 Spring Boot" state="have" />
            <SkillTag label="\u2713 SQL" state="have" />
            <SkillTag label="\u2713 REST API" state="have" />
            <SkillTag label="\u2715 Docker" state="missing" />
          </div>
        </div>
        <WhyBox title="Why this candidate is a strong match">
          Alex&apos;s technical skills line up directly with your listed requirements, and their Library
          Management System project demonstrates the same backend patterns this role needs. Their degree
          matches your education requirement. This is decision support, not an automatic hiring
          recommendation \u2014 please review their profile and CV before proceeding.
        </WhyBox>
      </div>

      <SectionTitle title="Projects" />
      <div className="card">
        <b>Library Management System</b>
        <p className="my-1.5 text-[13px]">
          Spring Boot + PostgreSQL backend with a React admin panel. Sole backend developer.
        </p>
        <span className="text-[13px] font-semibold text-signal">View on GitHub</span>
      </div>

      <SectionTitle title="CV" />
      <div className="card flex items-center justify-between">
        <span>Alex_Kumar_CV.pdf \u00b7 uploaded 28 Aug 2026</span>
        <div className="flex gap-2">
          <button className="btn btn-ghost">Preview</button>
          <button className="btn btn-ghost">Download</button>
        </div>
      </div>
    </div>
  );
}
