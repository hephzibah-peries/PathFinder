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
  status: string;
  appliedAt?: string;
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

const BASE_URL = '/api';

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
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
  getMe: () => request<any>('/test/me'),
};

export const studentApi = {
  getProfile: () => request<StudentProfile>('/students/me'),
  updateProfile: (profile: Partial<StudentProfile>) =>
    request<StudentProfile>('/students/me', {
      method: 'PUT',
      body: JSON.stringify(profile),
    }),
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
  getAll: (customToken?: string) =>
    request<Internship[]>('/internships', {
      headers: customToken ? { Authorization: `Bearer ${customToken}` } : {},
    }),
  getById: (id: number | string, customToken?: string) =>
    request<Internship>(`/internships/${id}`, {
      headers: customToken ? { Authorization: `Bearer ${customToken}` } : {},
    }),
  getMyInternships: (customToken?: string) =>
    request<Internship[]>('/internships/my', {
      headers: customToken ? { Authorization: `Bearer ${customToken}` } : {},
    }),
  create: (data: Partial<Internship>, customToken?: string) =>
    request<Internship>('/internships', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: customToken ? { Authorization: `Bearer ${customToken}` } : {},
    }),
};

export const applicationApi = {
  getMyApplications: () => request<Application[]>('/applications/my-applications'),
  apply: (internshipId: number | string) =>
    request<Application>(`/applications/apply/${internshipId}`, {
      method: 'POST',
    }),
  getForInternship: (internshipId: number | string) =>
    request<Application[]>(`/applications/internship/${internshipId}`),
  updateStatus: (applicationId: number | string, status: string) =>
    request<Application>(`/applications/${applicationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
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
};
