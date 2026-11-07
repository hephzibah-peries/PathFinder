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
          className="btn btn-primary mb-9 px-6 py-3 text-sm font-semibold shadow-md"
        >
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Post New Internship
          </span>
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm font-semibold text-rose-900 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchInternships} className="font-bold underline ml-3 text-[#2B1B17]">
            Retry
          </button>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#E5D5CE] bg-[#FAF6F4] px-6 py-4">
          <div className="flex gap-5 text-sm font-semibold text-[#7A6A65]">
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-1 ${activeTab === 'all' ? 'text-[#7A4B43] border-b-2 border-[#7A4B43] font-bold' : 'hover:text-[#2B1B17]'}`}
            >
              All Listings ({internships.length})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`pb-1 ${activeTab === 'active' ? 'text-[#7A4B43] border-b-2 border-[#7A4B43] font-bold' : 'hover:text-[#2B1B17]'}`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveTab('drafts')}
              className={`pb-1 ${activeTab === 'drafts' ? 'text-[#7A4B43] border-b-2 border-[#7A4B43] font-bold' : 'hover:text-[#2B1B17]'}`}
            >
              Drafts
            </button>
            <button
              onClick={() => setActiveTab('closed')}
              className={`pb-1 ${activeTab === 'closed' ? 'text-[#7A4B43] border-b-2 border-[#7A4B43] font-bold' : 'hover:text-[#2B1B17]'}`}
            >
              Closed
            </button>
          </div>
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A6A65]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input 
              type="text" 
              placeholder="Search roles..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input py-2 pl-10 text-sm w-[240px]" 
            />
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-sm text-[#7A6A65]">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#7A4B43] border-t-transparent mx-auto mb-3" />
            Loading company internships from backend...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-base text-[#7A6A65] mb-4">
              {searchTerm
                ? 'No internships match your search filter.'
                : 'No internships posted yet. Click "Post New Internship" to create your first listing.'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsPostModalOpen(true)}
                className="btn btn-primary text-sm font-semibold"
              >
                + Post an Internship
              </button>
            )}
          </div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#E5D5CE] bg-[#FAF6F4] text-[#7A6A65] uppercase tracking-wider font-semibold text-xs">
                {['Role Title', 'Location & Mode', 'Stipend', 'Deadline', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-6 py-4 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5D5CE]/70">
              {filtered.map((job) => (
                <tr key={job.id} className="hover:bg-[#FAF6F4]/60 transition-colors">
                  <td className="px-6 py-4 font-bold text-[#2B1B17]">
                    <div className="text-base">{job.title}</div>
                    {job.skills && (
                      <div className="text-xs text-[#7A6A65] font-normal mt-1">
                        {job.skills}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-[#7A6A65] font-semibold">
                    {job.location || 'Colombo'} · {job.workMode || 'Hybrid'}
                  </td>
                  <td className="px-6 py-4 text-[#7A6A65]">
                    {job.stipend || 'Competitive'}
                  </td>
                  <td className="px-6 py-4 text-[#7A6A65]">
                    {job.deadline || 'Rolling'}
                  </td>
                  <td className="px-6 py-4">
                    <Badge kind="success">Active</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Link to="/company/applicants" className="text-sm font-bold text-[#7A4B43] hover:underline">
                      View Candidates →
                    </Link>
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
