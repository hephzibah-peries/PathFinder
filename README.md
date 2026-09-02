# Pathfinder — AI Internship & Career Readiness Platform (UI prototype)

Vite + React + TypeScript + Tailwind frontend prototype covering the Student, Company and Admin
experiences, built from the platform's design system (ink navy / warm paper / signal green,
Newsreader + Inter type).

## Structure

```
src/
  components/   shared UI primitives (ScoreRing, ProgressBar, SkillTag, WhyBox, ...)
  data/         mock data standing in for the backend/ML service responses
  layouts/      per-role shells with top navigation (Student / Company / Admin)
  pages/
    auth/       login
    student/    dashboard, internship search, internship details + AI match, applications,
                skill gap, career readiness, career roadmap
    company/    dashboard, candidate details + AI match
    admin/      dashboard (pending company approvals, skill demand)
  App.tsx       route tree
```

## Run it

```bash
npm install
npm run dev
```

## Notes

- All data is mocked in `src/data/mock.ts` — swap for real API/ML-service calls when the backend
  is ready.
- AI match/readiness scores are always paired with a "why" explanation box (`WhyBox` component) —
  keep that pattern wherever a new AI-generated score is added, per the platform's explainability
  requirement.
- Not yet built: CV upload + analysis screen, multi-step internship posting form, admin
  student/company/internship management tables, full analytics charts, responsive breakpoints,
  and empty/error/loading states.
