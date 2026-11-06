import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SkillTag } from '../../components/ui';
import MatchExplanationDrawer from '../../components/MatchExplanationDrawer';
import { internshipApi, Internship } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { MissingSkillEntry } from '../../components/MatchExplanationDrawer';

const filterGroups = [
  { title: 'Technology', options: ['Java', 'React', 'Python', 'Spring Boot', 'SQL'] },
  { title: 'Work mode', options: ['Remote', 'Hybrid', 'On-site'] },
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
        // Ensure active user's JWT token from AuthContext is passed in the Authorization header
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
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-[22px]">Find your internship</h2>
          <span className="text-xs text-ink-soft bg-sand/40 px-2.5 py-1 rounded">
            {filtered.length} {filtered.length === 1 ? 'position available' : 'positions available'}
          </span>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                internshipApi.getAll(token || undefined)
                  .then(data => setInternshipsList(data || []))
                  .catch(err => setError(err.message || 'Failed to fetch internships'))
                  .finally(() => setLoading(false));
              }}
              className="font-semibold underline ml-3"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-[250px_1fr] gap-7">
          <aside>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-5 w-full rounded-lg border border-sand-line bg-paper-raised px-3 py-2.5 text-sm focus:outline focus:outline-2 focus:outline-signal"
              placeholder="Search role, company or skill"
            />
            {filterGroups.map((g) => (
              <div key={g.title} className="mb-5">
                <h4 className="mb-2 text-[12.5px] font-serif font-bold text-ink">{g.title}</h4>
                {g.options.map((o) => (
                  <label key={o} className="block py-1 text-[13px] text-ink-soft cursor-pointer hover:text-ink">
                    <input 
                      type="checkbox" 
                      className="mr-2 rounded" 
                      checked={selectedFilters.includes(o)}
                      onChange={() => toggleFilter(o)}
                    /> 
                    {o}
                  </label>
                ))}
              </div>
            ))}
          </aside>

          <div>
            {loading ? (
              <div className="card text-center py-12 text-sm text-ink-soft">
                <div className="flex justify-center mb-3">
                  <svg className="animate-spin h-5 w-5 text-signal" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                </div>
                Loading live internships from backend...
              </div>
            ) : filtered.length === 0 ? (
              <div className="card text-center py-12 text-sm text-ink-soft">
                <p className="font-semibold text-ink text-[15px] mb-1">No internships found</p>
                <p className="text-[13px]">
                  {searchTerm || selectedFilters.length > 0
                    ? 'Try clearing your filters or searching for different keywords.'
                    : 'No companies have published internships yet. Check back soon!'}
                </p>
              </div>
            ) : (
              filtered.map((i) => {
                const skillsArray = i.skills
                  ? i.skills.split(',').map((s) => s.trim()).filter(Boolean)
                  : [];

                const companyTitle = i.companyName || 'Verified Partner';
                const logoLetter = (companyTitle[0] || 'I').toUpperCase();
                const matchPct = 85;

                return (
                  <div key={i.id} className="card mb-3 transition hover:border-signal/50">
                    <div className="flex items-start justify-between">
                      <Link to={`/student/internships/${i.id}`} className="flex flex-1 gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] bg-ink font-serif text-[15px] text-white shadow-sm">
                          {logoLetter}
                        </div>
                        <div>
                          <b className="text-[15px] text-ink hover:text-signal transition">{i.title}</b>
                          <div className="my-1 text-[12.5px] text-ink-soft">
                            {companyTitle} · {i.location || 'Colombo'} · {i.workMode || 'Hybrid'} ·{' '}
                            {i.stipend ? `Stipend: ${i.stipend}` : 'Competitive'} · Deadline {i.deadline || 'Rolling'}
                          </div>
                          {i.description && (
                            <p className="text-[12.5px] text-ink-soft line-clamp-2 mt-1">
                              {i.description}
                            </p>
                          )}
                        </div>
                      </Link>

                      <div className="text-right">
                        <div className="font-serif text-[20px] font-bold text-signal">{matchPct}%</div>
                        <div className="text-[11px] text-ink-soft">Skill match</div>
                      </div>
                    </div>

                    {skillsArray.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {skillsArray.slice(0, 5).map((skillName: string) => (
                          <SkillTag key={skillName} label={skillName} state="have" source="verified" />
                        ))}
                      </div>
                    )}

                    {/* Why this match? */}
                    <button
                      id={`why-match-${i.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setDrawerInternship({
                          title: i.title,
                          company: companyTitle,
                          match: matchPct,
                          matched: skillsArray.map((name: string) => ({ name, source: 'verified' })),
                          missing: [{ name: 'Cloud/AWS', source: 'self', impact: 'Preferred in 60% of modern stacks.' }],
                          factorBreakdown: [
                            { label: 'Technical Skills', weight: 40, score: 90 },
                            { label: 'Projects', weight: 25, score: 85 },
                            { label: 'Education', weight: 20, score: 85 },
                            { label: 'Certifications', weight: 10, score: 65 },
                            { label: 'Experience', weight: 5, score: 55 },
                          ],
                        });
                      }}
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
                );
              })
            )}
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