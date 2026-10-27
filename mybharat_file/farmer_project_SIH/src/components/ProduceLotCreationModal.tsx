import React, { useState, useEffect } from 'react';
import type { ProduceListing, Crop, CropCategory, QualityGrade, ListingPhoto } from '../types';
import { useAuth } from '../auth/AuthContext';
import { dbService } from '../services/dbService';
import { useTranslation } from '../i18n/LanguageContext';
import {
  X,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Save,
  Package,
  Search,
  Camera,
  Upload,
  Trash2,
  Info,
  Plus,
  Sprout,
  Clock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AudioSpeechButton } from './AudioSpeechButton';
import { PRODUCT_CATALOG, PRODUCT_CATEGORIES, getProductById, type ProductCatalogItem } from '../data/productCatalog';
import { NewCropRegistrationModal } from './NewCropRegistrationModal';
import { cropService, type MongoCropItem } from '../services/cropService';

interface ProduceLotCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLotCreated?: (newLot: ProduceListing) => void;
}

const MAHARASHTRA_DISTRICTS = [
  'Pune',
  'Nashik',
  'Nagpur',
  'Kolhapur',
  'Solapur',
  'Latur',
  'Ahmednagar',
  'Jalgaon',
  'Amravati',
  'Satara',
  'Sangli',
  'Chhatrapati Sambhajinagar',
  'Wardha',
  'Nanded',
  'Yavatmal',
  'Bhandara',
  'Chandrapur',
  'Dhule',
  'Parbhani',
];

