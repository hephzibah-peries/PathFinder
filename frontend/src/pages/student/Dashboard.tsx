import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ProgressBar, ScoreRing, Badge, SectionTitle } from '../../components/ui';
import MatchExplanationDrawer from '../../components/MatchExplanationDrawer';
import TrafficLightBadge from '../../components/TrafficLightBadge';
import JargonTooltip from '../../components/JargonTooltip';
import { useLanguage } from '../../context/LanguageContext';
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
  const { lang, t } = useLanguage();
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
      <div className="flex h-72 items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#7A4B43] border-t-transparent mx-auto mb-3" />
          <p className="text-sm font-medium text-[#7A6A65]">Synthesizing AI dashboard insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm font-semibold text-rose-900">
          {error}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TOP ROW — Modern Stat Cards
          ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Profile Score */}
        <div className="stat-card">
          <div className="stat-card-icon !text-emerald-800 !bg-emerald-50 !border-emerald-300">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="stat-card-value !text-emerald-800">{profileScore}%</div>
            <div className="stat-card-label">{t('profileCompleted')}</div>
            <div className="mt-3">
              <ProgressBar value={profileScore} />
            </div>
            <Link to="/student/profile" className="stat-card-sub inline-block text-emerald-800 hover:text-emerald-950 font-bold">
              {profileScore < 100 ? (lang === 'ta' ? 'சுயவிவரத்தை நிரப்பவும் →' : 'Complete profile →') : (lang === 'ta' ? 'சுயவிவரம் காண்க →' : 'View profile →')}
            </Link>
          </div>
        </div>

        {/* Applied Internships */}
        <div className="stat-card">
          <div className="stat-card-icon !text-[#4A6D88] !bg-[#EDF3F7] !border-sky-300">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="stat-card-value text-[#2B1B17]">{totalApps}</div>
            <div className="stat-card-label">{t('submittedApps')}</div>
            <div className="mt-2 text-sm text-[#7A6A65]">{lang === 'ta' ? 'நிகழ்நேர கண்காணிப்பு' : 'Tracked in realtime'}</div>
            <Link to="/student/applications" className="stat-card-sub inline-block text-[#4A6D88] hover:text-[#324B5E] font-bold">
              {lang === 'ta' ? 'விண்ணப்ப நிலை காண்க →' : 'View application status →'}
            </Link>
          </div>
        </div>

        {/* Shortlisted */}
        <div className="stat-card">
          <div className="stat-card-icon !text-[#7A4B43] !bg-[#FDF2ED] !border-[#E5D5CE]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="stat-card-value text-[#7A4B43]">{shortlistedCount}</div>
            <div className="stat-card-label">{t('shortlistedCandidates')}</div>
            <div className="mt-2 text-sm text-[#7A6A65]">{lang === 'ta' ? 'நிறுவன பரிசீலனை' : 'Corporate review active'}</div>
            <div className="stat-card-sub text-[#7A4B43]">{lang === 'ta' ? 'அழைப்பு நிலுவையில்' : 'Pending recruiter reachout'}</div>
          </div>
        </div>

        {/* Career Readiness Score (Step 2 Tour Target) */}
        <div className="stat-card relative" data-tour="tour-readiness">
          <div className="flex-shrink-0">
            <ScoreRing score={topMatch} label="FIT" size={72} />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="stat-card-label font-bold text-xs">
              {t('topAIFit')}
            </div>
            <TrafficLightBadge score={topMatch} size="sm" showScore={false} />
            <div>
              <Link to="/student/skills" className="stat-card-sub inline-block text-[#7A4B43] hover:text-[#5E342D] font-bold mt-1">
                {lang === 'ta' ? 'திறன் இடைவெளி பகுப்பாய்வு →' : 'Analyze skill gap →'}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          MIDDLE SECTION — 2 Columns
          ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── Left Column: Recommended Internships ── */}
        <div className="lg:col-span-8 space-y-4">
          <SectionTitle
            title="AI Recommended Internships"
            action={
              <Link to="/student/internships" className="text-sm font-bold text-[#7A4B43] hover:text-[#5E342D] uppercase tracking-wider">
                Browse All Openings →
              </Link>
            }
          />

          {recommendations.length === 0 ? (
            <div className="card text-center py-12">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FDF2ED] border border-[#E5D5CE] text-[#7A4B43] shadow-xs">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <h3 className="font-serif text-xl font-bold text-[#2B1B17] mb-2">No matched recommendations yet</h3>
              <p className="text-sm text-[#7A6A65] max-w-sm mx-auto mb-6">
                Add your technical skills to your profile or upload your CV to generate AI-ranked recommendations tailored to your goals.
              </p>
              <div className="flex justify-center gap-3">
                <Link to="/student/profile" className="btn btn-secondary text-sm">Update Profile</Link>
                <Link to="/student/cv-review" className="btn btn-primary text-sm">Upload CV with NLP</Link>
              </div>
            </div>
          ) : (
            recommendations.slice(0, 5).map((rec) => {
              const i = rec.internship;
              const matchPct = Math.round(rec.matchPercentage);
              const logo = (i.companyName || 'I').charAt(0).toUpperCase();

              return (
                <div key={i.id} className="card group hover:border-[#D6C1B8] transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <div className="flex h-13 w-13 flex-shrink-0 items-center justify-center rounded-2xl bg-[#FAF6F4] border border-[#E5D5CE] font-serif text-xl font-bold text-[#7A4B43] shadow-xs">
                        {logo}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[#2B1B17] group-hover:text-[#7A4B43] transition-colors">
                          {i.title}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#7A6A65]">
                          <span className="font-semibold text-[#2B1B17]">{i.companyName || 'Company'}</span>
                          <span>•</span>
                          <span>{i.location || 'Colombo, Sri Lanka'}</span>
                          <span>•</span>
                          <span className="rounded-md bg-[#FAF6F4] px-2.5 py-0.5 text-xs font-semibold text-[#7A6A65] border border-[#E5D5CE]">
                            {i.workMode || 'Hybrid'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* AI Match Badge with Traffic Light Indicator */}
                    <button
                      onClick={() => setDrawerRec(rec)}
                      className="flex flex-col items-end gap-1.5 transition-all hover:scale-105 shrink-0"
                      title="Click to view explainable AI breakdown"
                    >
                      <TrafficLightBadge score={matchPct} size="md" />
                      <span className="text-[11px] font-bold text-[#7A6A65] hover:text-[#7A4B43] underline decoration-dotted">
                        {lang === 'ta' ? 'விளக்கம் காண்க →' : 'Why this match?'}
                      </span>
                    </button>
                  </div>

                  {/* Matched/missing skill tags with Jargon Tooltips */}
                  <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[#E5D5CE] pt-3">
                    {rec.matchedSkills.map((s) => (
                      <span key={s} className="skill-tag skill-tag-have text-sm">
                        <JargonTooltip term={s}>{s}</JargonTooltip>
                      </span>
                    ))}
                    {rec.missingSkills.slice(0, 3).map((s) => (
                      <span key={s} className="skill-tag skill-tag-missing text-sm">
                        <JargonTooltip term={s}>{s}</JargonTooltip>
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex items-center justify-between border-t border-[#E5D5CE] pt-3">
                    <span className="text-sm text-[#7A6A65]">
                      {lang === 'ta' ? 'உதவித்தொகை:' : 'Stipend:'} <span className="font-semibold text-[#2B1B17]">{i.stipend || 'Competitive'}</span>
                    </span>

                    <div className="flex gap-3">
                      <Link to={`/student/internships/${i.id}`} className="btn btn-ghost py-2 px-4 text-sm font-semibold">
                        {lang === 'ta' ? 'விவரம்' : 'View Details'}
                      </Link>
                      <Link to={`/student/internships/${i.id}`} className="btn btn-primary py-2 px-5 text-sm font-semibold">
                        {lang === 'ta' ? 'விண்ணப்பிக்க' : 'Apply Now'}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Right Column: Profile Highlights & Preferences ── */}
        <div className="lg:col-span-4 space-y-6">
          <SectionTitle title={lang === 'ta' ? 'சுயவிவர பகுப்பாய்வு' : 'Profile Diagnostics'} />

          {/* Skills Widget with Jargon Glossary */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-base font-bold text-[#2B1B17]">
                {lang === 'ta' ? 'தொழில்நுட்பத் திறன்கள்' : 'Your Technical Stack'}
              </h3>
              <span className="text-sm font-semibold text-[#7A6A65]">{parsedSkills.length} skills</span>
            </div>

            <p className="text-xs text-[#7A6A65] mb-3">
              {lang === 'ta'
                ? 'திறன் விளக்கத்தைப் படிக்க அதன் மீது வைக்கவும் (Hover for explanation):'
                : 'Hover or tap underlined skills for beginner-friendly definitions:'}
            </p>

            {parsedSkills.length === 0 ? (
              <p className="text-sm text-[#7A6A65] mb-4">
                {lang === 'ta' ? 'திறன்கள் இன்னும் சேர்க்கப்படவில்லை.' : 'No skills registered yet.'}
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {parsedSkills.map((skill) => (
                  <span key={skill} className="skill-tag skill-tag-have text-sm">
                    <JargonTooltip term={skill}>{skill}</JargonTooltip>
                  </span>
                ))}
              </div>
            )}

            <Link
              to="/student/cv-review"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#7A4B43] hover:text-[#5E342D] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {lang === 'ta' ? 'CV-லிருந்து திறன்களைப் பிரித்தெடு →' : 'Extract & Update Skills from CV →'}
            </Link>
          </div>

          {/* Preferences Summary */}
          <div className="card">
            <h3 className="font-serif text-base font-bold text-[#2B1B17] mb-4">Career Preferences</h3>
            <dl className="space-y-3.5 text-sm">
              {[
                { label: 'University', value: profile?.university || 'Not specified' },
                { label: 'Preferred Location', value: profile?.preferredLocation || 'Flexible' },
                { label: 'Work Mode', value: profile?.preferredWorkMode || 'Hybrid' },
                { label: 'Academic GPA', value: profile?.gpa ? String(profile.gpa) : 'Not specified' },
              ].map((item) => (
                <div key={item.label} className="flex items-start justify-between border-b border-[#E5D5CE] pb-2.5 last:border-none">
                  <dt className="text-[#7A6A65] font-medium">{item.label}</dt>
                  <dd className="font-semibold text-[#2B1B17] text-right">{item.value}</dd>
                </div>
              ))}
            </dl>
            <Link
              to="/student/profile"
              className="mt-4 block text-sm font-bold text-[#7A4B43] hover:text-[#5E342D] transition-colors"
            >
              Update Preferences & Bio →
            </Link>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          BOTTOM SECTION — Application Tracker Table
          ═══════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <SectionTitle
          title="Active Applications"
          action={
            <Link to="/student/applications" className="text-sm font-bold text-[#7A4B43] hover:text-[#5E342D] uppercase tracking-wider">
              Full Application History →
            </Link>
          }
        />

        <div className="card p-0 overflow-hidden">
          {applications.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-base text-[#7A6A65] mb-2">You haven't submitted any applications yet.</p>
              <Link to="/student/internships" className="text-sm text-[#7A4B43] font-bold hover:underline">
                Explore recommended openings and apply today →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E5D5CE] bg-[#FAF6F4] text-[#7A6A65] uppercase tracking-wider font-semibold text-xs">
                    <th className="px-6 py-4">Company</th>
                    <th className="px-6 py-4">Position</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5D5CE]">
                  {applications.slice(0, 5).map((a) => (
                    <tr key={a.id} className="hover:bg-[#FAF6F4]/60 transition-colors">
                      <td className="px-6 py-4 font-bold text-[#2B1B17]">{a.companyName || 'Company'}</td>
                      <td className="px-6 py-4 text-[#7A6A65] font-medium">{a.internshipTitle || 'Internship'}</td>
                      <td className="px-6 py-4">
                        <Badge kind={statusBadge[a.status] || 'warn'}>{a.status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link to="/student/applications" className="text-sm font-bold text-[#7A4B43] hover:text-[#5E342D]">
                          View Status →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
            impact: 'Listed as an essential technical requirement by the company.',
          })) as MissingSkillEntry[]}
          factorBreakdown={[
            { label: 'Technical Skills Overlap', weight: 60, score: Math.round(drawerRec.matchPercentage) },
            { label: 'Profile Completion & Readiness', weight: 40, score: profileScore },
          ]}
        />
      )}
    </div>
  );
}
