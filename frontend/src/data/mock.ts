export type SkillSource = 'self' | 'verified';

export interface SkillEntry {
  name: string;
  source: SkillSource;
}

export const readiness = {
  score: 82,
  breakdown: [
    { label: 'Technical Skills', value: 88 },
    { label: 'Projects', value: 85 },
    { label: 'Education', value: 80 },
    { label: 'Certifications', value: 65, warn: true },
    { label: 'Experience', value: 55, warn: true },
    { label: 'Profile Completeness', value: 95 },
  ],
  strengths: [
    'Strong Java and Spring Boot foundation',
    'Solid project portfolio with real backend work',
    'Strong SQL and database knowledge',
  ],
  improvements: [
    'Gain hands-on cloud experience',
    'Improve automated testing knowledge',
    'Add any internship or work experience',
  ],
};

export const internships = [
  {
    id: 'nimbus-swe',
    title: 'Software Engineer Intern',
    company: 'Nimbus Systems',
    logo: 'N',
    location: 'Colombo',
    mode: 'Hybrid',
    duration: '3 months',
    deadline: '20 Sep 2026',
    match: 92,
    factorBreakdown: [
      { label: 'Technical Skills', weight: 40, score: 95 },
      { label: 'Projects', weight: 25, score: 90 },
      { label: 'Education', weight: 20, score: 85 },
      { label: 'Certifications', weight: 10, score: 65 },
      { label: 'Experience', weight: 5, score: 55 },
    ],
    matched: [
      { name: 'Java', source: 'verified' },
      { name: 'Spring Boot', source: 'verified' },
      { name: 'SQL', source: 'self' },
      { name: 'REST API', source: 'self' },
    ] as SkillEntry[],
    missing: [
      { name: 'Docker', source: 'self', impact: 'Required in 78% of backend roles. Closing this gap could push your match to 97%.' },
    ] as (SkillEntry & { impact: string })[],
  },
  {
    id: 'orbital-fe',
    title: 'Frontend Developer Intern',
    company: 'Orbital Labs',
    logo: 'O',
    location: 'Remote',
    mode: 'Remote',
    duration: '6 months',
    deadline: '30 Sep 2026',
    match: 89,
    factorBreakdown: [
      { label: 'Technical Skills', weight: 40, score: 89 },
      { label: 'Projects', weight: 25, score: 88 },
      { label: 'Education', weight: 20, score: 82 },
      { label: 'Certifications', weight: 10, score: 60 },
      { label: 'Experience', weight: 5, score: 50 },
    ],
    matched: [
      { name: 'React', source: 'verified' },
      { name: 'JavaScript', source: 'self' },
    ] as SkillEntry[],
    missing: [
      { name: 'TypeScript', source: 'self', impact: 'Listed as preferred in this role. Adding it could raise your match by ~6%.' },
    ] as (SkillEntry & { impact: string })[],
  },
  {
    id: 'reef-data',
    title: 'Data Analyst Intern',
    company: 'Reef Analytics',
    logo: 'R',
    location: 'Remote',
    mode: 'Remote',
    duration: '4 months',
    deadline: '30 Sep 2026',
    match: 76,
    factorBreakdown: [
      { label: 'Technical Skills', weight: 40, score: 76 },
      { label: 'Projects', weight: 25, score: 70 },
      { label: 'Education', weight: 20, score: 80 },
      { label: 'Certifications', weight: 10, score: 50 },
      { label: 'Experience', weight: 5, score: 40 },
    ],
    matched: [
      { name: 'SQL', source: 'self' },
      { name: 'Python', source: 'verified' },
    ] as SkillEntry[],
    missing: [
      { name: 'Power BI', source: 'self', impact: 'Core tool for this team. Gaining it could move your match into the 88% range.' },
    ] as (SkillEntry & { impact: string })[],
  },
];

export const applications = [
  { internship: 'Software Engineer Intern', company: 'Nimbus Systems', applied: '1 Sep', match: 92, status: 'Under Review' as const },
  { internship: 'Backend Developer Intern', company: 'Reef Analytics', applied: '18 Aug', match: 84, status: 'Shortlisted' as const },
  { internship: 'QA Engineer Intern', company: 'Blueharbor', applied: '2 Aug', match: 61, status: 'Rejected' as const },
];