export const ProduceLotCreationModal: React.FC<ProduceLotCreationModalProps> = ({
  isOpen,
  onClose,
  onLotCreated,
}) => {
  const { user } = useAuth();
  const { t, translateCrop, translateGrade, translateDistrict } = useTranslation();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1); // 7 is success screen

  // Form State
  const [crop, setCrop] = useState<Crop>('Soybean');
  const [variety, setVariety] = useState('JS-335 / Phule Kalyani');
  const [quantity, setQuantity] = useState<number>(10);
  const [unit, setUnit] = useState<'tonne' | 'quintal' | 'kg'>('tonne');
  const minPurchaseQuantity = 1;
  const [grade, setGrade] = useState<QualityGrade>('Grade A (Export / Super)');
  const harvestDate = new Date().toISOString().split('T')[0];
  const freshnessCondition = 'Freshly harvested, sun-dried, optimal moisture level';
  const isOrganic = false;
  const organicCertUrl = '';
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<ListingPhoto[]>([]);
  const [expectedPrice, setExpectedPrice] = useState<number>(4400); // ₹ per quintal / unit
  const [priceUnit, setPriceUnit] = useState<'quintal' | 'kg' | 'tonne'>('quintal');
  const [district, setDistrict] = useState(user?.district || 'Pune');
  const taluka = user?.taluka || 'Baramati';
  const [village, setVillage] = useState(user?.village || 'Baramati Rural');
  const [pickupAddress, setPickupAddress] = useState(user?.pickupAddress || 'Gat No. 42, Baramati-Phaltan Road, Baramati');
  const pickupReadyDate = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
  const storageAvailable = true;
  const transportNeeded = true;

  const [createdListing, setCreatedListing] = useState<ProduceListing | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CropCategory | 'All'>('All');
  const [cropSearch, setCropSearch] = useState('');
  const [draftSavedToast, setDraftSavedToast] = useState(false);

  // Dynamic MongoDB Atlas Crops
  const [customCrops, setCustomCrops] = useState<MongoCropItem[]>([]);
  const [showNewCropModal, setShowNewCropModal] = useState(false);
  const [isPendingCrop, setIsPendingCrop] = useState(false);

  // Fetch crops from MongoDB Atlas on modal open
  useEffect(() => {
    if (isOpen) {
      cropService.getCrops('all').then((crops) => {
        setCustomCrops(crops);
      }).catch(() => {});
    }
  }, [isOpen]);

  // Combined product catalog (Static + MongoDB Atlas)
  const allCatalogItems: ProductCatalogItem[] = React.useMemo(() => {
    const dynamicItems: ProductCatalogItem[] = customCrops.map((c) => ({
      id: c.nameEn as any,
      category: (c.categoryCode || 'Fruits') as CropCategory,
      categoryGu: c.categoryCode,
      categoryHi: c.categoryCode,
      categoryMr: c.categoryCode,
      categoryEn: c.categoryCode,
      nameEn: c.nameEn,
      nameGu: c.nameGu,
      nameHi: c.nameHi || c.nameEn,
      nameMr: c.nameMr || c.nameEn,
      icon: '🌱',
      image: c.imageUrl || 'https://images.unsplash.com/photo-1596720426673-e4e14290f0cc?w=600&auto=format&fit=crop&q=80',
      defaultVariety: c.variety || 'Standard Cultivar',
      defaultUnit: (c.defaultUnit === 'tonne' ? 'tonne' : 'kg') as any,
      typicalPricePerKg: (c.marketBenchmarkPrice || 2500) / 100,
      typicalYieldDistrict: c.primaryMarket || 'APMC Yard',
      descriptionEn: c.farmerNotes || '',
      descriptionGu: c.farmerNotes || '',
      descriptionHi: c.farmerNotes || '',
      descriptionMr: c.farmerNotes || '',
    }));

    const staticKeys = new Set(PRODUCT_CATALOG.map((p) => p.nameEn.toLowerCase().replace(/[^a-z0-9]/g, '')));
    const filteredDynamic = dynamicItems.filter(
      (d) => !staticKeys.has(d.nameEn.toLowerCase().replace(/[^a-z0-9]/g, ''))
    );

    return [...PRODUCT_CATALOG, ...filteredDynamic];
  }, [customCrops]);

  // Selected product metadata
  const activeCatalogItem = allCatalogItems.find((p) => p.id === crop || p.nameEn === crop) || getProductById(crop);

  // Suggested price computation
  const basePricePerKg = activeCatalogItem?.typicalPricePerKg || 44;
  const suggestedPriceMin = basePricePerKg * 90;
  const suggestedPriceMax = basePricePerKg * 115;

  // Load draft from storage when modal opens
  useEffect(() => {
    if (isOpen) {
      try {
        const draft = localStorage.getItem('krishisetu_listing_draft_v3');
        if (draft) {
          const p = JSON.parse(draft);
          if (p.crop) setCrop(p.crop);
          if (p.variety) setVariety(p.variety);
          if (p.quantity) setQuantity(p.quantity);
          if (p.unit) setUnit(p.unit);
          if (p.grade) setGrade(p.grade);
          if (p.expectedPrice) setExpectedPrice(p.expectedPrice);
          if (p.district) setDistrict(p.district);
          if (p.village) setVillage(p.village);
          if (p.pickupAddress) setPickupAddress(p.pickupAddress);
          if (p.photos) setPhotos(p.photos);
          if (p.description) setDescription(p.description);
        }
      } catch (_) {}
    }
  }, [isOpen]);

  // Save draft to localStorage
  const saveDraft = () => {
    try {
      const draftData = {
        crop,
        variety,
        quantity,
        unit,
        minPurchaseQuantity,
        grade,
        harvestDate,
        freshnessCondition,
        isOrganic,
        description,
        expectedPrice,
        priceUnit,
        district,
        taluka,
        village,
        pickupAddress,
        photos,
      };
      localStorage.setItem('krishisetu_listing_draft_v3', JSON.stringify(draftData));
      setDraftSavedToast(true);
      setTimeout(() => setDraftSavedToast(false), 2000);
    } catch (_) {}
  };

  // Default photos if none uploaded
  useEffect(() => {
    if (photos.length === 0 && activeCatalogItem) {
      setPhotos([
        {
          id: `photo-default-${crop}`,
          url: activeCatalogItem.image,
          isPrimary: true,
          name: `${activeCatalogItem.nameEn} Photo`,
          uploadedAt: new Date().toISOString(),
        },
      ]);
    }
  }, [crop, activeCatalogItem, photos.length]);

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file, index) => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 8 * 1024 * 1024) {
        alert('Image size exceeds 8MB. Please upload a smaller image.');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const photoObj: ListingPhoto = {
          id: `photo-${Date.now()}-${index}`,
          url: base64,
          isPrimary: photos.length === 0 && index === 0,
          name: file.name,
          sizeBytes: file.size,
          uploadedAt: new Date().toISOString(),
        };
        setPhotos((prev) => [...prev, photoObj]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      if (filtered.length > 0 && !filtered.some((p) => p.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  // Submit Listing for Administrator Verification
  const handleSubmitListing = async () => {
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const newListing = await dbService.createListing({
        farmerId: user?.id || 'USER-FAR-9142',
        farmerName: user?.name || 'Ramesh Patil',
        farmerMobile: user?.mobile || '9825143210',
        category: activeCatalogItem?.category || 'Oilseeds',
        crop,
        cropGu: activeCatalogItem?.nameGu || crop,
        cropMr: activeCatalogItem?.nameMr || crop,
        cropHi: activeCatalogItem?.nameHi || crop,
        variety: variety || activeCatalogItem?.defaultVariety || 'Standard Cultivar',
        quantity: Number(quantity) || 1,
        unit,
        minPurchaseQuantity: Number(minPurchaseQuantity) || 1,
        grade,
        harvestDate,
        freshnessCondition,
        isOrganic,
        organicCertUrl: isOrganic ? organicCertUrl || 'Self-Declared Organic / Cert Pending' : undefined,
        description,
        expectedPrice: Number(expectedPrice) || 1000,
        priceUnit,
        suggestedPriceMin,
        suggestedPriceMax,
        district,
        taluka,
        village,
        pickupAddress,
        pickupReadyDate,
        storageAvailable,
        transportNeeded,
        status: 'Submitted',
        primaryImageUrl: photos[0]?.url || activeCatalogItem?.image,
        photos,
        isPendingCropApproval: isPendingCrop,
      });

      localStorage.removeItem('krishisetu_listing_draft_v3');
      setCreatedListing(newListing);
      if (onLotCreated) onLotCreated(newListing);

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#D9FF55', '#3F754A', '#17362C'],
        });
      } catch (_) {}

      setStep(7);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredCatalog = allCatalogItems.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const q = cropSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.nameEn.toLowerCase().includes(q) ||
      p.nameMr.toLowerCase().includes(q) ||
      p.nameHi.toLowerCase().includes(q) ||
      p.nameGu.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const stepLabels: Record<number, string> = {
    1: t('stepBasicDetails'),
    2: t('stepQuantityPrice'),
    3: t('stepQualityGrade'),
    4: t('stepPhotosDocs'),
    5: t('stepLogisticsStorage'),
    6: t('stepReviewSubmit'),
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 animate-fade-in">
      <div className="bg-[#F6F1E4] dark:bg-[#1E293B] text-[#132B23] dark:text-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-[#17362C]/20 dark:border-white/10 max-h-[92vh] flex flex-col">
        
        {/* Modal Top Header with Draft Save & Close */}
        <div className="px-6 py-4 bg-[#17362C] dark:bg-[#0B1E17] text-[#F6F1E4] flex items-center justify-between border-b border-[#D9FF55]/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#D9FF55]/20 flex items-center justify-center text-[#D9FF55]">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-[#D9FF55]">
                  {step === 7 ? t('lotCreatedSuccessTitle') : t('guidedLotTitle')}
                </h3>
                {draftSavedToast && (
                  <span className="text-[11px] bg-[#D9FF55] text-[#17362C] font-black px-2 py-0.5 rounded-full animate-pulse">
                    ✓ Draft Saved
                  </span>
                )}
              </div>
              <p className="text-xs text-[#F6F1E4]/70">
                {step === 7 ? t('lotCreatedSuccessDesc') : `${step} / 6 — ${stepLabels[step] || ''}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {step < 7 && (
              <button
                type="button"
                onClick={saveDraft}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#F6F1E4] text-xs font-bold transition-all"
                title={t('saveDraftBtn')}
              >
                <Save className="w-3.5 h-3.5 text-[#D9FF55]" />
                <span>{t('saveDraftBtn')}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#F6F1E4] transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Wizard Progress Bar */}
        {step < 7 && (
          <div className="bg-[#17362C]/5 dark:bg-white/5 px-6 py-2.5 border-b border-[#17362C]/10 dark:border-white/10 flex items-center justify-between gap-2 overflow-x-auto">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  saveDraft();
                  setStep(num as any);
                }}
                className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full transition-all whitespace-nowrap cursor-pointer ${
                  step === num
                    ? 'bg-[#17362C] dark:bg-[#D9FF55] text-[#D9FF55] dark:text-[#17362C] shadow-sm'
                    : step > num
                    ? 'bg-[#3F754A]/20 dark:bg-[#3F754A]/40 text-[#3F754A] dark:text-[#88d49e]'
                    : 'text-[#132B23]/40 dark:text-white/40 hover:bg-[#17362C]/5'
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  step === num ? 'bg-[#D9FF55] text-[#17362C]' : 'bg-black/10 dark:bg-white/10'
                }`}>
                  {num}
                </span>
                <span>{stepLabels[num]}</span>
              </button>
            ))}
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 text-xs font-bold flex items-center gap-2">
              <Info className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: SELECT PRODUCE */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h4 className="text-lg font-black text-[#132B23] dark:text-white">
                    {t('lotQ1Title')}
                  </h4>
                  <p className="text-xs text-[#132B23]/70 dark:text-white/70">
                    {t('lotQ1Desc')}
                  </p>
                </div>
                <AudioSpeechButton
                  textToSpeak={`${t('lotQ1Title')}. ${t('lotQ1Desc')}`}
                  label={t('voiceListen')}
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('All')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === 'All'
                      ? 'bg-[#17362C] dark:bg-[#D9FF55] text-[#D9FF55] dark:text-[#17362C]'
                      : 'bg-white dark:bg-[#0F172A] text-[#132B23]/70 dark:text-white/70 border border-[#17362C]/20 dark:border-white/10 hover:bg-[#17362C]/5'
                  }`}
                >
                  {t('allCrops')}
                </button>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-[#17362C] dark:bg-[#D9FF55] text-[#D9FF55] dark:text-[#17362C]'
                        : 'bg-white dark:bg-[#0F172A] text-[#132B23]/70 dark:text-white/70 border border-[#17362C]/20 dark:border-white/10 hover:bg-[#17362C]/5'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.nameEn}</span>
                  </button>
                ))}
              </div>

              {/* Search Bar & Add Custom Crop Button */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#132B23]/40 dark:text-white/40" />
                  <input
                    type="text"
                    value={cropSearch}
                    onChange={(e) => setCropSearch(e.target.value)}
                    placeholder={`${t('filterCrop')} (e.g. Soybean, Onion, Cotton, Banana, Grapes)...`}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#0F172A] border border-[#17362C]/20 dark:border-white/10 text-xs font-medium text-[#132B23] dark:text-white outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewCropModal(true)}
                  className="px-3.5 py-2.5 rounded-2xl bg-[#17362C] dark:bg-[#D9FF55] text-[#D9FF55] dark:text-[#17362C] font-black text-xs flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-all shrink-0 cursor-pointer"
                  title="Add a custom crop not in directory"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add New Crop</span>
                </button>
              </div>

              {/* Empty Search: Prompt to Register New Crop */}
              {filteredCatalog.length === 0 && cropSearch.trim() && (
                <div className="p-6 rounded-3xl bg-amber-500/10 border-2 border-dashed border-amber-500/40 text-center space-y-3 animate-fade-in">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                    <Sprout className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-sm font-black text-amber-900 dark:text-amber-200">
                      "{cropSearch}" is not in the directory. Add this crop.
                    </h5>
                    <p className="text-xs text-amber-800 dark:text-amber-300 max-w-md mx-auto">
                      You don't need to select another crop. Complete the new-crop registration and start creating your listing immediately.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewCropModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Register "{cropSearch}" Now</span>
                  </button>
                </div>
              )}

              {/* Produce Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {filteredCatalog.map((prod) => {
                  const isSelected = crop === prod.id || crop === prod.nameEn;
                  const isPending = (prod as any).status === 'pending';
                  return (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => {
                        setCrop(prod.id);
                        setVariety(prod.defaultVariety);
                        if (prod.defaultUnit === 'tonne') setUnit('tonne');
                        else setUnit('quintal');
                        setExpectedPrice(prod.typicalPricePerKg * 100);
                        setIsPendingCrop(isPending);
                      }}
                      className={`p-3 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between gap-2.5 cursor-pointer relative overflow-hidden group ${
                        isSelected
                          ? 'border-[#17362C] dark:border-[#D9FF55] bg-[#17362C]/10 dark:bg-[#D9FF55]/10 shadow-md ring-2 ring-[#17362C] dark:ring-[#D9FF55]'
                          : 'border-[#17362C]/15 dark:border-white/10 bg-white dark:bg-[#0F172A] hover:border-[#17362C]/40'
                      }`}
                    >
                      <div className="relative h-24 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <img
                          src={prod.image}
                          alt={translateCrop(prod.id)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                          <span className="bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {prod.icon} {prod.category}
                          </span>
                          {isPending && (
                            <span className="bg-amber-500/90 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              <span>Pending Review</span>
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#17362C] dark:bg-[#D9FF55] text-[#D9FF55] dark:text-[#17362C] flex items-center justify-center shadow-lg">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="text-sm font-black text-[#132B23] dark:text-white">
                          {translateCrop(prod.id)}
                        </div>
                        <div className="text-[11px] text-[#132B23]/70 dark:text-white/60 font-medium line-clamp-1">
                          {prod.defaultVariety}
                        </div>
                        <div className="text-[11px] font-bold text-[#3F754A] dark:text-[#88d49e] mt-1">
                          Mandi Avg: ₹{prod.typicalPricePerKg}/kg
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: QUANTITY & BATCH */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h4 className="text-lg font-black text-[#132B23] dark:text-white">
                    {t('lotQ2Title')}
                  </h4>
                  <p className="text-xs text-[#132B23]/70 dark:text-white/70">
                    {t('lotQ2Desc')}
                  </p>
                </div>
              </div>

              {/* Selected Produce Summary Pill */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0F172A] border border-[#17362C]/15 dark:border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={activeCatalogItem?.image}
                    alt={translateCrop(crop)}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#3F754A] dark:text-[#88d49e] uppercase tracking-wider">{t('produceType')}</span>
                      {isPendingCrop && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-black tracking-wide border border-amber-500/30">
                          Pending crop approval
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-black text-[#132B23] dark:text-white">
                      {translateCrop(crop)} — {variety}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#132B23] dark:text-white">
                    {t('quantity')}*
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0.1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                      className="flex-1 px-4 py-3 rounded-2xl bg-white dark:bg-[#0F172A] border border-[#17362C]/20 dark:border-white/10 text-sm font-black text-[#132B23] dark:text-white outline-none"
                    />
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value as any)}
                      className="px-3 py-3 rounded-2xl bg-white dark:bg-[#0F172A] border border-[#17362C]/20 dark:border-white/10 text-xs font-bold text-[#132B23] dark:text-white outline-none"
                    >
                      <option value="tonne">Tonne (MT)</option>
                      <option value="quintal">Quintal (100 Kg)</option>
                      <option value="kg">Kg</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#132B23] dark:text-white">
                    {t('variety')}*
                  </label>
                  <input
                    type="text"
                    value={variety}
                    onChange={(e) => setVariety(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-[#0F172A] border border-[#17362C]/20 dark:border-white/10 text-xs font-bold text-[#132B23] dark:text-white outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: QUALITY & GRADE */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-black text-[#132B23] dark:text-white">
                  {t('lotQ4Title')}
                </h4>
                <p className="text-xs text-[#132B23]/70 dark:text-white/70">
                  {t('lotQ4Desc')}
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    gradeVal: 'Grade A (Export / Super)' as QualityGrade,
                    title: 'Grade A (Super / Export)',
                    desc: 'Uniform size, zero disease marks, optimal moisture under 12%. Commands premium processor rate.',
                  },
                  {
                    gradeVal: 'Grade B (Premium Table)' as QualityGrade,
                    title: 'Grade B (Table Quality)',
                    desc: 'Standard market quality, minor size variance, ideal for fresh domestic retail.',
                  },
                  {
                    gradeVal: 'Grade C (Processing / Fair)' as QualityGrade,
                    title: 'Grade C (Processing)',
                    desc: 'Suitable for dehydration, pulp extraction, or livestock feed formulation.',
                  },
                ].map((g) => (
                  <button
                    key={g.gradeVal}
                    type="button"
                    onClick={() => setGrade(g.gradeVal)}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3 cursor-pointer ${
                      grade === g.gradeVal
                        ? 'border-[#17362C] dark:border-[#D9FF55] bg-[#17362C]/5 dark:bg-[#D9FF55]/10'
                        : 'border-[#17362C]/15 dark:border-white/10 bg-white dark:bg-[#0F172A]'
                    }`}
                  >
                    <div className="pt-0.5">
                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        grade === g.gradeVal ? 'border-[#17362C] dark:border-[#D9FF55] bg-[#17362C] dark:bg-[#D9FF55]' : 'border-gray-400'
                      }`} />
                    </div>
                    <div>
                      <div className="text-sm font-black text-[#132B23] dark:text-white">{g.title}</div>
                      <div className="text-xs text-[#132B23]/70 dark:text-white/70">{g.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: PHOTOGRAPHS */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-black text-[#132B23] dark:text-white">
                  Produce Photographs
                </h4>
                <p className="text-xs text-[#132B23]/70 dark:text-white/70">
                  Upload clear photos of your harvest lot for corporate buyers.
                </p>
              </div>

              <div className="border-2 border-dashed border-[#17362C]/30 dark:border-white/20 rounded-3xl p-6 bg-white/70 dark:bg-[#0F172A] text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#17362C]/10 text-[#17362C] dark:text-[#D9FF55] flex items-center justify-center mx-auto">
                  <Camera className="w-6 h-6" />
                </div>
                <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#17362C] dark:bg-[#D9FF55] text-[#D9FF55] dark:text-[#17362C] text-xs font-black shadow-md cursor-pointer transition-all active:scale-95">
                  <Upload className="w-4 h-4" />
                  <span>Upload Photos</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {photos.map((p, idx) => (
                    <div key={p.id || idx} className="relative rounded-2xl overflow-hidden bg-white dark:bg-black/20 border border-[#17362C]/20 dark:border-white/10 h-32">
                      <img src={p.url} alt="Produce preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(p.id)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md hover:bg-red-700 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 5: PRICE & LOCATION */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-black text-[#132B23] dark:text-white">
                  {t('expectedPrice')} & {t('authDistrict')}
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#132B23] dark:text-white">
                    {t('expectedPrice')} (₹/{priceUnit})*
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      value={expectedPrice}
                      onChange={(e) => setExpectedPrice(parseFloat(e.target.value) || 0)}
                      className="flex-1 px-4 py-3 rounded-2xl bg-white dark:bg-[#0F172A] border border-[#17362C]/20 dark:border-white/10 text-sm font-black text-[#132B23] dark:text-white outline-none"
                    />
                    <select
                      value={priceUnit}
                      onChange={(e) => setPriceUnit(e.target.value as any)}
                      className="px-3 py-3 rounded-2xl bg-white dark:bg-[#0F172A] border border-[#17362C]/20 dark:border-white/10 text-xs font-bold text-[#132B23] dark:text-white outline-none"
                    >
                      <option value="quintal">₹ / Quintal (100 Kg)</option>
                      <option value="kg">₹ / Kg</option>
                      <option value="tonne">₹ / Tonne</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#132B23] dark:text-white">
                    {t('district')}*
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-[#0F172A] border border-[#17362C]/20 dark:border-white/10 text-xs font-bold text-[#132B23] dark:text-white outline-none"
                  >
                    {MAHARASHTRA_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {translateDistrict(d)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#132B23] dark:text-white">
                  {t('village')} / Pickup Address*
                </label>
                <input
                  type="text"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#0F172A] border border-[#17362C]/20 dark:border-white/10 text-xs font-bold text-[#132B23] dark:text-white outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 6: REVIEW & SUBMIT */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-black text-[#132B23] dark:text-white">
                  {t('stepReviewSubmit')}
                </h4>
                <p className="text-xs text-[#132B23]/70 dark:text-white/70">
                  {t('lotQ6Desc')}
                </p>
              </div>

              <div className="rounded-3xl bg-white dark:bg-[#0F172A] border border-[#17362C]/15 dark:border-white/10 p-5 space-y-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <img
                    src={photos[0]?.url || activeCatalogItem?.image}
                    alt={crop}
                    className="w-20 h-20 rounded-2xl object-cover border border-[#17362C]/10 dark:border-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="px-2 py-0.5 rounded-full bg-[#17362C] text-[#D9FF55] text-[10px] font-black">
                      {translateGrade(grade)}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-[#132B23] dark:text-white mt-1">
                      {translateCrop(crop)} — {variety}
                    </h3>
                    <p className="text-xs text-[#132B23]/70 dark:text-white/70">
                      {village}, {translateDistrict(district)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#17362C]/10 dark:border-white/10 text-xs">
                  <div className="p-3 rounded-xl bg-[#F6F1E4]/70 dark:bg-white/5">
                    <span className="text-[#132B23]/60 dark:text-white/60 block text-[11px] font-bold">{t('quantity')}</span>
                    <span className="font-black text-[#132B23] dark:text-white text-sm">{quantity} {unit}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F6F1E4]/70 dark:bg-white/5">
                    <span className="text-[#132B23]/60 dark:text-white/60 block text-[11px] font-bold">{t('expectedPrice')}</span>
                    <span className="font-black text-[#3F754A] dark:text-[#88d49e] text-sm">₹{expectedPrice}/{priceUnit}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F6F1E4]/70 dark:bg-white/5">
                    <span className="text-[#132B23]/60 dark:text-white/60 block text-[11px] font-bold">Total Expected</span>
                    <span className="font-black text-[#132B23] dark:text-white text-sm">
                      ₹{(quantity * (unit === 'tonne' ? 10 : 1) * expectedPrice).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F6F1E4]/70 dark:bg-white/5">
                    <span className="text-[#132B23]/60 dark:text-white/60 block text-[11px] font-bold">Ready Date</span>
                    <span className="font-black text-[#132B23] dark:text-white text-sm">{pickupReadyDate}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: CELEBRATION SUCCESS SCREEN */}
          {step === 7 && createdListing && (
            <div className="text-center py-6 space-y-5 animate-scale-up">
              <div className="w-20 h-20 rounded-full bg-[#3F754A]/20 text-[#3F754A] flex items-center justify-center mx-auto ring-8 ring-[#3F754A]/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1.5">
                <span className="px-3 py-1 rounded-full bg-[#17362C] text-[#D9FF55] text-xs font-black uppercase tracking-wider">
                  {t('lotIdLabel')}: {createdListing.listingCode}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#132B23] dark:text-white mt-2">
                  {t('lotCreatedSuccessTitle')}
                </h3>
                <p className="text-xs sm:text-sm text-[#132B23]/70 dark:text-white/70 max-w-md mx-auto">
                  {t('lotCreatedSuccessDesc')}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-8 py-3.5 rounded-2xl bg-[#17362C] dark:bg-[#D9FF55] hover:bg-[#244E3E] text-[#D9FF55] dark:text-[#17362C] font-extrabold text-sm shadow-xl transition-all active:scale-95 cursor-pointer"
              >
                {t('backToHome')}
              </button>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer Navigation */}
        {step < 7 && (
          <div className="px-6 py-4 bg-white dark:bg-[#0B1E17] border-t border-[#17362C]/15 dark:border-white/10 flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => {
                  saveDraft();
                  setStep((step - 1) as any);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 text-[#132B23] dark:text-white text-xs font-bold transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('prevStepBtn')}</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              {step < 6 ? (
                <button
                  type="button"
                  onClick={() => {
                    saveDraft();
                    setStep((step + 1) as any);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#17362C] dark:bg-[#D9FF55] hover:bg-[#244E3E] text-[#D9FF55] dark:text-[#17362C] text-xs font-black shadow-lg cursor-pointer"
                >
                  <span>{t('nextStepBtn')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitListing}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-[#3F754A] hover:bg-[#2e5936] text-white text-xs font-black shadow-xl cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? '...' : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#D9FF55]" />
                      <span>{t('submitLotBtn')}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Dynamic New Crop Registration Modal */}
      {showNewCropModal && (
        <NewCropRegistrationModal
          isOpen={showNewCropModal}
          onClose={() => setShowNewCropModal(false)}
          initialCropName={cropSearch}
          onCropRegistered={(newCrop) => {
            setCustomCrops(prev => [newCrop, ...prev]);
            setCrop(newCrop.nameEn as Crop);
            if (newCrop.variety) {
              setVariety(newCrop.variety);
            }
            if (newCrop.marketBenchmarkPrice) {
              setExpectedPrice(newCrop.marketBenchmarkPrice);
            }
            setIsPendingCrop(newCrop.status === 'pending');
            setShowNewCropModal(false);
          }}
        />
      )}
    </div>
  );
};
