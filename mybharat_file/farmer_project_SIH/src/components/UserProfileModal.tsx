import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  ShieldCheck,
  CheckCircle2,
  X,
  FileText,
  Save,
} from 'lucide-react';
import { PRODUCT_CATALOG } from '../data/productCatalog';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenVerification?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenVerification,
}) => {
  const { user, updateProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'basic' | 'business_crops' | 'bank_payment' | 'documents'>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('Bhavnagar');
  const [taluka, setTaluka] = useState('');
  const [state, setState] = useState('Gujarat');
  const [pinCode, setPinCode] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');

  // Farmer specific
  const [fpoName, setFpoName] = useState('');
  const [crops, setCrops] = useState<string[]>([]);
  const [farmSize, setFarmSize] = useState('5-10 Acres');
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [transportNeeded, setTransportNeeded] = useState(true);
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfscCode, setBankIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');

  // Buyer specific
  const [companyName, setCompanyName] = useState('');
  const [buyerType, setBuyerType] = useState('Food Processor');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [requiredCommodities, setRequiredCommodities] = useState<string[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // Identity docs
  const [identityDocType, setIdentityDocType] = useState('7/12 Land Record');
  const [identityDocNumber, setIdentityDocNumber] = useState('');
  const [identityDocUrl, setIdentityDocUrl] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setMobile(user.mobile || '');
      setEmail(user.email || '');
      setVillage(user.village || '');
      setDistrict(user.district || 'Bhavnagar');
      setTaluka(user.taluka || '');
      setState(user.state || 'Gujarat');
      setPinCode(user.pinCode || '');
      setPickupAddress(user.pickupAddress || '');

      setFpoName(user.fpoName || '');
      setCrops(user.crops || ['Onion', 'Potato', 'KesarMango', 'Cumin']);
      setFarmSize(user.farmSize || '8.5 Acres');
      setStorageAvailable(user.storageAvailable ?? true);
      setTransportNeeded(user.transportNeeded ?? true);
      setBankAccountName(user.bankAccountName || '');
      setBankAccountNumber(user.bankAccountNumber || '');
      setBankIfscCode(user.bankIfscCode || '');
      setUpiId(user.upiId || '');

      setCompanyName(user.companyName || user.company || '');
      setBuyerType(user.buyerType || 'Food Processor');
      setGstNumber(user.gstNumber || '');
      setPanNumber(user.panNumber || '');
      setRequiredCommodities(user.requiredCommodities || ['Potato', 'Onion', 'Tomato']);
      setDeliveryAddress(user.deliveryAddress || '');

      setIdentityDocType(user.identityDocType || '7/12 Land Record');
      setIdentityDocNumber(user.identityDocNumber || '');
      setIdentityDocUrl(user.identityDocUrl || '');
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const isFarmer = user.role === 'farmer';
  const isBuyer = user.role === 'buyer';

  const gujaratDistricts = [
    'Bhavnagar',
    'Rajkot',
    'Surat',
    'Ahmedabad',
    'Junagadh',
    'Gir Somnath',
    'Banaskantha',
    'Mehsana',
    'Amreli',
    'Morbi',
    'Jamnagar',
    'Vadodara',
    'Kutch',
    'Anand',
  ];

  const handleToggleCrop = (cropId: string) => {
    if (crops.includes(cropId)) {
      setCrops(crops.filter((c) => c !== cropId));
    } else {
      setCrops([...crops, cropId]);
    }
  };

  const handleToggleBuyerCommodity = (cropId: string) => {
    if (requiredCommodities.includes(cropId)) {
      setRequiredCommodities(requiredCommodities.filter((c) => c !== cropId));
    } else {
      setRequiredCommodities([...requiredCommodities, cropId]);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await updateProfile({
        name,
        mobile,
        email,
        village,
        district,
        taluka,
        state,
        pinCode,
        pickupAddress,
        fpoName,
        crops,
        farmSize,
        storageAvailable,
        transportNeeded,
        bankAccountName,
        bankAccountNumber,
        bankIfscCode,
        upiId,
        companyName,
        company: companyName,
        buyerType,
        gstNumber,
        panNumber,
        requiredCommodities,
        deliveryAddress,
        identityDocType,
        identityDocNumber,
        identityDocUrl,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#F6F1E4] text-[#132B23] rounded-3xl shadow-2xl border border-[#17362C]/20 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#17362C] text-[#F6F1E4] flex items-center justify-between border-b border-[#D9FF55]/20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#D9FF55] text-[#17362C] flex items-center justify-center font-black text-xl shadow-md">
              {isFarmer ? '🌾' : isBuyer ? '🏢' : '🛡️'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">
                  {isFarmer ? 'મારી ખેડૂત પ્રોફાઇલ (Farmer Profile)' : isBuyer ? 'મારી ખરીદદાર પ્રોફાઇલ (Buyer Profile)' : 'એડમિન પ્રોફાઇલ (Admin Profile)'}
                </h2>
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    user.verificationStatus === 'Verified'
                      ? 'bg-[#D9FF55] text-[#17362C]'
                      : user.verificationStatus === 'Rejected'
                      ? 'bg-red-500 text-white'
                      : 'bg-amber-400 text-[#17362C]'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3" />
                  {user.verificationStatus || 'Pending'}
                </span>
              </div>
              <p className="text-xs text-[#F6F1E4]/70">
                User ID: <span className="font-mono text-[#D9FF55]">{user.id}</span> · {user.mobile}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#D9FF55] transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 py-3 bg-[#E5DFD0] border-b border-[#17362C]/10 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'basic' ? 'bg-[#17362C] text-[#D9FF55] shadow' : 'text-[#132B23]/70 hover:bg-black/5'
            }`}
          >
            ૧. પ્રાથમિક વિગતો (Basic Details)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('business_crops')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'business_crops' ? 'bg-[#17362C] text-[#D9FF55] shadow' : 'text-[#132B23]/70 hover:bg-black/5'
            }`}
          >
            {isFarmer ? '૨. પાક અને જમીન (Crops & Land)' : '૨. વ્યવસાય વિગતો (Business & GST)'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bank_payment')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'bank_payment' ? 'bg-[#17362C] text-[#D9FF55] shadow' : 'text-[#132B23]/70 hover:bg-black/5'
            }`}
          >
            ૩. બેંક અને પેમેન્ટ (Bank & Payout)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'documents' ? 'bg-[#17362C] text-[#D9FF55] shadow' : 'text-[#132B23]/70 hover:bg-black/5'
            }`}
          >
            ૪. સરકારી દસ્તાવેજ (KYC & Documents)
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-6 space-y-6">
          {saveSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 flex items-center gap-3 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <div className="text-xs font-black">પ્રોફાઇલ સફળતાપૂર્વક અપડેટ થઈ ગઈ છે! (Profile Saved Successfully)</div>
                <div className="text-[11px] text-emerald-800">
                  તમારી પ્રોફાઇલની તમામ વિગતો ડેટાબેઝમાં સાચવી લેવામાં આવી છે અને એડમિન પોર્ટલમાં સમીક્ષા માટે ઉપલબ્ધ છે.
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: BASIC DETAILS */}
          {activeTab === 'basic' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-[#132B23] mb-1">
                    પૂરું નામ (Full Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#17362C]/20 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#3F754A]"
                    placeholder="દા.ત. રમેશભાઈ પટેલ"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#132B23] mb-1">
                    મોબાઇલ નંબર (Mobile Number) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#17362C]/20 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#3F754A]"
                    placeholder="9825143210"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#132B23] mb-1">
                    ઇમેઇલ (Email Address)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#17362C]/20 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#3F754A]"
                    placeholder="farmer@krishisetu.in"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#132B23] mb-1">
                    રાજ્ય (State)
                  </label>
                  <input
                    type="text"
                    value={state}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 border border-[#17362C]/20 text-xs font-bold text-[#132B23]/70"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#132B23] mb-1">
                    જિલ્લો (District) *
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#17362C]/20 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#3F754A] cursor-pointer"
                  >
                    {gujaratDistricts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-[#132B23] mb-1">
                    તાલુકો (Taluka)
                  </label>
                  <input
                    type="text"
                    value={taluka}
                    onChange={(e) => setTaluka(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#17362C]/20 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#3F754A]"
                    placeholder="દા.ત. મહુવા / ગોંડલ"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#132B23] mb-1">
                    ગામ / શહેર (Village / Town) *
                  </label>
                  <input
                    type="text"
                    required
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#17362C]/20 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#3F754A]"
                    placeholder="દા.ત. મહુવા રૂરલ"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#132B23] mb-1">
                    પિનકોડ (Pincode)
                  </label>
                  <input
                    type="text"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#17362C]/20 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#3F754A]"
                    placeholder="364290"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-[#132B23] mb-1">
                  ખેતર / પિકઅપ સરનામું (Farm Gate / Loading Address)
                </label>
                <textarea
                  rows={2}
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#17362C]/20 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#3F754A]"
                  placeholder="સર્વે નંબર, હાઈવે નજીક, પિકઅપ સ્થળની વિગત"
                />
              </div>
            </div>
          )}

          {/* TAB 2: CROPS OR BUSINESS */}
          {activeTab === 'business_crops' && (
            <div className="space-y-4 animate-fade-in">
              {isFarmer ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-[#132B23] mb-1">
                        FPO / મંડળીનું નામ (FPO / Society Name)
                      </label>
                      <input
                        type="text"
                        value={fpoName}
                        onChange={(e) => setFpoName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#17362C]/20 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#3F754A]"
                        placeholder="દા.ત. મહુવા સૌરાષ્ટ્ર ફાર્મર પ્રોડ્યુસર કંપની"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-[#132B23] mb-1">
                        જમીન ધારણ / ખેતરનું ક્ષેત્રફળ (Farm Size in Acres)
                      </label>
                      <input
                        type="text"
                        value={farmSize}
                        onChange={(e) => setFarmSize(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#17362C]/20 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#3F754A]"
                        placeholder="દા.ત. 8.5 Acres"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#132B23] mb-2">
                      ઉગાડાતા મુખ્ય પાક (Primary Crops Grown)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                      {PRODUCT_CATALOG.map((p) => {
                        const selected = crops.includes(p.id);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleToggleCrop(p.id)}
                            className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                              selected
                                ? 'bg-[#3F754A] text-[#D9FF55] border-[#3F754A] shadow-sm font-black'
                                : 'bg-white text-[#132B23] border-[#17362C]/15 hover:border-[#3F754A]'
                            }`}
                          >
                            <span className="text-base">{p.icon}</span>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs truncate">{p.nameGu}</div>
                              <div className="text-[9px] opacity-75 truncate">{p.nameEn}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-[#17362C]/15 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={storageAvailable}
                        onChange={(e) => setStorageAvailable(e.target.checked)}
                        className="w-4 h-4 rounded text-[#3F754A] focus:ring-[#3F754A]"
                      />
                      <span className="text-xs font-black text-[#132B23]">
                        ખેતરે / નજીકમાં સંગ્રહ ગોડાઉન ઉપલબ્ધ છે (Storage Available)
                      </span>
                    </label>

                    <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-[#17362C]/15 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={transportNeeded}
                        onChange={(e) => setTransportNeeded(e.target.checked)}
                        className="w-4 h-4 rounded text-[#3F754A] focus:ring-[#3F754A]"
                      />
                      <span className="text-xs font-black text-[#132B23]">
                        સહિયારા પરિવહનની જરૂરિયાત રહે છે (Require Transport Pooling)
                      </span>
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-[#132B23] mb-1">
                        કંપની / પેઢીનું નામ (Company / Business Name) *
                      </label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#17362C]/20 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#3F754A]"
                        placeholder="દા.ત. બાલાજી વેફર્સ એન્ડ એગ્રો ફૂડ્સ લી."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-[#132B23] mb-1">
                        ખરીદદાર કેટેગરી (Buyer Type)
                      </label>
                      <select
                        value={buyerType}
                        onChange={(e) => setBuyerType(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#17362C]/20 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#3F754A] cursor-pointer"
                      >
                        <option value="Food Processor">Food Processor (ફૂડ પ્રોસેસિંગ એકમ)</option>
                        <option value="Institutional Buyer">Institutional Buyer (સંસ્થાકીય ખરીદદાર)</option>
                        <option value="Agri Exporter">Agri Exporter (કૃષિ નિકાસકાર)</option>
                        <option value="Retail Chain">Retail Chain / Supermarket</option>
                        <option value="Bulk Aggregator">Bulk Aggregator / Trader</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-[#132B23] mb-1">
                        GSTIN નંબર (GST Number) *
                      </label>
                      <input
                        type="text"
                        value={gstNumber}
                        onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#17362C]/20 text-xs font-mono font-black focus:outline-none focus:ring-2 focus:ring-[#3F754A]"
                        placeholder="24AAACB1234F1Z8"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-[#132B23] mb-1">
                        PAN નંબર (Business PAN)
                      </label>
                      <input
                        type="text"
                        value={panNumber}
                        onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#17362C]/20 text-xs font-mono font-black focus:outline-none focus:ring-2 focus:ring-[#3F754A]"
                        placeholder="AAACB1234F"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#132B23] mb-1">
                      ડિલિવરી ગોડાઉન / ફેક્ટરી સરનામું (Delivery Plant Address)
                    </label>
                    <textarea
                      rows={2}
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#17362C]/20 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#3F754A]"
                      placeholder="પ્લોટ નંબર, જીઆઇડીસી એસ્ટેટ, અનલોડિંગ પોઇન્ટ"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#132B23] mb-2">
                      નિયમિત ખરીદી માટે જરૂરી પાકો (Procurement Commodities)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {PRODUCT_CATALOG.map((p) => {
                        const selected = requiredCommodities.includes(p.id);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleToggleBuyerCommodity(p.id)}
                            className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                              selected
                                ? 'bg-[#3F754A] text-[#D9FF55] border-[#3F754A] font-black'
                                : 'bg-white text-[#132B23] border-[#17362C]/15 hover:border-[#3F754A]'
                            }`}
                          >
                            <span>{p.icon}</span>
                            <span className="text-xs truncate">{p.nameGu}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: BANK & PAYMENT DETAILS */}
          {activeTab === 'bank_payment' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-[#D9FF55]/20 border border-[#17362C]/15 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#3F754A] shrink-0 mt-0.5" />
                <div className="text-xs text-[#132B23]">
                  <span className="font-black">સુરક્ષિત એસ્ક્રૉ અને ડાયરેક્ટ બેંક એકાઉન્ટ:</span> કૃષિસેતુ પ્લેટફોર્મ પર તમામ સોદાના નાણાં સીધા તમારા બેંક ખાતામાં એસ્ક્રૉ ક્લિયરિંગ દ્વારા જમા થાય છે.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-[#132B23] mb-1">
                    બેંક ખાતાધારકનું નામ (Account Holder Name) *
                  </label>
                  <input
                    type="text"
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#17362C]/20 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#3F754A]"
                    placeholder="દા.ત. રમેશ જે પટેલ"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#132B23] mb-1">
                    બેંક એકાઉન્ટ નંબર (Bank Account Number) *
                  </label>
                  <input
                    type="password"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#17362C]/20 text-xs font-mono font-black focus:outline-none focus:ring-2 focus:ring-[#3F754A]"
                    placeholder="•••• •••• •••• 1048"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#132B23] mb-1">
                    IFSC કોડ (Bank IFSC Code) *
                  </label>
                  <input
                    type="text"
                    value={bankIfscCode}
                    onChange={(e) => setBankIfscCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#17362C]/20 text-xs font-mono font-black focus:outline-none focus:ring-2 focus:ring-[#3F754A]"
                    placeholder="SBIN0004928"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#132B23] mb-1">
                    UPI ID / VPA (Optional)
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#17362C]/20 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#3F754A]"
                    placeholder="farmername@sbi"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: KYC & IDENTITY DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-white border border-[#17362C]/15 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#17362C] text-[#D9FF55] flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-[#132B23]">
                      સરકારી ચકાસણી સ્થિતિ: <span className="text-[#3F754A] font-black">{user.verificationStatus || 'Pending'}</span>
                    </div>
                    <div className="text-[11px] text-[#132B23]/70">
                      અધિકૃત 7/12 ઉતારો અથવા જીએસટી સર્ટિફિકેટ સબમિટ કરીને વેરિફાઈડ બેજ મેળવો.
                    </div>
                  </div>
                </div>

                {onOpenVerification && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenVerification();
                    }}
                    className="px-4 py-2 rounded-xl bg-[#D9FF55] text-[#17362C] font-black text-xs shadow hover:bg-[#cbf73c] cursor-pointer"
                  >
                    વેરિફિકેશન પેજ ખોલો →
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-[#132B23] mb-1">
                    દસ્તાવેજ પ્રકાર (Document Type)
                  </label>
                  <select
                    value={identityDocType}
                    onChange={(e) => setIdentityDocType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#17362C]/20 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#3F754A] cursor-pointer"
                  >
                    <option value="7/12 Land Record">7/12 જમીન ઉતારો (7/12 Land Record)</option>
                    <option value="Aadhaar Card">આધાર કાર્ડ (Aadhaar Card)</option>
                    <option value="Kisan Credit Card">કિસાન ક્રેડિટ કાર્ડ (KCC)</option>
                    <option value="GST Certificate">જીએસટી સર્ટિફિકેટ (GST Certificate)</option>
                    <option value="Organic Certificate">ઓર્ગેનિક પ્રમાણપત્ર (Organic Cert)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-[#132B23] mb-1">
                    દસ્તાવેજ / સર્વે નંબર (Document / Survey Number)
                  </label>
                  <input
                    type="text"
                    value={identityDocNumber}
                    onChange={(e) => setIdentityDocNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#17362C]/20 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#3F754A]"
                    placeholder="દા.ત. SURVEY-42-MAHUVA"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-[#132B23] mb-1">
                  દસ્તાવેજ ફાઇલ URL / લિંક (Document File URL)
                </label>
                <input
                  type="url"
                  value={identityDocUrl}
                  onChange={(e) => setIdentityDocUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#17362C]/20 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#3F754A]"
                  placeholder="https://..."
                />
              </div>
            </div>
          )}

          {/* Footer Action Controls */}
          <div className="pt-4 border-t border-[#17362C]/10 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#17362C]/20 text-xs font-black text-[#132B23] hover:bg-black/5 transition-all cursor-pointer"
            >
              બંધ કરો (Close)
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#17362C] text-[#D9FF55] font-black text-xs shadow-lg hover:bg-[#244E3E] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'સાચવી રહ્યા છીએ...' : 'પ્રોફાઇલ સાચવો (Save Profile)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
