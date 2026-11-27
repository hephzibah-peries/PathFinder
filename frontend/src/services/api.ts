export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: 'STUDENT' | 'COMPANY' | 'ADMIN';
}

export interface AuthResponse {
  token: string;
  email: string;
  role: string;
}

export interface StudentProfile {
  id?: number;
  userId?: number;
  email?: string;
  fullName?: string;
  university?: string;
  gpa?: number;
  bio?: string;
  skills?: string;
  preferredLocation?: string;
  preferredWorkMode?: string;
  profilePicture?: string;
}

export interface StudentResume {
  id: number;
  studentId?: number;
  fileName: string;
  fileType?: string;
  fileSize?: number;
  uploadedAt: string;
  extractedSkills: string[];
}

export interface RoadmapStep {
  stepNumber: number;
  title: string;
  estimatedTime: string;
  description: string;
  recommendedResources: string[];
}

export interface SkillDiagnosisResponse {
  targetRole: string;
  resumeFileName: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  roadmap: RoadmapStep[];
}

export interface CompanyProfile {
  id?: number;
  userId?: number;
  email?: string;
  companyName?: string;
  industry?: string;
  description?: string;
  website?: string;
  verified?: boolean;
}

export interface Internship {
  id: number;
  companyId?: number;
  companyName?: string;
  title: string;
  description?: string;
  location?: string;
  workMode?: string;
  duration?: string;
  requirements?: string;
  skills?: string;
  stipend?: string;
  deadline?: string;
}

export interface Application {
  id: number;
  internshipId: number;
  internshipTitle?: string;
  companyName?: string;
  studentId?: number;
  studentName?: string;
  studentEmail?: string;
  studentPhone?: string;
  cvEmail?: string;
  university?: string;
  degree?: string;
  gpa?: number;
  resumeId?: number;
  resumeFileName?: string;
  status: string;
  appliedAt?: string;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export interface Recommendation {
  internship: Internship;
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export interface ResumeAnalysis {
  extractedText: string;
  extractedSkills: string[];
  missingSkills: string[];
  matchScore: number;
}

export interface UserSession {
  email: string;
  role: string;
  name?: string;
}

const TOKEN_KEY = 'pathfinder_token';
const USER_KEY = 'pathfinder_user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('token');
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem('token', token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('token');
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('user');
}

export function getStoredUser(): UserSession | null {
  const user = localStorage.getItem(USER_KEY);
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}

export function setStoredUser(user: UserSession): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Resolves the backend host/origin without trailing slash or '/api'.
 * Example: 'https://pathfinder-6rly.onrender.com' or 'http://localhost:8080'
 */
export function getBackendHost(): string {
  const rawUrl = (import.meta.env.VITE_API_URL || '').trim();
  if (rawUrl) {
    return rawUrl.replace(/\/+$/, '').replace(/\/api$/, '');
  }

  // Automatic local development fallback:
  // If VITE_API_URL is not set, default to http://localhost:8080 during local development
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '0.0.0.0' ||
      window.location.hostname === '')
  ) {
    return 'http://localhost:8080';
  }

  return '';
}

/**
 * Resolves the base URL for API endpoints.
 * - If VITE_API_URL is configured (e.g. 'https://pathfinder-6rly.onrender.com'), returns 'https://pathfinder-6rly.onrender.com/api'.
 * - If VITE_API_URL is empty, returns '/api' (relying on Vite proxy or same-origin deployment).
 * Handles trailing slashes and avoids duplicate '/api/api' paths.
 */
export function getApiBaseUrl(): string {
  const host = getBackendHost();
  return host ? `${host}/api` : '/api';
}

/**
 * Normalizes any endpoint into a clean, fully qualified or proxied URL.
 * Handles:
 *   - Absolute URLs ('http://...', 'https://...')
 *   - Endpoints with or without leading slash ('/auth/login' vs 'auth/login')
 *   - Endpoints that already contain '/api' ('/api/auth/login' -> '.../api/auth/login')
 */
export function buildApiUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }

  const base = getApiBaseUrl();
  let path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (path === '/api') {
    path = '';
  } else if (path.startsWith('/api/')) {
    path = path.substring(4); // e.g. '/api/auth/login' -> '/auth/login'
  }

  return `${base}${path}`;
}

