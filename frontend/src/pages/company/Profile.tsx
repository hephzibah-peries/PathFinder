import { useState, useEffect } from 'react';
import { SectionTitle } from '../../components/ui';
import { companyApi, CompanyProfile as CompanyProfileType } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function CompanyProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CompanyProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await companyApi.getProfile();
      setProfile(data);
      setCompanyName(data.companyName || '');
      setIndustry(data.industry || '');
      setDescription(data.description || '');
      setWebsite(data.website || '');
    } catch (err: any) {
      setError(err.message || 'Failed to load company profile');
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
      const updated = await companyApi.updateProfile({
        companyName,
        industry,
        description,
        website,
      });
      setProfile(updated);
      setIsEditing(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update company profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-base text-[#7A6A65]">Loading company profile from backend...</div>
      </div>
    );
  }

  const name = profile?.companyName || user?.email?.split('@')[0] || 'Company Profile';
  const avatar = name.substring(0, 2).toUpperCase();

  return (
    <div className="mx-auto max-w-[880px]">
      {error && (
        <div className="mb-4 rounded-xl bg-[#FDF2ED] p-4 text-sm font-semibold text-[#7A4B43] border border-[#E5D5CE]">
          Note: {error} (Displaying local draft mode)
        </div>
      )}

      <div className="card flex items-center justify-between bg-gradient-to-br from-[#FAF6F4] to-white">
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#7A4B43] text-2xl font-bold text-white shadow-sm">
            {avatar}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="m-0 font-serif text-3xl font-bold text-[#2B1B17]">{name}</h1>
              {profile?.verified && (
                <span className="rounded-full bg-[#2D6A4F]/10 border border-[#2D6A4F]/30 px-3 py-1 text-xs font-bold text-[#2D6A4F]">
                  Verified
                </span>
              )}
            </div>
            <p className="mt-1 text-base text-[#7A6A65] font-semibold">
              {profile?.industry || 'Industry not specified'} · {profile?.email || user?.email}
            </p>
            {profile?.website && (
              <a
                href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block text-sm font-bold text-[#7A4B43] hover:underline"
              >
                {profile.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>
        <button onClick={() => setIsEditing(true)} className="btn btn-secondary shadow-xs">
          Edit Profile
        </button>
      </div>

      <SectionTitle
        title="Company Overview"
        action={
          <button onClick={() => setIsEditing(true)} className="text-sm font-bold text-[#7A4B43] hover:underline">
            Edit
          </button>
        }
      />
      <div className="card">
        <p className="text-base leading-relaxed text-[#2B1B17]">
          {profile?.description ||
            'No company description provided yet. Click "Edit Profile" to tell candidates about your organization, mission, and team.'}
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-5 border-t border-[#E5D5CE] pt-5">
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-[#7A6A65]">Industry</dt>
            <dd className="mt-1 text-base font-semibold text-[#2B1B17]">{profile?.industry || 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-[#7A6A65]">Verification Status</dt>
            <dd className="mt-1 text-base font-semibold text-[#2B1B17]">
              {profile?.verified ? 'Verified Employer' : 'Pending Verification'}
            </dd>
          </div>
        </dl>
      </div>

      {/* ── Edit Modal ── */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B1B17]/45 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#E5D5CE] bg-white p-7 shadow-xl">
            <h2 className="mb-5 font-serif text-2xl font-bold text-[#2B1B17]">Edit Company Profile</h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="form-label">Company Name</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="form-input"
                  placeholder="e.g. Nimbus Systems"
                />
              </div>

              <div>
                <label className="form-label">Industry</label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="form-input"
                  placeholder="e.g. Enterprise Software & FinTech"
                />
              </div>

              <div>
                <label className="form-label">Description / About</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-input"
                  placeholder="Describe your company culture, technology stack, and hiring goals..."
                />
              </div>

              <div>
                <label className="form-label">Website</label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="form-input"
                  placeholder="https://example.com"
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