export const skillGap = {
  targetRole: 'Backend Developer',
  currentPct: 68,
  have: [
    { name: 'Java', source: 'verified' },
    { name: 'Spring Boot', source: 'verified' },
    { name: 'SQL', source: 'self' },
    { name: 'REST API', source: 'self' },
  ] as SkillEntry[],
  missing: [
    { name: 'Docker', source: 'self' },
    { name: 'AWS', source: 'self' },
  ] as SkillEntry[],
  priorities: [
    { skill: 'Docker', level: 'High priority', kind: 'error' as const, note: 'Appears in 78% of backend internships you\u2019re eligible for.' },
    { skill: 'AWS', level: 'Medium priority', kind: 'warn' as const, note: 'Common in senior-leaning postings, less so at intern level.' },
    { skill: 'Microservices', level: 'Low priority', kind: 'info' as const, note: 'Nice to have \u2014 rarely required outright for interns.' },
  ],
  roadmap: [
    { step: 'Learn Docker fundamentals', time: '~2 weeks, beginner-friendly', locked: false },
    { step: 'Containerise a Spring Boot project', time: '~1 week, hands-on practice', locked: false },
    { step: 'Learn AWS fundamentals', time: '~3 weeks', locked: true },
    { step: 'Deploy your project to AWS', time: '~1 week', locked: true },
  ],
};

export const roadmapStages = [
  { title: 'Stage 1 \u2014 Foundation', detail: 'Java \u00b7 SQL \u00b7 Git \u2014 complete', done: true },
  { title: 'Stage 2 \u2014 Backend development', detail: 'Spring Boot \u00b7 REST APIs \u00b7 PostgreSQL \u2014 complete', done: true },
  { title: 'Stage 3 \u2014 Industry skills', detail: 'Docker \u00b7 Testing \u00b7 Microservices \u2014 in progress', done: false },
  { title: 'Stage 4 \u2014 Cloud', detail: 'AWS \u00b7 CI/CD \u2014 not started', done: false },
  { title: 'Stage 5 \u2014 Internship ready', detail: 'Portfolio \u00b7 CV \u00b7 Interview prep \u2014 not started', done: false },
];

export const companyApplicants = [
  { name: 'Alex Kumar', university: 'NSBM Green University', skills: 'Java, Spring Boot, SQL', match: 94, status: 'Shortlisted' as const },
  { name: 'Priya Silva', university: 'University of Moratuwa', skills: 'React, Node.js', match: 81, status: 'Under Review' as const },
  { name: 'Dinuk Perera', university: 'SLIIT', skills: 'Python, Django', match: 73, status: 'Under Review' as const },
];

export const pendingCompanies = [
  { name: 'Reef Analytics', industry: 'Data & Analytics', location: 'Colombo', registered: '1 Sep' },
  { name: 'Orbital Labs', industry: 'Software', location: 'Remote', registered: '30 Aug' },
];

export interface CvExtractedSkill {
  id: string;
  name: string;
  category: string;
  confidence: number; // 0-100
  state: 'pending' | 'confirmed' | 'removed';
}

export const cvExtractedSkills: CvExtractedSkill[] = [
  { id: 'cv-1', name: 'Java', category: 'Programming Language', confidence: 97, state: 'pending' },
  { id: 'cv-2', name: 'Spring Boot', category: 'Framework', confidence: 94, state: 'pending' },
  { id: 'cv-3', name: 'SQL', category: 'Database', confidence: 91, state: 'pending' },
  { id: 'cv-4', name: 'REST API', category: 'Architecture', confidence: 88, state: 'pending' },
  { id: 'cv-5', name: 'Git', category: 'Tooling', confidence: 96, state: 'pending' },
  { id: 'cv-6', name: 'JUnit', category: 'Testing', confidence: 82, state: 'pending' },
  { id: 'cv-7', name: 'Maven', category: 'Tooling', confidence: 79, state: 'pending' },
  { id: 'cv-8', name: 'PostgreSQL', category: 'Database', confidence: 75, state: 'pending' },
  { id: 'cv-9', name: 'Linux', category: 'Platform', confidence: 68, state: 'pending' },
  { id: 'cv-10', name: 'Agile', category: 'Methodology', confidence: 61, state: 'pending' },
  { id: 'cv-11', name: 'HTML', category: 'Markup', confidence: 57, state: 'pending' },
  { id: 'cv-12', name: 'CSS', category: 'Styling', confidence: 54, state: 'pending' },
];