/**
 * Direct OAuth2 authorization redirect URL pointing to Spring Security's endpoint.
 */
export function getOAuth2AuthorizationUrl(provider = 'google'): string {
  const host = getBackendHost();
  return host ? `${host}/oauth2/authorization/${provider}` : `/oauth2/authorization/${provider}`;
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = buildApiUrl(endpoint);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // 401 Unauthorized Interceptor: Clear stored tokens/session and redirect to /login
    if (response.status === 401) {
      removeToken();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    let errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
    } catch {
      try {
        const text = await response.text();
        if (text) errorMessage = text;
      } catch {
        // use default message
      }
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export const authApi = {
  login: (data: LoginRequest) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  register: (data: RegisterRequest) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  loginWithGoogle: (token: string) => {
    const cleanToken = (token || '').trim();
    return request<AuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({
        token: cleanToken,
        credential: cleanToken,
        idToken: cleanToken,
      }),
    });
  },
  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, newPassword: string) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),
  getMe: () => request<any>('/test/me'),
};

export interface DbStatusResponse {
  status: string;
  database: string;
  type?: string;
}

export const healthApi = {
  getDbStatus: () => request<DbStatusResponse>('/public/db-status'),
};

export const studentApi = {
  getProfile: () => request<StudentProfile>('/students/me'),
  updateProfile: (profile: Partial<StudentProfile>) =>
    request<StudentProfile>('/students/me', {
      method: 'PUT',
      body: JSON.stringify(profile),
    }),
  uploadPhoto: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<StudentProfile>('/students/me/photo', {
      method: 'POST',
      body: formData,
    });
  },
};

export const companyApi = {
  getProfile: () => request<CompanyProfile>('/companies/me'),
  updateProfile: (profile: Partial<CompanyProfile>) =>
    request<CompanyProfile>('/companies/me', {
      method: 'PUT',
      body: JSON.stringify(profile),
    }),
};

export const internshipApi = {
  getAll: (customToken?: string) => {
    const token = customToken || getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return request<Internship[]>('/internships', { headers });
  },
  getById: (id: number | string, customToken?: string) => {
    const token = customToken || getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return request<Internship>(`/internships/${id}`, { headers });
  },
  getMyInternships: (customToken?: string) => {
    const token = customToken || getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return request<Internship[]>('/internships/my', { headers });
  },
  create: (data: Partial<Internship>, customToken?: string) => {
    const token = customToken || getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return request<Internship>('/internships', {
      method: 'POST',
      body: JSON.stringify(data),
      headers,
    });
  },
};

