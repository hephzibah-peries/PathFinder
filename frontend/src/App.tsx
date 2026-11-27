import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import OAuth2Redirect from './pages/auth/OAuth2Redirect';

import StudentLayout from './layouts/StudentLayout';
import StudentProfile from './pages/student/Profile';
import InternshipSearch from './pages/student/InternshipSearch';
import InternshipDetails from './pages/student/InternshipDetails';
import Applications from './pages/student/Applications';
import SkillGap from './pages/student/SkillGap';
import Readiness from './pages/student/Readiness';
import Roadmap from './pages/student/Roadmap';
import CVSkillReview from './pages/student/CVSkillReview';
import AIMockInterview from './pages/student/AIMockInterview';

import CompanyLayout from './layouts/CompanyLayout';
import CompanyProfile from './pages/company/Profile';
import ManageInternships from './pages/company/ManageInternships';
import Applicants from './pages/company/Applicants';
import CandidateDetails from './pages/company/CandidateDetails';

import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/oauth2/redirect" element={<OAuth2Redirect />} />

          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="internships" element={<InternshipSearch />} />
            <Route path="internships/:id" element={<InternshipDetails />} />
            <Route path="applications" element={<Applications />} />
            <Route path="skills" element={<SkillGap />} />
            <Route path="readiness" element={<Readiness />} />
            <Route path="roadmap" element={<Roadmap />} />
            <Route path="cv-review" element={<CVSkillReview />} />
            <Route path="mock-interview" element={<AIMockInterview />} />
          </Route>

          <Route path="/company" element={<CompanyLayout />}>
            <Route index element={<ManageInternships />} />
            <Route path="internships" element={<ManageInternships />} />
            <Route path="applicants" element={<Applicants />} />
            <Route path="applicants/:id" element={<CandidateDetails />} />
            <Route path="profile" element={<CompanyProfile />} />
          </Route>

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