/* ════════════════════════════════════════════════════════════
   STUDENT — Profile, Preferences & Quick Stats
   ════════════════════════════════════════════════════════════ */

export const studentProfile = {
  name: 'Alex Kumar',
  avatar: 'AK',
  email: 'alex.kumar@nsbm.ac.lk',
  phone: '+94 77 234 5678',
  university: 'NSBM Green University',
  degree: 'BSc (Hons) Data Science',
  gpa: 3.7,
  year: 'Final Year',
  location: 'Colombo, Sri Lanka',
  profileCompletion: 85,
  completionTip: 'Add Projects to reach 100%',
  education: [
    { institution: 'NSBM Green University', degree: 'BSc (Hons) Data Science', period: '2023 – 2027', gpa: 3.7 },
    { institution: 'Royal College, Colombo', degree: 'GCE A/L — Physical Science', period: '2020 – 2022', gpa: null },
  ],
  skills: [
    { name: 'Java', source: 'verified' as SkillSource },
    { name: 'Spring Boot', source: 'verified' as SkillSource },
    { name: 'SQL', source: 'self' as SkillSource },
    { name: 'REST API', source: 'self' as SkillSource },
    { name: 'Git', source: 'verified' as SkillSource },
    { name: 'Python', source: 'self' as SkillSource },
    { name: 'React', source: 'self' as SkillSource },
  ],
  projects: [
    { title: 'Library Management System', tech: 'Spring Boot, PostgreSQL, React', description: 'Full-stack library system with RBAC, REST API, and React admin panel. Sole backend developer.' },
    { title: 'Weather Dashboard', tech: 'Python, Flask, Chart.js', description: 'Real-time weather data visualisation using OpenWeather API with 7-day forecast charts.' },
  ],
  certifications: [
    { title: 'Oracle Certified Associate — Java SE 8', issuer: 'Oracle', date: 'Mar 2026' },
  ],
};

export const studentPreferences = {
  preferredLocation: 'Colombo / Remote',
  workMode: 'Hybrid',
  availability: 'Immediate (6 months)',
  careerGoal: 'Full-Stack Software Engineer',
};

export const studentQuickStats = {
  profileScore: 85,
  appliedInternships: 5,
  shortlisted: 2,
  readinessScore: 78,
};

/* ════════════════════════════════════════════════════════════
   COMPANY — Profile, Internship Listings & Quick Stats
   ════════════════════════════════════════════════════════════ */

export const companyProfile = {
  name: 'Nimbus Systems',
  avatar: 'NS',
  industry: 'Enterprise Software',
  location: 'Colombo, Sri Lanka',
  website: 'https://nimbus.lk',
  founded: '2018',
  size: '50–200 employees',
  techStack: ['Java', 'Spring Boot', 'PostgreSQL', 'Docker', 'AWS', 'React'],
  bio: 'Nimbus Systems builds enterprise-grade platform tools for the South-Asian financial sector. Our engineering culture values mentorship, code quality, and shipping real features from week one.',
};

export const companyQuickStats = {
  activePostings: 3,
  totalApplications: 42,
  shortlisted: 8,
  avgFitRate: 82,
};

export interface CompanyInternship {
  id: string;
  title: string;
  applicants: number;
  posted: string;
  duration: string;
  mode: string;
  status: 'Active' | 'Closed' | 'Draft';
}

export const companyInternships: CompanyInternship[] = [
  { id: 'ci-1', title: 'Backend Java Intern', applicants: 18, posted: '15 Aug 2026', duration: '6 months', mode: 'Hybrid', status: 'Active' },
  { id: 'ci-2', title: 'Frontend Developer Intern', applicants: 14, posted: '20 Aug 2026', duration: '3 months', mode: 'Remote', status: 'Active' },
  { id: 'ci-3', title: 'DevOps Intern', applicants: 10, posted: '25 Aug 2026', duration: '6 months', mode: 'On-site', status: 'Active' },
  { id: 'ci-4', title: 'QA Engineer Intern', applicants: 7, posted: '1 Jul 2026', duration: '3 months', mode: 'Hybrid', status: 'Closed' },
];
