import { useState, useEffect, useRef } from 'react';
import { studentApi, resumeApi, StudentProfile as StudentProfileType, StudentResume } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

function formatBytes(bytes?: number): string {
  if (!bytes) return 'Unknown size';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Cache for local uploaded files to ensure instantaneous access to original file
const localFileCache = new Map<number | string, Blob>();

export default function StudentProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfileType | null>(null);
  const [resumes, setResumes] = useState<StudentResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hidden file input for direct avatar upload
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const modalAvatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Resume upload state
  const resumeFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeSuccessMsg, setResumeSuccessMsg] = useState<string | null>(null);
  const [resumeErrorMsg, setResumeErrorMsg] = useState<string | null>(null);
  const [viewingFile, setViewingFile] = useState<{
    resume: StudentResume;
    blobUrl: string;
  } | null>(null);
  const [loadingFileId, setLoadingFileId] = useState<number | null>(null);

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editUniversity, setEditUniversity] = useState('');
  const [editGpa, setEditGpa] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editProfilePicture, setEditProfilePicture] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const [profileResult, resumesResult] = await Promise.allSettled([
        studentApi.getProfile(),
        resumeApi.getMyResumes(),
      ]);

      let data: StudentProfileType | null = null;
      if (profileResult.status === 'fulfilled') {
        data = profileResult.value;
      }

      let resumesData: StudentResume[] = [];
      if (resumesResult.status === 'fulfilled') {
        resumesData = resumesResult.value || [];
      }

      if (data) {
        setProfile(data);
        setEditFullName(data.fullName || '');
        setEditUniversity(data.university || '');
        setEditGpa(data.gpa != null ? (Number.isInteger(Number(data.gpa)) ? Number(data.gpa).toFixed(2) : String(data.gpa)) : '');
        setEditBio(data.bio || '');
        setEditProfilePicture(data.profilePicture || null);
      } else {
        setProfile({
          email: user?.email,
          fullName: user?.name,
        });
        setEditFullName(user?.name || '');
      }
      setResumes(resumesData);
    } catch (err: any) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleResumeUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setResumeErrorMsg('File size must be under 5MB.');
      return;
    }

    try {
      setUploadingResume(true);
      setResumeErrorMsg(null);
      setResumeSuccessMsg(null);
      const uploaded = await resumeApi.uploadResume(file);
      // Cache original uploaded file Blob in memory for instant full-fidelity rendering
      localFileCache.set(uploaded.id, file);
      localFileCache.set(uploaded.fileName, file);
      setResumes((prev) => [uploaded, ...prev]);
      setResumeSuccessMsg(`"${file.name}" uploaded successfully with skills extracted!`);
      setTimeout(() => setResumeSuccessMsg(null), 4000);
    } catch (err: any) {
      setResumeErrorMsg(err.message || 'Failed to upload resume');
    } finally {
      setUploadingResume(false);
      if (resumeFileInputRef.current) resumeFileInputRef.current.value = '';
    }
  };

  const handleDeleteResume = async (resumeId: number) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;
    try {
      await resumeApi.deleteResume(resumeId);
      localFileCache.delete(resumeId);
      setResumes((prev) => prev.filter((r) => r.id !== resumeId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete resume');
    }
  };

  const closeViewer = () => {
    if (viewingFile?.blobUrl) {
      URL.revokeObjectURL(viewingFile.blobUrl);
    }
    setViewingFile(null);
  };

  const handleViewResume = async (resume: StudentResume) => {
    try {
      setLoadingFileId(resume.id);
      let blob: Blob;
      if (localFileCache.has(resume.id)) {
        blob = localFileCache.get(resume.id)!;
      } else if (localFileCache.has(resume.fileName)) {
        blob = localFileCache.get(resume.fileName)!;
      } else {
        blob = await resumeApi.getResumeFile(resume.id);
      }
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(pdfBlob);
      setViewingFile({ resume, blobUrl });
    } catch (err: any) {
      console.error('Failed to preview resume file', err);
      alert(err.message || 'Failed to load full resume document. Please try again.');
    } finally {
      setLoadingFileId(null);
    }
  };

  const handleDirectAvatarUpload = async (file: File) => {
    if (!file) return;
    try {
      setUploadingPhoto(true);
      const updated = await studentApi.uploadPhoto(file);
      setProfile(updated);
      setEditProfilePicture(updated.profilePicture || null);
    } catch (err: any) {
      alert(err.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleModalPhotoSelect = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setEditProfilePicture(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await studentApi.updateProfile({
        fullName: editFullName.trim(),
        university: editUniversity.trim(),
        gpa: editGpa.trim() ? parseFloat(editGpa.trim()) : undefined,
        bio: editBio.trim(),
        skills: profile?.skills,
        preferredLocation: profile?.preferredLocation,
        preferredWorkMode: profile?.preferredWorkMode,
        profilePicture: editProfilePicture || undefined,
      });
      setProfile(updated);
      setIsEditing(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-base text-[#7A6A65]">Loading profile...</div>
      </div>
    );
  }

  const displayName = profile?.fullName || user?.email?.split('@')[0] || 'Student';
  const displayEmail = profile?.email || user?.email || '';
  const avatarInitials = displayName.substring(0, 2).toUpperCase();

  // Filter out empty / unfilled academic information & format GPA preserving decimals
  const formattedGpa = (() => {
    if (profile?.gpa == null || isNaN(Number(profile.gpa))) return null;
    const val = Number(profile.gpa);
    const str = String(profile.gpa);
    if (!str.includes('.')) {
      return val.toFixed(2);
    }
    const parts = str.split('.');
    if (parts[1].length === 1) {
      return `${str}0`;
    }
    return str;
  })();

  return (
    <div className="mx-auto max-w-[880px]">
      {error && (
        <div className="mb-4 rounded-xl bg-[#FDF2ED] p-4 text-sm font-semibold text-[#7A4B43] border border-[#E5D5CE]">
          Note: {error}
        </div>
      )}

      {/* Hidden file input for avatar click */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleDirectAvatarUpload(file);
        }}
      />

      {/* ── Profile Header ── */}
      <div className="card flex items-center justify-between bg-gradient-to-br from-[#EBF5F0]/60 to-white">
        <div className="flex items-center gap-5">
          {/* Avatar with Camera Icon */}
          <div className="relative group">
            {profile?.profilePicture ? (
              <img
                src={profile.profilePicture}
                alt={displayName}
                className="h-20 w-20 rounded-full object-cover shadow-sm border-2 border-white ring-2 ring-[#7A4B43]/30"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#2D6A4F] text-2xl font-bold text-white shadow-sm">
                {avatarInitials}
              </div>
            )}

            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingPhoto}
              title="Upload profile picture"
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#7A4B43] text-white shadow-md hover:bg-[#5E342D] transition-transform hover:scale-110 active:scale-95 disabled:opacity-50"
            >
              {uploadingPhoto ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              )}
            </button>
          </div>

          <div>
            <h1 className="m-0 font-serif text-3xl font-bold text-[#2B1B17]">{displayName}</h1>
            {profile?.university && profile.university.trim() ? (
              <p className="mt-1 text-base text-[#7A6A65] font-semibold">
                {profile.university.trim()}
              </p>
            ) : null}
            {formattedGpa ? (
              <p className="mt-0.5 text-sm text-[#7A6A65] font-medium">
                GPA {formattedGpa}
              </p>
            ) : null}
            {displayEmail ? (
              <p className="mt-0.5 text-sm text-[#7A6A65]">{displayEmail}</p>
            ) : null}
          </div>
        </div>

        <button onClick={() => setIsEditing(true)} className="btn btn-secondary shadow-xs">
          Edit Profile
        </button>
      </div>

      {/* ── CV Management Section ── */}
      <div className="card mt-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#2B1B17]">CV Management</h2>
            <p className="text-sm text-[#7A6A65] mt-0.5">
              Upload multiple targeted CVs (PDF / DOCX) to choose from when applying to internships
            </p>
          </div>

          <div>
            <input
              ref={resumeFileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleResumeUpload(file);
              }}
            />
            <button
              onClick={() => resumeFileInputRef.current?.click()}
              disabled={uploadingResume}
              className="btn btn-primary px-5 py-2.5 text-sm font-semibold flex items-center gap-2"
            >
              {uploadingResume ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Processing CV...</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span>Upload New CV</span>
                </>
              )}
            </button>
          </div>
        </div>

        {resumeSuccessMsg && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3.5 text-sm font-semibold text-emerald-900">
            {resumeSuccessMsg}
          </div>
        )}

        {resumeErrorMsg && (
          <div className="rounded-xl border border-rose-300 bg-rose-50 p-3.5 text-sm font-semibold text-rose-900">
            {resumeErrorMsg}
          </div>
        )}

        {/* Uploaded CVs List */}
        {resumes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#E5D5CE] bg-[#FAF6F4] p-8 text-center">
            <p className="text-base font-semibold text-[#2B1B17] mb-1">No resumes uploaded yet</p>
            <p className="text-sm text-[#7A6A65]">
              Upload your first resume in PDF or DOCX format to enable quick job applications and skill gap diagnosis.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[#E5D5CE] bg-[#FAF6F4]/60 p-4 hover:border-[#D6C1B8] transition-colors"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white border border-[#E5D5CE] text-[#7A4B43] shadow-2xs">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-[#2B1B17]">
                      {resume.fileName}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#7A6A65]">
                      <span>{formatBytes(resume.fileSize)}</span>
                      <span>•</span>
                      <span>Uploaded {new Date(resume.uploadedAt).toLocaleDateString()}</span>
                    </div>

                    {resume.extractedSkills && resume.extractedSkills.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {resume.extractedSkills.slice(0, 5).map((skill) => (
                          <span
                            key={skill}
                            className="rounded-md bg-white border border-[#E5D5CE] px-2 py-0.5 text-xs font-semibold text-[#7A4B43]"
                          >
                            {skill}
                          </span>
                        ))}
                        {resume.extractedSkills.length > 5 && (
                          <span className="text-xs text-[#7A6A65] self-center">
                            +{resume.extractedSkills.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => handleViewResume(resume)}
                    disabled={loadingFileId === resume.id}
                    className="rounded-lg p-2 text-[#7A6A65] hover:bg-white hover:text-[#7A4B43] border border-transparent hover:border-[#E5D5CE] transition-colors disabled:opacity-50"
                    title="View full CV document"
                  >
                    {loadingFileId === resume.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#7A4B43] border-t-transparent" />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteResume(resume.id)}
                    className="rounded-lg p-2 text-[#7A6A65] hover:bg-rose-50 hover:text-rose-700 transition-colors"
                    title="Delete resume"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── About & Bio (Only displayed if student filled it in) ── */}
      {profile?.bio && profile.bio.trim() ? (
        <div className="card mt-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="m-0 text-base font-serif font-bold text-[#2B1B17]">About & Bio</h3>
          </div>
          <p className="text-base text-[#7A6A65] leading-relaxed whitespace-pre-line">
            {profile.bio.trim()}
          </p>
        </div>
      ) : null}

      {/* ── Full CV Document Viewer Modal ── */}
      {viewingFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-5 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeViewer();
          }}
        >
          <div className="relative w-full max-w-5xl h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-[#E5D5CE] overflow-hidden">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5D5CE] bg-[#FAF6F2]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-[#E5D5CE] text-[#7A4B43] shadow-2xs">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-[#2B1B17] truncate max-w-md">
                    {viewingFile.resume.fileName}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#7A6A65]">
                    <span>{formatBytes(viewingFile.resume.fileSize)}</span>
                    <span>•</span>
                    <span>Uploaded {new Date(viewingFile.resume.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Open in Dedicated Browser Tab */}
                <button
                  type="button"
                  onClick={() => window.open(viewingFile.blobUrl, '_blank')}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5D5CE] bg-white px-3.5 py-1.5 text-xs font-bold text-[#7A4B43] hover:bg-[#FDF2ED] transition-colors shadow-2xs"
                  title="Open full document in a new browser tab"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  <span>Open in Tab</span>
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={closeViewer}
                  className="rounded-xl p-1.5 text-[#7A6A65] hover:bg-[#E5D5CE]/50 hover:text-[#2B1B17] transition-colors"
                  title="Close viewer"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Document Viewer Frame */}
            <div className="flex-1 w-full h-full bg-[#F5EFEB] relative overflow-hidden flex items-center justify-center">
              <iframe
                src={`${viewingFile.blobUrl}#toolbar=0&navpanes=0`}
                title={viewingFile.resume.fileName}
                className="w-full h-full border-none bg-white shadow-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Profile Modal ── */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B1B17]/45 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-[#E5D5CE] bg-white p-7 shadow-xl">
            <h2 className="mb-5 font-serif text-2xl font-bold text-[#2B1B17]">Edit Student Profile</h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Profile Picture Upload & Preview in Modal */}
              <div>
                <label className="form-label">Profile Picture</label>
                <div className="flex items-center gap-4">
                  {editProfilePicture ? (
                    <img
                      src={editProfilePicture}
                      alt="Preview"
                      className="h-16 w-16 rounded-full object-cover border border-[#E5D5CE] shadow-xs"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FAF6F4] border border-[#E5D5CE] text-sm font-bold text-[#7A4B43]">
                      {avatarInitials}
                    </div>
                  )}

                  <input
                    ref={modalAvatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleModalPhotoSelect(file);
                    }}
                  />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => modalAvatarInputRef.current?.click()}
                      className="btn btn-secondary px-3 py-1.5 text-xs font-semibold"
                    >
                      {editProfilePicture ? 'Change Photo' : 'Upload Photo'}
                    </button>
                    {editProfilePicture && (
                      <button
                        type="button"
                        onClick={() => setEditProfilePicture(null)}
                        className="btn btn-ghost px-3 py-1.5 text-xs text-rose-600 font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="form-input"
                  placeholder="e.g. Alex Kumar"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">University / Institution & Degree</label>
                  <input
                    type="text"
                    value={editUniversity}
                    onChange={(e) => setEditUniversity(e.target.value)}
                    className="form-input"
                    list="field-of-study-suggestions"
                    placeholder="e.g. University of Colombo · Engineering / Business / CS"
                  />
                  <datalist id="field-of-study-suggestions">
                    <option value="Computer Science / IT" />
                    <option value="Engineering (Mechanical, Civil, Electrical)" />
                    <option value="Business & Management" />
                    <option value="Finance & Economics" />
                    <option value="Biological & Health Sciences" />
                    <option value="Physical Sciences" />
                    <option value="Arts, Design & Media" />
                    <option value="Law & Social Sciences" />
                    <option value="Other" />
                  </datalist>
                </div>
                <div>
                  <label className="form-label">GPA</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editGpa}
                    onChange={(e) => setEditGpa(e.target.value)}
                    className="form-input"
                    placeholder="e.g., 3.75"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">About / Bio & Disciplines</label>
                <textarea
                  rows={4}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="form-input"
                  placeholder="Tell recruiters about your field of study, skills (e.g. Financial Modeling, AutoCAD, Python, Clinical Research, Digital Marketing), and career aspirations..."
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-[#E5D5CE]">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn btn-ghost px-5 py-2.5 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
