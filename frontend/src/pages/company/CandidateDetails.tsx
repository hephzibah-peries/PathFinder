import { ScoreRing, SkillTag, WhyBox, SectionTitle } from '../../components/ui';

export default function CandidateDetails() {
  return (
    <div className="mx-auto max-w-[880px]">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="m-0 font-serif text-3xl font-bold text-[#2B1B17]">Alex Kumar</h2>
          <p className="mt-1 text-base text-[#7A6A65] font-semibold">NSBM Green University · BSc Data Science · GPA 3.7 · Colombo</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary px-5 py-2.5 text-sm font-semibold">Reject</button>
          <button className="btn btn-primary px-6 py-2.5 text-sm font-semibold">Shortlist</button>
        </div>
      </div>

      <div className="card mt-6">
        <div className="flex items-center gap-7">
          <ScoreRing score={94} label="match" size={132} />
          <div className="flex-1">
            <SkillTag label="✓ Java" state="have" />
            <SkillTag label="✓ Spring Boot" state="have" />
            <SkillTag label="✓ SQL" state="have" />
            <SkillTag label="✓ REST API" state="have" />
            <SkillTag label="✕ Docker" state="missing" />
          </div>
        </div>
        <WhyBox title="Why this candidate is a strong match">
          Alex&apos;s technical skills line up directly with your listed requirements, and their Library
          Management System project demonstrates the same backend patterns this role needs. Their degree
          matches your education requirement. This is decision support, not an automatic hiring
          recommendation — please review their profile and CV before proceeding.
        </WhyBox>
      </div>

      <SectionTitle title="Projects" />
      <div className="card">
        <b className="text-base font-bold text-[#2B1B17]">Library Management System</b>
        <p className="my-2 text-sm text-[#7A6A65] leading-relaxed font-medium">
          Spring Boot + PostgreSQL backend with a React admin panel. Sole backend developer.
        </p>
        <span className="text-sm font-bold text-[#2D6A4F] hover:underline cursor-pointer">View on GitHub</span>
      </div>

      <SectionTitle title="CV Document" />
      <div className="card flex items-center justify-between">
        <span className="text-base font-semibold text-[#2B1B17]">Alex_Kumar_CV.pdf · uploaded 28 Aug 2026</span>
        <div className="flex gap-3">
          <button className="btn btn-ghost px-4 py-2 text-sm font-semibold">Preview</button>
          <button className="btn btn-ghost px-4 py-2 text-sm font-semibold">Download</button>
        </div>
      </div>
    </div>
  );
}
