import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ProgressBar, ScoreRing, SkillTag, Badge, SectionTitle } from '../../components/ui';
import MatchExplanationDrawer from '../../components/MatchExplanationDrawer';
import type { MissingSkillEntry } from '../../components/MatchExplanationDrawer';
import {
  recommendationApi,
  applicationApi,
  studentApi,
  Recommendation,
  Application,
  StudentProfile,
} from '../../services/api';

const statusBadge: Record<string, 'success' | 'warn' | 'error' | 'info'> = {
  SHORTLISTED: 'success',
  Shortlisted: 'success',
  APPROVED: 'success',
  Approved: 'success',
  'UNDER REVIEW': 'warn',
  'Under Review': 'warn',
  PENDING: 'warn',
  Pending: 'warn',
  REJECTED: 'error',
  Rejected: 'error',
  APPLIED: 'info',
  Applied: 'info',
};

export default function StudentDashboard() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [drawerRec, setDrawerRec] = useState<Recommendation | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        setError(null);

        const [recsData, appsData, profileData] = await Promise.allSettled([
          recommendationApi.getRecommendations(),
          applicationApi.getMyApplications(),
          studentApi.getProfile(),
        ]);

        if (recsData.status === 'fulfilled') {
          setRecommendations(recsData.value || []);
        }
        if (appsData.status === 'fulfilled') {
          setApplications(appsData.value || []);
        }
        if (profileData.status === 'fulfilled') {
          setProfile(profileData.value || null);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // Compute profile completeness percentage
  const calculateProfileScore = (p: StudentProfile | null): number => {
    if (!p) return 20;
    const fields = [p.fullName, p.university, p.gpa, p.skills, p.bio, p.preferredLocation, p.preferredWorkMode];
    const filled = fields.filter((f) => f !== null && f !== undefined && String(f).trim() !== '').length;
    return Math.round((filled / fields.length) * 100);
  };

  const profileScore = calculateProfileScore(profile);
  const totalApps = applications.length;
  const shortlistedCount = applications.filter((a) => {
    const s = (a.status || '').toUpperCase();
    return s === 'SHORTLISTED' || s === 'APPROVED';
  }).length;

  const topMatch = recommendations.length > 0
    ? Math.round(recommendations[0].matchPercentage)
    : 75;

  const parsedSkills = profile?.skills
    ? profile.skills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-signal border-t-transparent mx-auto mb-3" />
          <p className="text-sm text-ink-soft">Loading dashboard insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
          {error}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TOP ROW — 4 Quick Stats Cards
          ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-4 gap-4">
        {/* Profile Score */}
        <div className="stat-card">
          <div className="stat-card-icon bg-signal-soft text-signal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="stat-card-value text-signal">{profileScore}%</div>
            <div className="stat-card-label">Profile Completed</div>
            <div className="mt-2">
              <ProgressBar value={profileScore} />
            </div>
            <Link to="/student/profile" className="stat-card-sub text-signal hover:underline">
              {profileScore < 100 ? 'Complete profile →' : 'View profile →'}
            </Link>
          </div>
        </div>

        {/* Applied Internships */}
        <div className="stat-card">
          <div className="stat-card-icon bg-info-soft text-info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            </svg>
          </div>
          <div>
            <div className="stat-card-value">{totalApps}</div>
            <div className="stat-card-label">Applications</div>
            <Link to="/student/applications" className="stat-card-sub text-info hover:underline">
              View all →
            </Link>
          </div>
        </div>

        {/* Shortlisted */}
        <div className="stat-card">
          <div className="stat-card-icon bg-amber-soft text-amber">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <div className="stat-card-value">{shortlistedCount}</div>
            <div className="stat-card-label">Shortlisted Candidates</div>
            <div className="stat-card-sub text-amber">Active reviews</div>
          </div>
        </div>

        {/* Career Readiness Score */}
        <div className="stat-card">
          <div className="flex-shrink-0">
            <ScoreRing score={topMatch} label="/ 100" size={68} />
          </div>
          <div>
            <div className="stat-card-value">{topMatch}</div>
            <div className="stat-card-label">AI Fit Score</div>
            <Link to="/student/skills" className="stat-card-sub text-signal hover:underline">
              Full breakdown →
            </Link>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          MIDDLE SECTION — 2 Columns
          ═══════════════════════════════════════════════════════ */}
      <div className="mt-6 grid grid-cols-[1.4fr_1fr] gap-5">

        {/* ── Left Column: Recommended Internships ── */}
        <div>
          <SectionTitle
            title="Recommended Internships"
            action={<Link to="/student/internships" className="text-[13px] font-semibold text-signal">View all</Link>}
          />

          {recommendations.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-ink-soft text-sm mb-3">No matched recommendations yet.</p>
              <p className="text-xs text-ink-muted mb-4">
                Add your technical skills in your profile or upload your CV to unlock AI-powered recommendations!
              </p>
              <div className="flex justify-center gap-3">
                <Link to="/student/profile" className="btn btn-secondary text-xs">Update Skills</Link>
                <Link to="/student/cv-review" className="btn btn-primary text-xs">Upload CV</Link>
              </div>
            </div>
          ) : (
            recommendations.slice(0, 5).map((rec) => {
              const i = rec.internship;
              const matchPct = Math.round(rec.matchPercentage);
              const logo = (i.companyName || 'I').charAt(0).toUpperCase();

              return (
                <div key={i.id} className="card mb-3.5">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[10px] bg-ink font-serif text-[15px] text-white">
                        {logo}
                      </div>
                      <div>
                        <b className="text-[14.5px]">{i.title}</b>
                        <div className="my-1 text-[12.5px] text-ink-soft">
                          {i.companyName || 'Company'} · {i.location || 'Location'} · {i.workMode || 'Hybrid'}
                        </div>
                      </div>
                    </div>

                    {/* AI Match Badge */}
                    <button
                      onClick={() => setDrawerRec(rec)}
                      className="flex flex-col items-center gap-0.5 rounded-[10px] bg-signal-soft px-3 py-1.5 transition-colors hover:bg-signal/10"
                      title="Click to see match breakdown"
                    >
                      <span className="font-serif text-[17px] font-bold text-signal">{matchPct}%</span>
                      <span className="text-[10px] font-semibold text-signal/70">Match</span>
                    </button>
                  </div>

                  {/* Matched/missing skill tags */}
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {rec.matchedSkills.map((s) => (
                      <SkillTag key={s} label={s} state="have" source="verified" />
                    ))}
                    {rec.missingSkills.slice(0, 3).map((s) => (
                      <SkillTag key={s} label={s} state="missing" />
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex gap-2.5">
                    <Link to={`/student/internships/${i.id}`} className="btn btn-ghost py-2 text-[12.5px]">
                      View Details
                    </Link>
                    <Link to={`/student/internships/${i.id}`} className="btn btn-primary py-2 text-[12.5px]">
                      Apply Now
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Right Column: Profile Highlights & Preferences ── */}
        <div>
          <SectionTitle title="Profile Highlights" />

          {/* Skills Widget */}
          <div className="card mb-4">
            <h3 className="mb-3 text-[14px] font-serif">Your Skills</h3>
            {parsedSkills.length === 0 ? (
              <p className="text-xs text-ink-soft mb-3">No skills listed yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {parsedSkills.map((skill) => (
                  <span key={skill} className="skill-tag skill-tag-have text-xs">
                    {skill}
                  </span>
                ))}
              </div>
            )}
            <Link to="/student/cv-review" className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-signal hover:underline">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add skills from CV
            </Link>
          </div>

          {/* Preferences Summary */}
          <div className="card">
            <h3 className="mb-3 text-[14px] font-serif">Preferences</h3>
            <dl className="space-y-2.5">
              {[
                { label: 'University', value: profile?.university || 'Not specified' },
                { label: 'Preferred Location', value: profile?.preferredLocation || 'Flexible' },
                { label: 'Work Mode', value: profile?.preferredWorkMode || 'Hybrid' },
                { label: 'Academic GPA', value: profile?.gpa ? String(profile.gpa) : 'Not specified' },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <dt className="w-[120px] flex-shrink-0 text-[12px] text-ink-soft">{item.label}</dt>
                  <dd className="text-[13px] font-medium">{item.value}</dd>
                </div>
              ))}
            </dl>
            <Link to="/student/profile" className="mt-3.5 block text-[12.5px] font-semibold text-signal hover:underline">
              Edit preferences →
            </Link>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          BOTTOM SECTION — Application Tracker Table
          ═══════════════════════════════════════════════════════ */}
      <SectionTitle
        title="Recent Applications"
        action={<Link to="/student/applications" className="text-[13px] font-semibold text-signal">View all</Link>}
      />
      <div className="card p-0 overflow-hidden">
        {applications.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-ink-soft">No applications submitted yet.</p>
            <Link to="/student/internships" className="text-xs text-signal font-semibold hover:underline mt-1 inline-block">
              Browse and apply to internships →
            </Link>
          </div>
        ) : (
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr className="bg-sand/30">
                {['Company', 'Role', 'Status', 'Action'].map((h) => (
                  <th key={h} className="border-b border-sand-line px-4 py-3 text-left text-[11.5px] font-semibold text-ink-soft">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {applications.slice(0, 5).map((a) => (
                <tr key={a.id} className="table-row-hover transition-colors">
                  <td className="border-b border-sand-line px-4 py-3.5 font-medium">{a.companyName || 'Company'}</td>
                  <td className="border-b border-sand-line px-4 py-3.5">{a.internshipTitle || 'Internship'}</td>
                  <td className="border-b border-sand-line px-4 py-3.5">
                    <Badge kind={statusBadge[a.status] || 'warn'}>{a.status}</Badge>
                  </td>
                  <td className="border-b border-sand-line px-4 py-3.5">
                    <Link to="/student/applications" className="text-[12.5px] font-semibold text-signal hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Match Explanation Drawer ── */}
      {drawerRec && (
        <MatchExplanationDrawer
          open={!!drawerRec}
          onClose={() => setDrawerRec(null)}
          internshipTitle={drawerRec.internship.title}
          company={drawerRec.internship.companyName || 'Company'}
          overallMatch={Math.round(drawerRec.matchPercentage)}
          matched={drawerRec.matchedSkills.map((s) => ({ name: s, source: 'verified' }))}
          missing={drawerRec.missingSkills.map((s) => ({
            name: s,
            source: 'self',
            impact: 'Required by this role according to internship listing.',
          })) as MissingSkillEntry[]}
          factorBreakdown={[
            { label: 'Technical Skills Match', weight: 60, score: Math.round(drawerRec.matchPercentage) },
            { label: 'Profile Completion', weight: 40, score: profileScore },
          ]}
        />
      )}
    </div>
  );
}
