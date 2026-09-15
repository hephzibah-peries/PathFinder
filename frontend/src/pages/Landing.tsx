import { Link } from 'react-router-dom';

const features = [
  { title: 'AI internship matching', body: 'Ranks live internships against your actual skills and preferences, not just keywords.' },
  { title: 'CV skill extraction', body: 'Upload a CV once \u2014 SkillBridgePlatform reads it and builds your skill profile automatically.' },
  { title: 'Skill gap analysis', body: 'See exactly which skills separate you from your target role, ranked by priority.' },
  { title: 'Career readiness score', body: 'A single score built from your skills, projects, education and experience.' },
  { title: 'Personalised recommendations', body: 'A ranked shortlist that updates as your profile and skills grow.' },
  { title: 'Career roadmap', body: 'A staged plan from where you are now to internship-ready.' },
];

const steps = [
  ['Create your profile', 'Tell us your degree, year and interests.'],
  ['Upload your CV', 'PDF or DOCX \u2014 takes under a minute.'],
  ['AI analyses your skills', 'We extract and score every skill we find.'],
  ['Discover matched internships', 'Ranked by fit, with a clear reason for each.'],
  ['Identify missing skills', 'See the gap between you and your target role.'],
  ['Improve your readiness', 'Follow a roadmap built around what you\u2019re missing.'],
];

export default function Landing() {
  return (
    <div>
      <div className="flex items-center justify-between px-8 py-4">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
          <img src="/logo.svg" alt="SkillBridgePlatform Logo" className="w-10 h-10" />
          <div className="font-serif text-[19px]">SkillBridgePlatform</div>
        </Link>
        <div className="flex gap-[22px] text-sm text-ink-soft">
          <span>Internships</span>
          <span>Companies</span>
          <span>How it works</span>
        </div>
        <div className="flex gap-2.5">
          <Link to="/login" className="btn btn-secondary">Log in</Link>
          <Link to="/login" className="btn btn-primary">Get Started</Link>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1180px] grid-cols-[1.1fr_0.9fr] items-center gap-14 px-12 py-16">
        <div>
          <h1 className="mb-[18px] max-w-[520px] font-serif text-[52px] leading-[1.06]">
            Find the right internship. Build the right skills.
          </h1>
          <p className="mb-7 max-w-[460px] text-[16.5px] text-ink-soft">
            SkillBridgePlatform reads your CV, your projects and your goals, then matches you against real
            internship requirements \u2014 and shows you exactly what to learn next to close the gap.
          </p>
          <div className="flex gap-3">
            <Link to="/login" className="btn btn-primary">Get Started</Link>
            <Link to="/student/internships" className="btn btn-secondary">Explore Internships</Link>
          </div>
        </div>
        <div className="rounded-l border border-sand-line bg-sand p-7">
          <div className="mb-3.5 flex items-center gap-2.5 text-[13px] text-ink-soft">
            <span className="rounded-[10px] border border-sand-line bg-paper-raised px-3.5 py-2.5 text-[13px] font-semibold text-ink">Your profile</span>
            <span>&rarr;</span>
            <span className="rounded-[10px] border border-sand-line bg-paper-raised px-3.5 py-2.5 text-[13px] font-semibold text-ink">AI analysis</span>
          </div>
          <div className="ml-6 flex items-center gap-2.5 text-[13px] text-ink-soft">
            <span className="rounded-[10px] border border-sand-line bg-paper-raised px-3.5 py-2.5 text-[13px] font-semibold text-ink">Internship match</span>
            <span>&rarr;</span>
            <span className="rounded-[10px] border border-sand-line bg-paper-raised px-3.5 py-2.5 text-[13px] font-semibold text-ink">Career growth</span>
          </div>
          <p className="mt-3.5 text-[12.5px] text-ink-soft">
            Every match comes with a plain-language reason \u2014 skills, projects and education compared side by side.
          </p>
        </div>
      </div>

      <div className="my-14 flex border-y border-sand-line">
        {[['5,000+', 'Students'], ['500+', 'Internships'], ['200+', 'Companies'], ['90%', 'Match accuracy']].map(([n, l], i) => (
          <div key={i} className="flex-1 border-r border-sand-line px-7 py-5 last:border-r-0">
            <b className="block font-serif text-[30px]">{n}</b>
            <span className="text-[12.5px] text-ink-soft">{l}</span>
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-[1180px] px-12">
        <h2 className="font-serif text-2xl">What SkillBridgePlatform does</h2>
        <div className="mt-5 grid grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="card">
              <h3 className="mb-2 text-[16.5px] font-serif">{f.title}</h3>
              <p className="m-0 text-[13.5px]">{f.body}</p>
            </div>
          ))}
        </div>

        <h2 className="mb-4 mt-14 font-serif text-2xl">How it works</h2>
        <ol className="grid list-none grid-cols-3 gap-5 p-0">
          {steps.map(([title, body], i) => (
            <li key={i}>
              <div className="mb-2.5 flex h-[26px] w-[26px] items-center justify-center rounded-full border border-ink text-xs font-semibold">
                {i + 1}
              </div>
              <b className="text-sm">{title}</b>
              <p className="mt-0.5 text-[13.5px]">{body}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="mx-auto my-14 flex max-w-[1180px] items-center justify-between rounded-l bg-ink p-12 text-[#EDEAE2]">
        <div>
          <h2 className="mb-1.5 font-serif text-[26px] text-white">Ready to find your next opportunity?</h2>
          <p className="text-[#B9BCC4]">It takes about ten minutes to set up your profile.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/login" className="btn bg-white text-ink">Create Student Account</Link>
          <button className="btn border border-[#565C68] bg-transparent text-white">Post an Internship</button>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1180px] justify-between border-t border-sand-line px-12 py-10 text-[13px] text-ink-soft">
        <div>SkillBridgePlatform \u2014 AI Internship & Career Readiness Platform</div>
        <div className="flex gap-14">
          <div><b className="mb-2 block text-ink">Company</b><span className="block py-0.5">About</span><span className="block py-0.5">Contact</span></div>
          <div><b className="mb-2 block text-ink">Legal</b><span className="block py-0.5">Privacy</span><span className="block py-0.5">Terms</span></div>
          <div><b className="mb-2 block text-ink">Support</b><span className="block py-0.5">Help centre</span></div>
        </div>
      </div>
    </div>
  );
}
