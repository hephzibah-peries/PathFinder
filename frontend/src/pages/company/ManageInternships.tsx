import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Badge, SectionTitle } from '../../components/ui';
import PostInternshipModal from '../../components/PostInternshipModal';
import { internshipApi, Internship } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function ManageInternships() {
  const { token } = useAuth();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'drafts' | 'closed'>('all');

  const fetchInternships = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch company's own internships passing active user's JWT token
      const data = await internshipApi.getMyInternships(token || undefined);
      setInternships(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch internships from backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInternships();
  }, [token]);

  const handleCreated = (newJob: Internship) => {
    setInternships((prev) => [newJob, ...prev]);
  };

  const filtered = internships.filter((job) => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    return (
      job.title.toLowerCase().includes(term) ||
      (job.location && job.location.toLowerCase().includes(term)) ||
      (job.skills && job.skills.toLowerCase().includes(term))
    );
  });

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

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchInternships} className="font-semibold underline ml-3">
            Retry
          </button>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-sand-line bg-sand/20 px-5 py-3">
          <div className="flex gap-4 text-[13px] font-semibold text-ink-soft">
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-1 ${activeTab === 'all' ? 'text-signal border-b-2 border-signal' : 'hover:text-ink'}`}
            >
              All Listings ({internships.length})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`pb-1 ${activeTab === 'active' ? 'text-signal border-b-2 border-signal' : 'hover:text-ink'}`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveTab('drafts')}
              className={`pb-1 ${activeTab === 'drafts' ? 'text-signal border-b-2 border-signal' : 'hover:text-ink'}`}
            >
              Drafts
            </button>
            <button
              onClick={() => setActiveTab('closed')}
              className={`pb-1 ${activeTab === 'closed' ? 'text-signal border-b-2 border-signal' : 'hover:text-ink'}`}
            >
              Closed
            </button>
          </div>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input 
              type="text" 
              placeholder="Search roles..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input py-1.5 pl-9 text-[12.5px] w-[200px]" 
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-ink-soft">
            Loading company internships from backend...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-ink-soft mb-3">
              {searchTerm
                ? 'No internships match your search filter.'
                : 'No internships posted yet. Click "Post New Internship" to create your first listing.'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsPostModalOpen(true)}
                className="btn btn-ghost text-[12.5px] font-semibold"
              >
                + Post an Internship
              </button>
            )}
          </div>
        ) : (
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr className="bg-sand/30">
                {['Role Title', 'Location & Mode', 'Stipend', 'Deadline', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="border-b border-sand-line px-5 py-3.5 text-left text-[11.5px] font-semibold text-ink-soft uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((job) => (
                <tr key={job.id} className="table-row-hover transition-colors">
                  <td className="border-b border-sand-line px-5 py-4 font-semibold">
                    <div>{job.title}</div>
                    {job.skills && (
                      <div className="text-[11.5px] text-ink-soft font-normal mt-0.5">
                        {job.skills}
                      </div>
                    )}
                  </td>
                  <td className="border-b border-sand-line px-5 py-4 text-ink-soft">
                    {job.location || 'Colombo'} · {job.workMode || 'Hybrid'}
                  </td>
                  <td className="border-b border-sand-line px-5 py-4 text-ink-soft">
                    {job.stipend || 'Competitive'}
                  </td>
                  <td className="border-b border-sand-line px-5 py-4 text-ink-soft">
                    {job.deadline || 'Rolling'}
                  </td>
                  <td className="border-b border-sand-line px-5 py-4">
                    <Badge kind="success">Active</Badge>
                  </td>
                  <td className="border-b border-sand-line px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Link to="/company/applicants" className="text-[12.5px] font-semibold text-signal hover:underline">
                        View Candidates
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <PostInternshipModal 
        open={isPostModalOpen} 
        onClose={() => setIsPostModalOpen(false)} 
        onCreated={handleCreated}
      />
    </div>
  );
}