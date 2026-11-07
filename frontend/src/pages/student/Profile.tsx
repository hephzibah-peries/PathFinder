import { useState, useEffect } from 'react';
import { SkillTag, ProgressBar, SectionTitle } from '../../components/ui';
import { studentApi, StudentProfile as StudentProfileType } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function StudentProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editUniversity, setEditUniversity] = useState('');
  const [editGpa, setEditGpa] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editWorkMode, setEditWorkMode] = useState('Hybrid');
  const [saving, setSaving] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await studentApi.getProfile();
      setProfile(data);
      setEditFullName(data.fullName || '');
      setEditUniversity(data.university || '');
      setEditGpa(data.gpa != null ? String(data.gpa) : '');
      setEditBio(data.bio || '');
      setEditSkills(data.skills || '');
      setEditLocation(data.preferredLocation || '');
      setEditWorkMode(data.preferredWorkMode || 'Hybrid');
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await studentApi.updateProfile({
        fullName: editFullName,
        university: editUniversity,
        gpa: editGpa ? parseFloat(editGpa) : undefined,
        bio: editBio,
        skills: editSkills,
        preferredLocation: editLocation,
        preferredWorkMode: editWorkMode,
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
        <div className="text-base text-[#7A6A65]">Loading profile from backend...</div>
      </div>
    );
  }

  const displayName = profile?.fullName || user?.email?.split('@')[0] || 'Student';
  const displayEmail = profile?.email || user?.email || 'No email provided';
  const avatarInitials = displayName.substring(0, 2).toUpperCase();
  const skillsList = profile?.skills
    ? profile.skills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="mx-auto max-w-[880px]">
      {error && (
        <div className="mb-4 rounded-xl bg-[#FDF2ED] p-4 text-sm font-semibold text-[#7A4B43] border border-[#E5D5CE]">
          Note: {error} (Displaying local draft mode)
        </div>
      )}

      {/* ── Profile Header ── */}
      <div className="card flex items-center justify-between bg-gradient-to-br from-[#EBF5F0]/60 to-white">
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#2D6A4F] text-2xl font-bold text-white shadow-sm">
            {avatarInitials}
          </div>
          <div>
            <h1 className="m-0 font-serif text-3xl font-bold text-[#2B1B17]">{displayName}</h1>
            <p className="mt-1 text-base text-[#7A6A65] font-semibold">
              {profile?.university || 'University not specified'} {profile?.gpa != null ? `· GPA ${profile.gpa}` : ''}
            </p>
            <p className="mt-0.5 text-sm text-[#7A6A65]">{displayEmail}</p>
          </div>
        </div>
        <button onClick={() => setIsEditing(true)} className="btn btn-secondary shadow-xs">
          Edit Profile
        </button>
      </div>

      {/* ── Bio / Summary ── */}
      <div className="card mt-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="m-0 text-base font-serif font-bold text-[#2B1B17]">About & Bio</h3>
        </div>
        <p className="text-base text-[#7A6A65] leading-relaxed">
          {profile?.bio || 'No bio added yet. Click "Edit Profile" to add your introduction and career goals.'}
        </p>
      </div>

      {/* ── Profile Completion ── */}
      <div className="card mt-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="m-0 text-base font-serif font-bold text-[#2B1B17]">Profile Completion</h3>
            <p className="mt-1 text-sm text-[#7A6A65]">
              {skillsList.length > 0 ? 'Skills and details configured' : 'Add your skills and education to reach 100%'}
            </p>
          </div>
          <span className="font-serif text-2xl font-bold text-[#2D6A4F]">
            {skillsList.length > 0 && profile?.bio ? '90%' : '50%'}
          </span>
        </div>
        <div className="mt-4">
          <ProgressBar value={skillsList.length > 0 && profile?.bio ? 90 : 50} />
        </div>
      </div>

      {/* ── Skills ── */}
      <SectionTitle
        title="Skills"
        action={
          <button onClick={() => setIsEditing(true)} className="text-sm font-bold text-[#2D6A4F] hover:underline">
            Edit
          </button>
        }
      />
      <div className="card">
        {skillsList.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {skillsList.map((skill) => (
              <SkillTag key={skill} label={skill} state="have" source="verified" />
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#7A6A65]">No skills added yet. Add comma-separated skills in edit mode.</p>
        )}
      </div>

      {/* ── Preferences ── */}
      <SectionTitle
        title="Career & Work Preferences"
        action={
          <button onClick={() => setIsEditing(true)} className="text-sm font-bold text-[#2D6A4F] hover:underline">
            Edit
          </button>
        }
      />
      <div className="card">
        <dl className="grid grid-cols-2 gap-5">
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-[#7A6A65]">Preferred Location</dt>
            <dd className="mt-1 text-base font-semibold text-[#2B1B17]">{profile?.preferredLocation || 'Any / Remote'}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-[#7A6A65]">Work Mode</dt>
            <dd className="mt-1 text-base font-semibold text-[#2B1B17]">{profile?.preferredWorkMode || 'Hybrid'}</dd>
          </div>
        </dl>
      </div>

      {/* ── Edit Profile Modal ── */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B1B17]/45 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#E5D5CE] bg-white p-7 shadow-xl">
            <h2 className="mb-5 font-serif text-2xl font-bold text-[#2B1B17]">Edit Student Profile</h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
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
                  <label className="form-label">University</label>
                  <input
                    type="text"
                    value={editUniversity}
                    onChange={(e) => setEditUniversity(e.target.value)}
                    className="form-input"
                    placeholder="e.g. University of Colombo"
                  />
                </div>
                <div>
                  <label className="form-label">GPA</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editGpa}
                    onChange={(e) => setEditGpa(e.target.value)}
                    className="form-input"
                    placeholder="e.g. 3.75"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Bio / Introduction</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="form-input"
                  placeholder="Tell recruiters about yourself..."
                />
              </div>

              <div>
                <label className="form-label">Skills (Comma-separated)</label>
                <input
                  type="text"
                  value={editSkills}
                  onChange={(e) => setEditSkills(e.target.value)}
                  className="form-input"
                  placeholder="Java, Spring Boot, React, SQL"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Preferred Location</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="form-input"
                    placeholder="Colombo / Remote"
                  />
                </div>
                <div>
                  <label className="form-label">Work Mode</label>
                  <select
                    value={editWorkMode}
                    onChange={(e) => setEditWorkMode(e.target.value)}
                    className="form-select"
                  >
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>
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
