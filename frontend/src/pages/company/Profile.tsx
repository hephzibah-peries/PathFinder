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
        <div className="text-sm text-ink-soft">Loading company profile from backend...</div>
      </div>
    );
  }

  const name = profile?.companyName || user?.email?.split('@')[0] || 'Company Profile';
  const avatar = name.substring(0, 2).toUpperCase();

  return (
    <div className="mx-auto max-w-[880px]">
      {error && (
        <div className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
          Note: {error} (Displaying local draft mode)
        </div>
      )}

      <div className="card flex items-center justify-between bg-gradient-to-br from-sand to-paper-raised">
        <div className="flex items-center gap-5">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-xl bg-ink text-[26px] font-bold text-white shadow-sm">
            {avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="m-0 font-serif text-[24px] text-ink">{name}</h1>
              {profile?.verified && (
                <span className="rounded-full bg-signal/10 px-2 py-0.5 text-xs font-semibold text-signal">
                  Verified
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[13.5px] text-ink-soft">
              {profile?.industry || 'Industry not specified'} · {profile?.email || user?.email}
            </p>
            {profile?.website && (
              <a
                href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block text-[12.5px] font-semibold text-signal hover:underline"
              >
                {profile.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>
        <button onClick={() => setIsEditing(true)} className="btn btn-ghost shadow-sm">
          Edit Profile
        </button>
      </div>

      <SectionTitle
        title="Company Overview"
        action={
          <button onClick={() => setIsEditing(true)} className="text-[13px] font-semibold text-signal">
            Edit
          </button>
        }
      />
      <div className="card">
        <p className="text-[14px] leading-relaxed text-ink/90">
          {profile?.description ||
            'No company description provided yet. Click "Edit Profile" to tell candidates about your organization, mission, and team.'}
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-sand-line pt-5">
          <div>
            <dt className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-soft">Industry</dt>
            <dd className="mt-1 text-[14px] font-medium text-ink">{profile?.industry || 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-soft">Verification Status</dt>
            <dd className="mt-1 text-[14px] font-medium text-ink">
              {profile?.verified ? 'Verified Employer' : 'Pending Verification'}
            </dd>
          </div>
        </dl>
      </div>

      {/* ── Edit Modal ── */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-sand-line bg-paper-raised p-6 shadow-xl">
            <h2 className="mb-4 font-serif text-xl font-bold">Edit Company Profile</h2>
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold">Company Name</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-lg border border-sand-line bg-paper px-3 py-2 text-sm"
                  placeholder="e.g. Nimbus Systems"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold">Industry</label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full rounded-lg border border-sand-line bg-paper px-3 py-2 text-sm"
                  placeholder="e.g. Enterprise Software & FinTech"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold">Description / About</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-sand-line bg-paper px-3 py-2 text-sm"
                  placeholder="Describe your company culture, technology stack, and hiring goals..."
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold">Website</label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full rounded-lg border border-sand-line bg-paper px-3 py-2 text-sm"
                  placeholder="https://example.com"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-2 border-t border-sand-line">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn btn-ghost px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary px-5 py-2 text-sm disabled:opacity-50"
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
