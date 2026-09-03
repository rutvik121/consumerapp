import { useState } from 'react';
import {
  Building2,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Upload,
  User,
  UserCheck,
} from 'lucide-react';
import {
  Button,
  Input,
  SectionHeader,
  Surface,
  cn,
} from '@/design-system';
import { Screen } from '@/navigation';
import { useCurrentOrganization, useCurrentUser, useSessionStore } from '@/state';
import { copy } from '@/content';

export function ProfileScreen() {
  const user = useCurrentUser();
  const organization = useCurrentOrganization();
  const updateUser = useSessionStore((state) => state.updateUser);
  const updateOrganization = useSessionStore((state) => state.updateOrganization);

  const isOrg = user?.userType === 'ORGANIZATION';

  // Form states
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || (isOrg ? 'contact@maharashtrainfra.com' : 'ramesh.sharma@gmail.com'));
  const [mobileNumber, setMobileNumber] = useState(user?.mobileNumber || '9822012345');
  const [designation, setDesignation] = useState(
    (user && 'designation' in user && user.designation) || (isOrg ? 'Project Director' : '')
  );

  // Address states
  const initialAddress = isOrg
    ? organization?.address
    : (user && 'deliveryAddress' in user && user.deliveryAddress) || null;

  const [addressLine1, setAddressLine1] = useState(initialAddress?.line1 || (isOrg ? 'Floor 4, Mittal Towers, MG Road' : 'Flat 402, Sai Angan, Station Road'));
  const [taluka, setTaluka] = useState(initialAddress?.taluka || 'Ahmednagar');
  const [district, setDistrict] = useState(initialAddress?.district || 'Ahilyanagar');
  const [pincode, setPincode] = useState(initialAddress?.pincode || '414001');

  // Org Specific states
  const [orgName, setOrgName] = useState(organization?.name || 'Maharashtra Infrastructure Corp Ltd');
  const [orgType, setOrgType] = useState(organization?.type || 'CONTRACTOR');
  const [regNumber] = useState(organization?.registrationNumber || (isOrg ? 'MH/MK/ENT/2023/018842' : 'CON-2024-10425'));

  // KYC States (Simulated live state)
  const [isKycVerified, setIsKycVerified] = useState(true);
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [kycStep, setKycStep] = useState<'VIEW' | 'UPLOAD' | 'SUCCESS'>('VIEW');
  const [uploadedDocName, setUploadedDocName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);

  if (!user) return null;

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      // Update User Store
      updateUser({
        fullName,
        email,
        mobileNumber,
        ...(isOrg ? { designation } : {}),
      });

      // Update Org Store if applicable
      if (isOrg && organization) {
        updateOrganization({
          name: orgName,
          type: orgType,
          address: {
            line1: addressLine1,
            taluka,
            district,
            state: 'Maharashtra',
            pincode,
          },
        });
      }

      setIsSaving(false);
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 3000);
    }, 400);
  }

  function handleCompleteKycSimulation() {
    setKycStep('UPLOAD');
  }

  function handleUploadKycDoc(docName: string) {
    setUploadedDocName(docName);
    setTimeout(() => {
      setKycStep('SUCCESS');
      setIsKycVerified(true);
    }, 1200);
  }

  return (
    <Screen title="Profile & KYC" onBack>
      <div className="pb-16 bg-[#f8fafc]">
        {/* Profile Identity Hero Card */}
        <div className="bg-[#102d5e] px-4 pt-4 pb-6 text-white shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white font-bold text-xl border border-white/20 shadow-inner">
              {fullName.charAt(0) || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-title font-bold text-white tracking-tight truncate">
                  {fullName}
                </h1>
                <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                  {isOrg ? copy.organizationType[orgType] || 'Organization' : 'Consumer'}
                </span>
              </div>
              <p className="text-caption text-neutral-300 font-mono mt-0.5">{mobileNumber}</p>
              <p className="text-[11px] text-neutral-300/80 font-mono tracking-wide">
                ID: {regNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Save Toast */}
        {showSaveToast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-full bg-emerald-700 px-4 py-2 text-caption font-bold text-white shadow-lg flex items-center gap-2 animate-bounce">
            <CheckCircle2 size={16} />
            <span>Profile details updated successfully!</span>
          </div>
        )}

        <div className="px-4 py-4 space-y-5">
          {/* ========================================================
              KYC VERIFICATION STATUS CARD
             ======================================================== */}
          <div
            className={cn(
              'rounded-2xl border p-4 shadow-xs transition-all',
              isKycVerified
                ? 'border-emerald-200 bg-emerald-50/60'
                : 'border-amber-200 bg-amber-50/70'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'flex size-9 items-center justify-center rounded-xl shrink-0 mt-0.5',
                    isKycVerified ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                  )}
                >
                  {isKycVerified ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-body font-bold text-ink">
                      {isKycVerified ? 'e-KYC Verified' : 'KYC Verification Pending'}
                    </h3>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.2 text-[10px] font-bold border',
                        isKycVerified
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      )}
                    >
                      {isKycVerified ? 'Active & Approved' : 'Action Required'}
                    </span>
                  </div>
                  <p className="mt-1 text-caption text-neutral-600 leading-relaxed">
                    {isKycVerified
                      ? 'Your Aadhaar, PAN and registry identity credentials are authenticated with the Government of Maharashtra.'
                      : 'Complete your pending KYC documents to unlock digital transit passes and permit applications.'}
                  </p>
                </div>
              </div>
            </div>

            {/* KYC Document Checklist */}
            <div className="mt-3.5 space-y-2 rounded-xl bg-white p-3 border border-neutral-200/80 text-caption">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-neutral-600">
                  <UserCheck size={14} className={isKycVerified ? 'text-emerald-600' : 'text-neutral-400'} />
                  <span>{isOrg ? 'Company GSTIN & Incorporation' : 'Aadhaar / UIDAI e-KYC'}</span>
                </span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1 text-[11px]">
                  {isKycVerified ? <Check size={13} strokeWidth={3} /> : <Clock size={13} />}
                  {isKycVerified ? 'Verified' : 'Pending'}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-neutral-100 pt-2">
                <span className="flex items-center gap-2 text-neutral-600">
                  <FileText size={14} className={isKycVerified ? 'text-emerald-600' : 'text-neutral-400'} />
                  <span>{isOrg ? 'Authorized Signatory PAN' : 'Permanent Account Number (PAN)'}</span>
                </span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1 text-[11px]">
                  <Check size={13} strokeWidth={3} />
                  Verified
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-neutral-100 pt-2">
                <span className="flex items-center gap-2 text-neutral-600">
                  <MapPin size={14} className={isKycVerified ? 'text-emerald-600' : 'text-neutral-400'} />
                  <span>{isOrg ? 'Registered Office Address Proof' : 'Delivery Address Proof (7/12)'}</span>
                </span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1 text-[11px]">
                  {isKycVerified ? <Check size={13} strokeWidth={3} /> : <Clock size={13} />}
                  {isKycVerified ? 'Verified' : 'Pending'}
                </span>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setKycStep('VIEW');
                  setKycModalOpen(true);
                }}
                className="flex-1 rounded-xl border border-neutral-300 bg-white py-2 px-3 text-caption font-semibold text-ink shadow-2xs hover:bg-neutral-50 active:scale-[0.99] text-center"
              >
                View KYC Details
              </button>
              {!isKycVerified && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setKycStep('UPLOAD');
                    setKycModalOpen(true);
                  }}
                >
                  Complete KYC →
                </Button>
              )}
            </div>
          </div>

          {/* ========================================================
              PROFILE EDIT FORM
             ======================================================== */}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <SectionHeader title="Personal & Account Details" />
            <Surface variant="outlined" rounded className="p-4 space-y-3.5 bg-white">
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                leftIcon={<User size={15} />}
              />

              <div>
                <Input
                  label="Registered Mobile Number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  required
                  disabled
                  leftIcon={<Phone size={15} />}
                />
                <p className="mt-1 text-[11px] text-neutral-500">Verified via Government OTP (Locked)</p>
              </div>

              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                leftIcon={<Mail size={15} />}
              />

              {isOrg && (
                <Input
                  label="Designation / Role in Company"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Project Director, Site Manager"
                />
              )}
            </Surface>

            {/* Organization Specific Fields */}
            {isOrg && (
              <>
                <SectionHeader title="Organization & Business Details" />
                <Surface variant="outlined" rounded className="p-4 space-y-3.5 bg-white">
                  <Input
                    label="Company / Enterprise Name"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    required
                    leftIcon={<Building2 size={15} />}
                  />

                  <div className="space-y-1.5">
                    <label className="text-body-sm font-semibold text-ink">Entity Category</label>
                    <select
                      value={orgType}
                      onChange={(e) => setOrgType(e.target.value as any)}
                      className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-body text-ink shadow-2xs focus:border-primary-600 focus:outline-hidden"
                    >
                      <option value="CONTRACTOR">Contractor / Infrastructure</option>
                      <option value="BUILDER">Builder / Developer</option>
                      <option value="GOVERNMENT">Government Agency / PSU</option>
                      <option value="OTHER">Other Commercial Entity</option>
                    </select>
                  </div>

                  <div>
                    <Input
                      label="MahaKhanij Registration ID"
                      value={regNumber}
                      disabled
                    />
                    <p className="mt-1 text-[11px] text-neutral-500">Official State Mineral Concessionaire ID</p>
                  </div>
                </Surface>
              </>
            )}

            {/* Address Details */}
            <SectionHeader title={isOrg ? 'Registered Office Address' : 'Default Delivery Destination'} />
            <Surface variant="outlined" rounded className="p-4 space-y-3.5 bg-white">
              <Input
                label="Address Line 1"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="Street address, building, or landmark"
                required
                leftIcon={<MapPin size={15} />}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Taluka"
                  value={taluka}
                  onChange={(e) => setTaluka(e.target.value)}
                  required
                />
                <Input
                  label="District"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  required
                />
              </div>

              <Input
                label="Pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                maxLength={6}
                required
              />
            </Surface>

            <div className="pt-2">
              <Button
                type="submit"
                size="lg"
                fullWidth
                variant="primary"
                leftIcon={<Save size={16} />}
                disabled={isSaving}
              >
                {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* ========================================================
          KYC DETAILS & SUBMISSION MODAL
         ======================================================== */}
      {kycModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="text-[#1241a6]" size={20} />
                <h3 className="text-body font-bold text-ink">
                  {kycStep === 'UPLOAD' ? 'Submit KYC Documents' : 'e-KYC Identity Verification'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setKycModalOpen(false)}
                className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100"
              >
                ✕
              </button>
            </div>

            {kycStep === 'VIEW' && (
              <div className="space-y-4 text-caption">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-emerald-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-emerald-700" />
                    <span>UIDAI & Government Portal Verified</span>
                  </p>
                  <p className="text-[11px] text-emerald-800">
                    All mineral transactions and temporary permits generated by this profile are legally authorized.
                  </p>
                </div>

                <div className="space-y-2 rounded-xl border border-neutral-200 p-3 bg-neutral-50/50">
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-500">Aadhaar Linked:</span>
                    <span className="font-mono font-bold text-ink">XXXX-XXXX-8842</span>
                  </div>
                  <div className="flex justify-between py-1 border-t border-neutral-200/60">
                    <span className="text-neutral-500">PAN Number:</span>
                    <span className="font-mono font-bold text-ink">ANDPG4491M</span>
                  </div>
                  {isOrg && (
                    <div className="flex justify-between py-1 border-t border-neutral-200/60">
                      <span className="text-neutral-500">GSTIN Reference:</span>
                      <span className="font-mono font-bold text-ink">27AADCL8842R1Z8</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-t border-neutral-200/60">
                    <span className="text-neutral-500">Verification Date:</span>
                    <span className="font-medium text-ink">14-Jan-2024</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="md"
                    variant="secondary"
                    fullWidth
                    onClick={() => handleCompleteKycSimulation()}
                  >
                    Re-upload / Update Documents
                  </Button>
                  <Button
                    size="md"
                    variant="primary"
                    fullWidth
                    onClick={() => setKycModalOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}

            {kycStep === 'UPLOAD' && (
              <div className="space-y-4 text-caption">
                <p className="text-neutral-600">
                  Select and upload official identification or address proof for verification:
                </p>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => handleUploadKycDoc('Aadhaar_Front_Back.pdf')}
                    className="flex w-full items-center justify-between rounded-xl border border-neutral-200 p-3 text-left hover:bg-neutral-50 active:scale-[0.99] transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <Upload size={16} className="text-[#1241a6]" />
                      <div>
                        <p className="font-bold text-ink">Aadhaar Card (PDF / JPG)</p>
                        <p className="text-[11px] text-neutral-500">UIDAI verified national identity card</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-[#1241a6]">Upload</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUploadKycDoc('PAN_Card_Verification.jpg')}
                    className="flex w-full items-center justify-between rounded-xl border border-neutral-200 p-3 text-left hover:bg-neutral-50 active:scale-[0.99] transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <Upload size={16} className="text-[#1241a6]" />
                      <div>
                        <p className="font-bold text-ink">PAN Card Document</p>
                        <p className="text-[11px] text-neutral-500">Income tax identity proof</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-[#1241a6]">Upload</span>
                  </button>

                  {isOrg && (
                    <button
                      type="button"
                      onClick={() => handleUploadKycDoc('GST_Incorporation_Cert.pdf')}
                      className="flex w-full items-center justify-between rounded-xl border border-neutral-200 p-3 text-left hover:bg-neutral-50 active:scale-[0.99] transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <Upload size={16} className="text-[#1241a6]" />
                        <div>
                          <p className="font-bold text-ink">GST & Incorporation Certificate</p>
                          <p className="text-[11px] text-neutral-500">Ministry of Corporate Affairs registration</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-[#1241a6]">Upload</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {kycStep === 'SUCCESS' && (
              <div className="py-4 text-center space-y-3 animate-fadeIn">
                <span className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mx-auto">
                  <CheckCircle2 size={32} />
                </span>
                <h4 className="text-body-lg font-bold text-ink">KYC Verification Completed!</h4>
                <p className="text-caption text-neutral-600 max-w-[30ch] mx-auto">
                  Document <strong>{uploadedDocName}</strong> successfully verified against government databases.
                </p>
                <div className="pt-3">
                  <Button
                    size="md"
                    variant="primary"
                    fullWidth
                    onClick={() => setKycModalOpen(false)}
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Screen>
  );
}
