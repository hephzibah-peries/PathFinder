import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ProgressBar, ScoreRing, SkillTag, WhyBox } from '../../components/ui';
import MatchExplanationDrawer from '../../components/MatchExplanationDrawer';
import { internshipApi, applicationApi } from '../../services/api';
import { internships as fallbackInternships } from '../../data/mock';
import { useAuth } from '../../context/AuthContext';

export default function InternshipDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();

  const [internship, setInternship] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    async function loadDetail() {
      if (!id) return;
      try {
        setLoading(true);
        // If id is numeric, fetch from backend API with active user's JWT token
        if (/^\d+$/.test(id)) {
          const live = await internshipApi.getById(id, token || undefined);
          setInternship(live);
        } else {
          const match = fallbackInternships.find((i) => i.id === id) || fallbackInternships[0];
          setInternship(match);
        }
      } catch (err) {
        // Fallback to mock data if API call fails
        const match = fallbackInternships.find((i) => i.id === id) || fallbackInternships[0];
        setInternship(match);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [id, token]);

  const handleApply = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!id || !/^\d+$/.test(id)) {
      // Mock id application simulation
      setApplied(true);
      setTimeout(() => navigate('/student/applications'), 1200);
      return;
    }

    setApplying(true);
    try {
      await applicationApi.apply(id);
      setApplied(true);
      setTimeout(() => navigate('/student/applications'), 1200);
    } catch (err: any) {
      alert(err.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  if (loading || !internship) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm text-ink-soft">Loading internship details...</div>
      </div>
    );
  }

  const company = internship.companyName || internship.company || 'Tech Partner';
  const logo = (company[0] || 'I').toUpperCase();
  const matchScore = internship.match || 90;
  const skillsArray = internship.skills
    ? typeof internship.skills === 'string'
      ? internship.skills.split(',').map((s: string) => s.trim())
      : internship.matched
      ? internship.matched.map((s: any) => s.name)
      : ['Java', 'Spring Boot', 'SQL']
    : ['Java', 'Spring Boot', 'SQL'];

  return (
    <>
      <div className="mx-auto max-w-[880px]">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex h-[56px] w-[56px] items-center justify-center rounded-xl bg-ink font-serif text-2xl text-white shadow-sm">
            {logo}
          </div>
          <div>
            <h2 className="m-0 font-serif text-[24px] text-ink">{internship.title}</h2>
            <p className="mt-0.5 text-sm text-ink-soft">
              {company} · {internship.location || 'Colombo'} · {internship.workMode || 'Hybrid'} ·{' '}
              {internship.stipend ? `Stipend: ${internship.stipend}` : 'Competitive'} · Deadline{' '}
              {internship.deadline || 'Rolling'}
            </p>
          </div>
        </div>

        {/* Match Card */}
        <div className="card mt-6">
          <div className="flex items-center gap-6.5">
            <ScoreRing score={matchScore} label="match" />
            <div className="flex-1 space-y-2">
              <div>
                <div className="mb-1 text-[12.5px] font-medium text-ink">Technical Alignment — 94%</div>
                <ProgressBar value={94} />
              </div>
              <div>
                <div className="mb-1 text-[12.5px] font-medium text-ink">Project Relevance — 88%</div>
                <ProgressBar value={88} />
              </div>
            </div>
          </div>

          <WhyBox title="Why you match this role">
            Your skill profile lines up directly with the core requirements. Your projects demonstrate
            familiarity with the backend and API architecture requested for this internship.
          </WhyBox>

          <button
            id="why-match-btn"
            onClick={() => setDrawerOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-info-soft bg-info-soft px-4 py-2 text-[12.5px] font-semibold text-info transition hover:bg-[#d6e0f5]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Why this match? (Detailed Breakdown)
          </button>
        </div>

        {/* Description */}
        <h2 className="mt-8 mb-3 font-serif text-[21px] text-ink">About this role</h2>
        <div className="card text-[14px] leading-relaxed text-ink/90">
          <p>
            {internship.description ||
              `You will work within ${company}'s software engineering team, collaborating on real-world services and backend infrastructure. Expect close mentorship, code reviews, and production deployments.`}
          </p>

          {internship.requirements && (
            <div className="mt-4 pt-4 border-t border-sand-line">
              <h4 className="font-serif font-bold text-sm text-ink mb-1">Key Requirements</h4>
              <p className="text-ink-soft text-sm">{internship.requirements}</p>
            </div>
          )}
        </div>

        {/* Skills */}
        <div className="mt-6">
          <h3 className="text-[15px] font-serif font-bold mb-3">Target Skills for This Internship</h3>
          <div className="flex flex-wrap gap-2">
            {skillsArray.map((skillName: string) => (
              <SkillTag key={skillName} label={skillName} state="have" source="verified" />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center gap-4">
          <button
            onClick={handleApply}
            disabled={applying || applied}
            className={`btn btn-primary px-8 py-3 text-sm font-semibold transition ${
              applied ? 'bg-green-600 border-green-600 text-white' : ''
            }`}
          >
            {applied ? '✓ Application Submitted!' : applying ? 'Submitting Application...' : 'Apply Now'}
          </button>
          <button onClick={() => navigate(-1)} className="btn btn-ghost px-5 py-3 text-sm">
            Back to listings
          </button>
        </div>
      </div>

      {/* Match Explanation Drawer */}
      <MatchExplanationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        internshipTitle={internship.title}
        company={company}
        overallMatch={matchScore}
        matched={skillsArray.map((name: string) => ({ name, source: 'verified' }))}
        missing={[{ name: 'Docker', source: 'self', impact: 'Closing this gap could boost your match to 97%.' }]}
        factorBreakdown={[
          { label: 'Technical Skills', weight: 40, score: 94 },
          { label: 'Projects', weight: 25, score: 88 },
          { label: 'Education', weight: 20, score: 85 },
          { label: 'Certifications', weight: 10, score: 65 },
          { label: 'Experience', weight: 5, score: 55 },
        ]}
      />
    </>
  );
}
