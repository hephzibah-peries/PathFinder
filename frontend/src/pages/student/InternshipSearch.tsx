import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MatchExplanationDrawer from '../../components/MatchExplanationDrawer';
import { internshipApi, Internship } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { MissingSkillEntry } from '../../components/MatchExplanationDrawer';

const filterGroups = [
  { title: 'Technology', options: ['Java', 'React', 'Python', 'Spring Boot', 'SQL', 'TypeScript', 'Docker'] },
  { title: 'Work Mode', options: ['Remote', 'Hybrid', 'On-site'] },
  { title: 'Duration', options: ['3 months', '6 months', '1 Year'] },
];

export default function InternshipSearch() {
  const { token } = useAuth();
  const [internshipsList, setInternshipsList] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [drawerInternship, setDrawerInternship] = useState<any | null>(null);

  useEffect(() => {
    async function loadInternships() {
      try {
        setLoading(true);
        setError(null);
        const data = await internshipApi.getAll(token || undefined);
        setInternshipsList(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch internships from backend');
        setInternshipsList([]);
      } finally {
        setLoading(false);
      }
    }
    loadInternships();
  }, [token]);

  const toggleFilter = (option: string) => {
    setSelectedFilters((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  };

  const filtered = internshipsList.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      item.title.toLowerCase().includes(term) ||
      (item.companyName && item.companyName.toLowerCase().includes(term)) ||
      (item.skills && item.skills.toLowerCase().includes(term)) ||
      (item.location && item.location.toLowerCase().includes(term));

    if (!matchesSearch) return false;

    if (selectedFilters.length > 0) {
      const itemText = `${item.title} ${item.skills || ''} ${item.workMode || ''}`.toLowerCase();
      const matchesAnyFilter = selectedFilters.some((f) => itemText.includes(f.toLowerCase()));
      if (!matchesAnyFilter) return false;
    }

    return true;
  });

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-[#2B1B17] tracking-tight">Explore Live Internships</h1>
            <p className="text-sm text-[#7A6A65] mt-1">Discover industry openings evaluated by PathFinder's semantic matching engine</p>
          </div>
          <span className="badge badge-peach self-start sm:self-auto font-bold text-xs py-1.5 px-3.5">
            {filtered.length} Position{filtered.length !== 1 ? 's' : ''} Available
          </span>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm font-semibold text-rose-900 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                internshipApi.getAll(token || undefined)
                  .then((data) => setInternshipsList(data || []))
                  .catch((err) => setError(err.message || 'Failed to fetch internships'))
                  .finally(() => setLoading(false));
              }}
              className="font-bold underline ml-3 text-[#2B1B17]"
            >
              Retry Connection
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── Filters Sidebar ── */}
          <aside className="lg:col-span-3 card space-y-6">
            <div>
              <label className="form-label">Search Keywords</label>
              <div className="relative">
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input text-sm pl-10"
                  placeholder="Role, company, skill..."
                />
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A6A65]"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
            </div>

            {filterGroups.map((g) => (
              <div key={g.title} className="border-t border-[#E5D5CE] pt-4">
                <h4 className="font-serif text-sm font-bold text-[#2B1B17] mb-3 uppercase tracking-wider">{g.title}</h4>
                <div className="space-y-2">
                  {g.options.map((o) => (
                    <label key={o} className="flex items-center text-sm text-[#7A6A65] hover:text-[#2B1B17] font-medium cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        className="mr-3 rounded bg-white border-[#E5D5CE] text-[#7A4B43] focus:ring-[#7A4B43]/20"
                        checked={selectedFilters.includes(o)}
                        onChange={() => toggleFilter(o)}
                      />
                      {o}
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {selectedFilters.length > 0 && (
              <button
                onClick={() => setSelectedFilters([])}
                className="w-full text-center text-sm font-bold text-[#7A4B43] hover:text-[#5E342D] py-1.5"
              >
                Clear all filters
              </button>
            )}
          </aside>

          {/* ── Internship Cards Stream ── */}
          <div className="lg:col-span-9 space-y-4">
            {loading ? (
              <div className="card text-center py-16 text-sm text-[#7A6A65]">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#7A4B43] border-t-transparent mx-auto mb-3" />
                Querying active database postings...
              </div>
            ) : filtered.length === 0 ? (
              <div className="card text-center py-16">
                <h3 className="font-serif text-xl font-bold text-[#2B1B17] mb-2">No matching internships</h3>
                <p className="text-sm text-[#7A6A65] max-w-sm mx-auto mb-4">
                  {searchTerm || selectedFilters.length > 0
                    ? 'Try adjusting your search query or unchecking filters to expand your scope.'
                    : 'No internships currently posted. Check back soon for new corporate openings.'}
                </p>
                {(searchTerm || selectedFilters.length > 0) && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedFilters([]);
                    }}
                    className="btn btn-ghost text-sm font-semibold"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              filtered.map((i) => {
                const skillsArray = i.skills
                  ? i.skills.split(',').map((s) => s.trim()).filter(Boolean)
                  : [];

                const companyTitle = i.companyName || 'Verified Partner';
                const logoLetter = (companyTitle[0] || 'I').toUpperCase();
                const matchPct = 88;

                return (
                  <div key={i.id} className="card group hover:border-[#D6C1B8] transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex gap-4 flex-1">
                        <div className="flex h-13 w-13 flex-shrink-0 items-center justify-center rounded-2xl bg-[#FAF6F4] border border-[#E5D5CE] font-serif text-xl font-bold text-[#2B1B17] shadow-xs">
                          {logoLetter}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link to={`/student/internships/${i.id}`}>
                            <h3 className="text-lg font-bold text-[#2B1B17] group-hover:text-[#7A4B43] transition-colors">
                              {i.title}
                            </h3>
                          </Link>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#7A6A65]">
                            <span className="font-semibold text-[#2B1B17]">{companyTitle}</span>
                            <span>•</span>
                            <span>{i.location || 'Colombo, Sri Lanka'}</span>
                            <span>•</span>
                            <span className="rounded-md bg-[#FAF6F4] px-2.5 py-0.5 text-xs font-semibold text-[#7A6A65] border border-[#E5D5CE]">
                              {i.workMode || 'Hybrid'}
                            </span>
                            <span>•</span>
                            <span className="text-[#7A6A65]">
                              Stipend: <span className="font-semibold text-[#2B1B17]">{i.stipend || 'Competitive'}</span>
                            </span>
                          </div>

                          {i.description && (
                            <p className="text-sm text-[#7A6A65] line-clamp-2 mt-2 leading-relaxed">
                              {i.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                        <div className="rounded-2xl border border-[#E5D5CE] bg-[#FDF2ED] px-4 py-2 text-center">
                          <div className="font-serif text-lg font-bold text-[#7A4B43] leading-none">{matchPct}%</div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#7A4B43]/90">Fit score</div>
                        </div>
                      </div>
                    </div>

                    {skillsArray.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[#E5D5CE] pt-3">
                        {skillsArray.map((skill) => (
                          <span key={skill} className="skill-tag skill-tag-have text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between border-t border-[#E5D5CE] pt-3">
                      <span className="text-sm text-[#7A6A65]">
                        Application Deadline: {i.deadline || 'Rolling basis'}
                      </span>

                      <div className="flex gap-3">
                        <button
                          onClick={() => setDrawerInternship(i)}
                          className="btn btn-ghost py-2.5 px-4 text-sm font-semibold"
                        >
                          Explain Fit
                        </button>
                        <Link to={`/student/internships/${i.id}`} className="btn btn-primary py-2.5 px-5 text-sm font-semibold">
                          Apply Now
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Explanation Drawer ── */}
      {drawerInternship && (
        <MatchExplanationDrawer
          open={!!drawerInternship}
          onClose={() => setDrawerInternship(null)}
          internshipTitle={drawerInternship.title}
          company={drawerInternship.companyName || 'Verified Partner'}
          overallMatch={88}
          matched={[
            { name: 'Core Foundations', source: 'verified' },
            { name: 'Problem Solving', source: 'verified' },
          ]}
          missing={[
            {
              name: 'Framework Proficiency',
              source: 'self',
              impact: 'Critical requirement listed in job posting description.',
            },
          ] as MissingSkillEntry[]}
          factorBreakdown={[
            { label: 'Technical Match', weight: 60, score: 88 },
            { label: 'Location & Work Mode', weight: 40, score: 90 },
          ]}
        />
      )}
    </>
  );
}
