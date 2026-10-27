import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { dbService } from '../services/dbService';
import type { VerificationRequest } from '../types';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  FileText,
  Send,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const VerificationStatusSection: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Request Form
  const [documentType, setDocumentType] = useState<string>('7/12 Land Record');
  const [documentNumber, setDocumentNumber] = useState<string>('');
  const [documentUrl, setDocumentUrl] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  const loadVerificationData = async () => {
    if (!user) return;
    try {
      const userReqs = await dbService.getVerificationRequests(user.id);
      setRequests(userReqs);
    } catch (err) {
      console.error('Error loading verification data:', err);
    }
  };

  useEffect(() => {
    loadVerificationData();
    const interval = setInterval(loadVerificationData, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setSubmissionSuccess(false);

    try {
      await dbService.submitVerificationRequest({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        mobile: user.mobile,
        documentType,
        documentNumber,
        documentUrl: documentUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
        additionalNotes,
      });

      setSubmissionSuccess(true);
      setDocumentNumber('');
      setDocumentUrl('');
      setAdditionalNotes('');
      await loadVerificationData();

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#D9FF55', '#3F754A', '#17362C'],
        });
      } catch (_) {}
    } catch (err) {
      console.error('Error submitting verification request:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  const currentStatus = user.verificationStatus || 'Pending';

  return (
    <div className="space-y-6 animate-fade-in" id="verification-status">
      {/* Top Banner Status */}
      <div className="p-6 rounded-3xl bg-[#17362C] text-[#F6F1E4] border border-[#D9FF55]/20 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shrink-0 ${
              currentStatus === 'Verified'
                ? 'bg-[#D9FF55] text-[#17362C]'
                : currentStatus === 'Rejected'
                ? 'bg-red-500 text-white'
                : 'bg-amber-400 text-[#17362C]'
            }`}
          >
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#D9FF55]">
                {user.role === 'farmer' ? 'FARMER KYC PROTOCOL' : 'BUYER VERIFICATION'}
              </span>
              <span
                className={`text-xs font-black px-3 py-0.5 rounded-full ${
                  currentStatus === 'Verified'
                    ? 'bg-[#D9FF55] text-[#17362C]'
                    : currentStatus === 'Rejected'
                    ? 'bg-red-500 text-white'
                    : 'bg-amber-400 text-[#17362C]'
                }`}
              >
                {currentStatus === 'Verified'
                  ? '✓ અધિકૃત પ્રમાણિત (Verified)'
                  : currentStatus === 'Rejected'
                  ? '✗ અસ્વીકાર (Rejected)'
                  : '⏳ ચકાસણી હેઠળ (Pending Review)'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black font-editorial tracking-tight text-white mt-1">
              {currentStatus === 'Verified'
                ? 'તમારું ખાતું ગુજરાત સરકાર નિયમાનુસાર વેરિફાઈડ છે'
                : currentStatus === 'Rejected'
                ? 'તમારા વેરિફિકેશન દસ્તાવેજોમાં સુધારાની જરૂર છે'
                : 'તમારી વેરિફિકેશન વિનંતી એડમિન સમીક્ષા હેઠળ છે'}
            </h2>

            <p className="text-xs text-[#F6F1E4]/80 mt-1 max-w-xl">
              {currentStatus === 'Verified'
                ? 'વેરિફાઈડ બેજ સાથે તમારા પાક લોટને ખરીદદારોની પ્રથમ પસંદગી અને 100% એસ્ક્રૉ સુરક્ષા મળે છે.'
                : 'સરકારી 7/12 ઉતારો, આધાર કાર્ડ અથવા જીએસટી દસ્તાવેજ સબમિટ કરીને વેરિફિકેશન મેળવો.'}
            </p>
          </div>
        </div>

        <div className="px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-xs flex items-center gap-2 shrink-0">
          <Lock className="w-4 h-4 text-[#D9FF55]" />
          <span className="text-[11px] text-white/90">
            તમામ દસ્તાવેજો સુરક્ષિત અને ખાનગી રાખવામાં આવે છે.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Submit New Document */}
        <div className="lg:col-span-6 bg-[#F6F1E4] p-6 rounded-3xl border border-[#17362C]/15 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-[#17362C]/10 pb-3">
            <UploadCloud className="w-5 h-5 text-[#3F754A]" />
            <h3 className="text-sm font-black text-[#132B23]">
              નવો દસ્તાવેજ સબમિટ કરો (Submit Verification Document)
            </h3>
          </div>

          {submissionSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs font-bold">
                દસ્તાવેજ સફળતાપૂર્વક સબમિટ થયો! એડમિન અધિકારી ૨૪ કલાકમાં સમીક્ષા કરશે.
              </div>
            </div>
          )}

          <form onSubmit={handleSubmitRequest} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-[#132B23] mb-1">
                દસ્તાવેજનો પ્રકાર (Document Type) *
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#17362C]/20 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#3F754A] cursor-pointer"
              >
                {user.role === 'farmer' ? (
                  <>
                    <option value="7/12 Land Record">7/12 જમીન ઉતારો (7/12 Land Extract / Village Form 8A)</option>
                    <option value="Aadhaar Card">આધાર કાર્ડ (Aadhaar Card)</option>
                    <option value="Kisan Credit Card">કિસાન ક્રેડિટ કાર્ડ (KCC / Kisan Passbook)</option>
                    <option value="Organic Certificate">ઓર્ગેનિક પ્રમાણપત્ર (NPOP / PGS Organic Cert)</option>
                    <option value="Soil Health Card">સોઇલ હેલ્થ કાર્ડ (Soil Test Report)</option>
                  </>
                ) : (
                  <>
                    <option value="GST Certificate">જીએસટી નોંધણી પ્રમાણપત્ર (GST Certificate)</option>
                    <option value="Business PAN">કંપની પાન કાર્ડ (Company PAN)</option>
                    <option value="FSSAI License">FSSAI ફૂડ લાયસન્સ (Food Safety License)</option>
                    <option value="APMC Trader License">APMC ટ્રેડર લાયસન્સ (APMC License)</option>
                    <option value="Bank Cancelled Cheque">બેંક કેન્સલ ચેક (Bank Proof)</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-[#132B23] mb-1">
                દસ્તાવેજ / સર્વે નંબર (Document / Survey / Reg. Number) *
              </label>
              <input
                type="text"
                required
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#17362C]/20 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#3F754A]"
                placeholder="દા.ત. SURVEY-42-MAHUVA અથવા 24AAACB1234F1Z8"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-[#132B23] mb-1">
                દસ્તાવેજ ફોટો / PDF લિંક (Document Image / Storage URL)
              </label>
              <input
                type="url"
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#17362C]/20 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#3F754A]"
                placeholder="https://images.unsplash.com/..."
              />
              <span className="text-[10px] text-[#132B23]/60 mt-1 block">
                ડિફોલ્ટ મોક લિંક આપમેળે ઉમેરાશે જો ખાલી રાખશો.
              </span>
            </div>

            <div>
              <label className="block text-xs font-black text-[#132B23] mb-1">
                વધારાની નોંધ / ખેતરની વિગત (Additional Notes)
              </label>
              <textarea
                rows={2}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#17362C]/20 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#3F754A]"
                placeholder="જમીનનું ક્ષેત્રફળ, પાકની જાત અથવા કંપનીની માહિતી..."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-2xl bg-[#17362C] text-[#D9FF55] font-black text-xs shadow-lg hover:bg-[#244E3E] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'સબમિટ કરી રહ્યા છીએ...' : 'ચકાસણી માટે મોકલો (Submit for Verification)'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Verification Requests & Feedback History */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#17362C]/10 pb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#3F754A]" />
              <h3 className="text-sm font-black text-[#132B23]">
                વેરિફિકેશન ઇતિહાસ અને પ્રતિસાદ (Verification History & Admin Notes)
              </h3>
            </div>
            <span className="text-xs font-bold text-[#132B23]/60">{requests.length} વિનંતીઓ</span>
          </div>

          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="p-8 rounded-3xl bg-white border border-dashed border-[#17362C]/20 text-center space-y-2">
                <ShieldCheck className="w-8 h-8 text-[#132B23]/30 mx-auto" />
                <div className="text-xs font-black text-[#132B23]/70">
                  કોઈ વેરિફિકેશન વિનંતી નથી (No Requests Submitted Yet)
                </div>
                <p className="text-[11px] text-[#132B23]/50">
                  ડાબી બાજુના ફોર્મ દ્વારા તમારો 7/12 ઉતારો અથવા જીએસટી દસ્તાવેજ સબમિટ કરો.
                </p>
              </div>
            ) : (
              requests.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-2xl bg-white border border-[#17362C]/15 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-[#132B23]">{r.documentType}</span>
                      {r.documentNumber && (
                        <span className="ml-2 font-mono text-[11px] bg-black/5 px-2 py-0.5 rounded text-[#132B23]/80 font-bold">
                          #{r.documentNumber}
                        </span>
                      )}
                    </div>

                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        r.status === 'Verified'
                          ? 'bg-[#D9FF55] text-[#17362C]'
                          : r.status === 'Rejected'
                          ? 'bg-red-500 text-white'
                          : 'bg-amber-400 text-[#17362C]'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>

                  {r.additionalNotes && (
                    <div className="text-[11px] text-[#132B23]/75 bg-[#F6F1E4] p-2.5 rounded-xl">
                      <span className="font-bold text-[#132B23]">ખેડૂત નોંધ:</span> {r.additionalNotes}
                    </div>
                  )}

                  {/* Admin Feedback Box */}
                  {r.adminNotes && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-black">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>અધિકારી સમીક્ષા નોંધ ({r.adminName || 'GSAMB Officer'}):</span>
                      </div>
                      <div className="text-[11px] text-emerald-800 font-medium">{r.adminNotes}</div>
                    </div>
                  )}

                  {r.requestedInfoNotes && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-black">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>વધારાની જરૂરી માહિતી:</span>
                      </div>
                      <div className="text-[11px] text-amber-800 font-medium">{r.requestedInfoNotes}</div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-[#132B23]/50 pt-1 border-t border-[#17362C]/10 font-bold">
                    <span>તારીખ: {new Date(r.createdAt).toLocaleDateString('gu-IN')}</span>
                    {r.reviewedAt && (
                      <span>ચકાસાયેલ: {new Date(r.reviewedAt).toLocaleDateString('gu-IN')}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
