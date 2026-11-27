import { useState, useEffect, useRef } from 'react';
import { SectionTitle } from '../../components/ui';
import { companyApi, CompanyProfile as CompanyProfileType } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function CompanyProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CompanyProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Logo / Profile Image State & Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Load persisted logo from localStorage on mount or when user session resolves
  useEffect(() => {
    const storageKey = `company_logo_${user?.email || 'default'}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setLogoUrl(saved);
    }
  }, [user?.email]);

  const handleLogoFile = (file: File) => {
    if (!file) return;
    if (!file.type.match(/^image\/(png|jpe?g|webp)$/i)) {
      alert('Please upload a valid image file (.png, .jpg, .jpeg, or .webp).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('File size exceeds 2MB. Please select a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setLogoUrl(dataUrl);
        const storageKey = `company_logo_${user?.email || 'default'}`;
        localStorage.setItem(storageKey, dataUrl);
        window.dispatchEvent(
          new CustomEvent('company-profile-updated', {
            detail: { logoUrl: dataUrl }
          })
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl(null);
    const storageKey = `company_logo_${user?.email || 'default'}`;
    localStorage.removeItem(storageKey);
    window.dispatchEvent(
      new CustomEvent('company-profile-updated', {
        detail: { logoUrl: null }
      })
    );
  };

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
      setError(null);
      setIsEditing(false);
      window.dispatchEvent(
        new CustomEvent('company-profile-updated', {
          detail: { companyName: updated.companyName, logoUrl }
        })
      );
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
  const isVerified = Boolean(
    profile?.verified ||
    (profile?.companyName && profile?.industry && profile?.website && profile?.description)
  );

  return (
    <div className="mx-auto max-w-[880px]">
      {error && (
        <div className="mb-4 rounded-xl bg-[#FDF2ED] p-4 text-sm font-semibold text-[#7A4B43] border border-[#E5D5CE]">
          Note: {error} (Displaying local draft mode)
        </div>
      )}

      <div className="card flex items-center justify-between bg-gradient-to-br from-[#FAF6F4] to-white">
        <div className="flex items-center gap-5">
          {/* Avatar Box with Logo / Initials Badge and Upload Overlay */}
          <div className="relative group">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative flex h-20 w-20 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[#7A4B43] text-2xl font-bold text-white shadow-sm border-2 border-[#E5D5CE] transition-all hover:ring-2 hover:ring-[#7A4B43]/40"
              title="Click to upload or change company logo"
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{avatar}</span>
              )}

              {/* Hover Camera Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <span className="text-[10px] font-bold text-white mt-0.5">Upload</span>
              </div>
            </div>

            {/* Corner camera indicator badge */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white border border-[#E5D5CE] text-[#7A4B43] shadow-xs hover:bg-[#FDF2ED] transition-colors"
              title="Change logo"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleLogoFile(file);
              e.target.value = '';
            }}
          />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="m-0 font-serif text-3xl font-bold text-[#2B1B17]">{name}</h1>
              {isVerified && (
                <span className="rounded-full bg-[#2D6A4F]/10 border border-[#2D6A4F]/30 px-3 py-1 text-xs font-bold text-[#2D6A4F]">
                  Verified
                </span>
              )}
            </div>
            <p className="mt-1 text-base text-[#7A6A65] font-semibold">
              {profile?.industry || 'Industry not specified'}
            </p>
            {(profile?.email || user?.email) && (
              <p className="text-sm text-[#7A6A65] mt-0.5">
                {profile?.email || user?.email}
              </p>
            )}
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
              {isVerified ? 'Verified Employer' : 'Pending Verification'}
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
              {/* Company Logo / Profile Photo Field */}
              <div>
                <label className="form-label">Company Logo / Profile Photo</label>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#7A4B43] text-xl font-bold text-white border-2 border-[#E5D5CE] shadow-xs">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo preview" className="h-full w-full object-cover" />
                    ) : (
                      <span>{avatar}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => modalFileInputRef.current?.click()}
                      className="rounded-lg border border-[#E5D5CE] bg-white px-3.5 py-2 text-xs font-semibold text-[#2B1B17] hover:bg-[#FAF6F4] hover:border-[#D6C1B8] shadow-2xs transition-all"
                    >
                      {logoUrl ? 'Change Photo' : 'Upload Logo'}
                    </button>
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    ref={modalFileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoFile(file);
                      e.target.value = '';
                    }}
                  />
                </div>
              </div>

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
                  placeholder="e.g. Technology, Engineering, Banking & Finance, Healthcare, Creative Media"
                />
              </div>

              <div>
                <label className="form-label">Description / About</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-input"
                  placeholder="Describe your company culture, core domains, and internship opportunities..."
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
