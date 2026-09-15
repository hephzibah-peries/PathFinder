import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ProgressBar, ScoreRing, SkillTag, Badge, SectionTitle, SkillSourceBadge } from '../../components/ui';
import MatchExplanationDrawer from '../../components/MatchExplanationDrawer';
import type { MissingSkillEntry } from '../../components/MatchExplanationDrawer';
import {
  studentQuickStats,
  studentProfile,
  studentPreferences,
  internships,
  applications,
} from '../../data/mock';

const statusBadge = {
  Shortlisted: 'success',
  'Under Review': 'warn',
  Rejected: 'error',
} as const;

export default function StudentDashboard() {
  const [drawerInternship, setDrawerInternship] = useState<typeof internships[0] | null>(null);

  return (
    <div>
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
            <div className="stat-card-value text-signal">{studentQuickStats.profileScore}%</div>
            <div className="stat-card-label">Profile Completed</div>
            <div className="mt-2">
              <ProgressBar value={studentQuickStats.profileScore} />
            </div>
            <Link to="/student/profile" className="stat-card-sub text-signal hover:underline">
              {studentProfile.completionTip} →
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
            <div className="stat-card-value">{studentQuickStats.appliedInternships}</div>
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
            <div className="stat-card-value">{studentQuickStats.shortlisted}</div>
            <div className="stat-card-label">Companies Shortlisted</div>
            <div className="stat-card-sub text-amber">Interviewing</div>
          </div>
        </div>

        {/* Career Readiness Score */}
        <div className="stat-card">
          <div className="flex-shrink-0">
            <ScoreRing score={studentQuickStats.readinessScore} label="/ 100" size={68} />
          </div>
          <div>
            <div className="stat-card-value">{studentQuickStats.readinessScore}</div>
            <div className="stat-card-label">Career Readiness</div>
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

          {internships.map((i) => (
            <div key={i.id} className="card mb-3.5">
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[10px] bg-ink font-serif text-[15px] text-white">
                    {i.logo}
                  </div>
                  <div>
                    <b className="text-[14.5px]">{i.title}</b>
                    <div className="my-1 text-[12.5px] text-ink-soft">
                      {i.company} · {i.location} · {i.mode} · {i.duration}
                    </div>
                  </div>
                </div>

                {/* AI Match Badge */}
                <button
                  onClick={() => setDrawerInternship(i)}
                  className="flex flex-col items-center gap-0.5 rounded-[10px] bg-signal-soft px-3 py-1.5 transition-colors hover:bg-signal/10"
                  title="Click to see match breakdown"
                >
                  <span className="font-serif text-[17px] font-bold text-signal">{i.match}%</span>
                  <span className="text-[10px] font-semibold text-signal/70">Match</span>
                </button>
              </div>

              {/* Matched/missing skill tags */}
              <div className="mt-2.5">
                {i.matched.map((s) => (
                  <SkillTag key={s.name} label={s.name} state="have" source={s.source} />
                ))}
                {i.missing.map((s) => (
                  <SkillTag key={s.name} label={s.name} state="missing" />
                ))}
              </div>

              {/* Actions */}
              <div className="mt-3 flex gap-2.5">
                <Link to={`/student/internships/${i.id}`} className="btn btn-ghost py-2 text-[12.5px]">
                  View Details
                </Link>
                <Link to="/student/applications" className="btn btn-primary py-2 text-[12.5px]">
                  Apply Now
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* ── Right Column: Profile Highlights & Preferences ── */}
        <div>
          <SectionTitle title="Profile Highlights" />

          {/* Skills Widget */}
          <div className="card mb-4">
            <h3 className="mb-3 text-[14px] font-serif">Your Skills</h3>
            <div className="mb-3">
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Verified Skills</div>
              {studentProfile.skills
                .filter((s) => s.source === 'verified')
                .map((s) => (
                  <span key={s.name} className="skill-tag skill-tag-have mb-1.5 mr-1.5">
                    {s.name}
                    <SkillSourceBadge source="verified" />
                  </span>
                ))}
            </div>
            <div>
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Self-Declared Skills</div>
              {studentProfile.skills
                .filter((s) => s.source === 'self')
                .map((s) => (
                  <span key={s.name} className="skill-tag mb-1.5 mr-1.5">
                    {s.name}
                    <SkillSourceBadge source="self" />
                  </span>
                ))}
            </div>
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
                { label: 'Preferred Location', value: studentPreferences.preferredLocation },
                { label: 'Work Mode', value: studentPreferences.workMode },
                { label: 'Availability', value: studentPreferences.availability },
                { label: 'Career Goal', value: studentPreferences.careerGoal },
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
        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr className="bg-sand/30">
              {['Company', 'Role', 'Applied Date', 'Status', 'Action'].map((h) => (
                <th key={h} className="border-b border-sand-line px-4 py-3 text-left text-[11.5px] font-semibold text-ink-soft">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {applications.map((a) => (
              <tr key={a.internship} className="table-row-hover transition-colors">
                <td className="border-b border-sand-line px-4 py-3.5 font-medium">{a.company}</td>
                <td className="border-b border-sand-line px-4 py-3.5">{a.internship}</td>
                <td className="border-b border-sand-line px-4 py-3.5 text-ink-soft">{a.applied}</td>
                <td className="border-b border-sand-line px-4 py-3.5">
                  <Badge kind={statusBadge[a.status]}>{a.status}</Badge>
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
      </div>

      {/* ── Match Explanation Drawer ── */}
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
    </div>
  );
}
