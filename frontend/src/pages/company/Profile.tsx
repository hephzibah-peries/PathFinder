import { SectionTitle } from '../../components/ui';
import { companyProfile } from '../../data/mock';

export default function CompanyProfile() {
  return (
    <div className="mx-auto max-w-[880px]">
      <div className="card flex items-center justify-between bg-gradient-to-br from-sand to-paper-raised">
        <div className="flex items-center gap-5">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-xl bg-ink text-[26px] font-bold text-white shadow-sm">
            {companyProfile.avatar}
          </div>
          <div>
            <h1 className="m-0 font-serif text-[24px]">{companyProfile.name}</h1>
            <p className="mt-0.5 text-[13.5px] text-ink-soft">
              {companyProfile.industry} · {companyProfile.location}
            </p>
            <a href={companyProfile.website} target="_blank" rel="noreferrer" className="mt-1 block text-[12.5px] font-semibold text-signal hover:underline">
              {companyProfile.website.replace('https://', '')}
            </a>
          </div>
        </div>
        <button className="btn btn-ghost">Edit Profile</button>
      </div>

      <SectionTitle title="Company Overview" action={<button className="text-[13px] font-semibold text-signal">Edit</button>} />
      <div className="card">
        <p className="text-[14px] leading-relaxed text-ink/90">{companyProfile.bio}</p>
        
        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-sand-line pt-5">
          <div>
            <dt className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-soft">Founded</dt>
            <dd className="mt-1 text-[14px] font-medium">{companyProfile.founded}</dd>
          </div>
          <div>
            <dt className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-soft">Company Size</dt>
            <dd className="mt-1 text-[14px] font-medium">{companyProfile.size}</dd>
          </div>
        </dl>
      </div>

      <SectionTitle title="Tech Stack" action={<button className="text-[13px] font-semibold text-signal">Edit</button>} />
      <div className="card">
        <div className="flex flex-wrap gap-2">
          {companyProfile.techStack.map(tech => (
            <span key={tech} className="rounded-lg bg-sand px-3 py-1.5 text-[13px] font-medium">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
