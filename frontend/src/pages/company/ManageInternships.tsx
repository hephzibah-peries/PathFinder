import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, SectionTitle } from '../../components/ui';
import PostInternshipModal from '../../components/PostInternshipModal';
import { companyInternships } from '../../data/mock';

export default function ManageInternships() {
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  return (
    <div>
      <div className="flex items-end justify-between">
        <SectionTitle title="Manage Internships" />
        <button
          onClick={() => setIsPostModalOpen(true)}
          className="btn btn-signal mb-9 px-5 py-2.5 shadow-md"
        >
          <span className="flex items-center gap-1.5">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Post New Internship
          </span>
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-sand-line bg-sand/20 px-5 py-3">
          <div className="flex gap-4 text-[13px] font-semibold text-ink-soft">
            <button className="text-signal border-b-2 border-signal pb-1">All Listings</button>
            <button className="hover:text-ink">Active</button>
            <button className="hover:text-ink">Drafts</button>
            <button className="hover:text-ink">Closed</button>
          </div>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" placeholder="Search roles..." className="form-input py-1.5 pl-9 text-[12.5px] w-[200px]" />
          </div>
        </div>

        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr className="bg-sand/30">
              {['Role Title', 'Applicants', 'Duration & Mode', 'Posted Date', 'Status', 'Actions'].map((h) => (
                <th key={h} className="border-b border-sand-line px-5 py-3.5 text-left text-[11.5px] font-semibold text-ink-soft uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {companyInternships.map((job) => (
              <tr key={job.id} className="table-row-hover transition-colors">
                <td className="border-b border-sand-line px-5 py-4 font-semibold">{job.title}</td>
                <td className="border-b border-sand-line px-5 py-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-signal-soft px-2.5 py-1 text-[12px] font-bold text-signal">
                    {job.applicants}
                  </span>
                </td>
                <td className="border-b border-sand-line px-5 py-4 text-ink-soft">
                  {job.duration} · {job.mode}
                </td>
                <td className="border-b border-sand-line px-5 py-4 text-ink-soft">{job.posted}</td>
                <td className="border-b border-sand-line px-5 py-4">
                  <Badge kind={job.status === 'Active' ? 'success' : 'info'}>{job.status}</Badge>
                </td>
                <td className="border-b border-sand-line px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Link to="/company/applicants" className="text-[12.5px] font-semibold text-signal hover:underline">
                      View Candidates
                    </Link>
                    <button className="text-[12.5px] font-semibold text-ink-soft hover:text-ink">Edit</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PostInternshipModal open={isPostModalOpen} onClose={() => setIsPostModalOpen(false)} />
    </div>
  );
}