export const applicationApi = {
  getMyApplications: () => request<Application[]>('/applications/my-applications'),
  apply: (internshipId: number | string, resumeId?: number | string) => {
    const query = resumeId ? `?resumeId=${resumeId}` : '';
    return request<Application>(`/applications/apply/${internshipId}${query}`, {
      method: 'POST',
    });
  },
  getForInternship: (internshipId: number | string) =>
    request<Application[]>(`/applications/internship/${internshipId}`),
  updateStatus: (applicationId: number | string, status: string, note?: string) =>
    request<Application>(`/applications/${applicationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, note }),
    }),
  getApplicantResumeBlob: async (applicationId: number | string): Promise<Blob> => {
    const token = getToken();
    const url = buildApiUrl(`/applications/${applicationId}/resume`);
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      let errText = `Failed to load applicant resume (${res.status})`;
      try {
        const errJson = await res.json();
        if (errJson.message) errText = errJson.message;
      } catch {}
      throw new Error(errText);
    }
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      throw new Error('Received HTML error page instead of PDF document');
    }
    const blob = await res.blob();
    return new Blob([blob], { type: 'application/pdf' });
  },
};

export const notificationApi = {
  getMyNotifications: () => request<NotificationsResponse>('/notifications/my'),
  markAsRead: (id: number | string) =>
    request<void>(`/notifications/${id}/read`, {
      method: 'PUT',
    }),
  markAllAsRead: () =>
    request<void>('/notifications/read-all', {
      method: 'PUT',
    }),
};

export const recommendationApi = {
  getRecommendations: () => request<Recommendation[]>('/recommendations'),
};

export const resumeApi = {
  analyze: (file: File, internshipId?: number | string) => {
    const formData = new FormData();
    formData.append('file', file);
    const query = internshipId ? `?internshipId=${internshipId}` : '';
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return request<ResumeAnalysis>(`/resume/analyze${query}`, {
      method: 'POST',
      body: formData,
      headers,
    });
  },
  getMyResumes: () => request<StudentResume[]>('/resume/my-resumes'),
  uploadResume: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<StudentResume>('/resume/upload', {
      method: 'POST',
      body: formData,
    });
  },
  deleteResume: (id: number | string) =>
    request<void>(`/resume/${id}`, {
      method: 'DELETE',
    }),
  getResumeFile: async (id: number | string): Promise<Blob> => {
    const token = getToken();
    const url = buildApiUrl(`/resume/${id}/file`);
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      let errText = `Failed to load resume file (${res.status})`;
      try {
        const errJson = await res.json();
        if (errJson.message) errText = errJson.message;
      } catch {}
      throw new Error(errText);
    }
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      throw new Error('Received HTML error page instead of PDF document');
    }
    const blob = await res.blob();
    return new Blob([blob], { type: 'application/pdf' });
  },
  diagnose: (params: { resumeId?: number; targetRole?: string; internshipId?: number }) =>
    request<SkillDiagnosisResponse>('/resume/diagnose', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
};

export interface InterviewQuestion {
  id: number;
  question: string;
  type: 'TECHNICAL' | 'SYSTEM_SCENARIO' | 'BEHAVIORAL' | string;
  focusArea: string;
  context: string;
}

export interface InterviewEvaluation {
  technicalScore: number;
  communicationClarity: number;
  modelAnswer: string;
  constructiveFeedback: string;
  keyStrengths: string[];
}

export interface InterviewSessionRecord {
  id?: number;
  studentId?: number;
  studentEmail?: string;
  targetRole: string;
  overallScore: number;
  technicalAverage: number;
  communicationAverage: number;
  qaBreakdownJson?: string;
  createdAt?: string;
}

export interface GenerateInterviewParams {
  internshipId?: number;
  targetRole?: string;
  questionCategory?: string;
}

export interface EvaluateInterviewParams {
  questionId: number;
  question: string;
  candidateAnswer: string;
  questionType?: string;
  focusArea?: string;
}

export interface CompleteInterviewParams {
  targetRole: string;
  overallScore: number;
  technicalAverage: number;
  communicationAverage: number;
  qaBreakdown: Array<{
    questionId: number;
    question: string;
    type: string;
    focusArea: string;
    candidateAnswer: string;
    evaluation: InterviewEvaluation;
  }>;
}

export const aiInterviewApi = {
  generateQuestions: (params: GenerateInterviewParams = {}) =>
    request<InterviewQuestion[]>('/ai/interview/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  evaluateResponse: (params: EvaluateInterviewParams) =>
    request<InterviewEvaluation>('/ai/interview/evaluate', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  completeSession: (params: CompleteInterviewParams) =>
    request<InterviewSessionRecord>('/ai/interview/complete', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  getHistory: () =>
    request<InterviewSessionRecord[]>('/ai/interview/history'),
};

export interface MlMatchRequest {
  cvText?: string;
  jobTitle?: string;
  jobDescription?: string;
  requiredSkills?: string[];
}

export interface MlBatchItem {
  id: number;
  title?: string;
  description?: string;
  skills?: string[];
  candidateName?: string;
  candidateCvText?: string;
}

export interface MlBatchRankRequest {
  cvText?: string;
  internshipId?: number;
  jobTitle?: string;
  jobDescription?: string;
  requiredSkills?: string[];
  items: MlBatchItem[];
}

export interface MlMatchResponse {
  itemId?: number;
  shortlistProbability: number;
  semanticScore: number;
  fitCategory: 'Strong Fit' | 'Moderate Fit' | 'Low Fit' | string;
  explanationFactors: string[];
  modelSource: string;
  matchedSkills: string[];
  missingSkills: string[];
}

export const mlApi = {
  predictMatch: (data: MlMatchRequest) =>
    request<MlMatchResponse>('/ml/predict-match', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  rankBatch: (data: MlBatchRankRequest) =>
    request<MlMatchResponse[]>('/ml/rank-batch', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

