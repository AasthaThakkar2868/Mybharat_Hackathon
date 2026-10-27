import React, { useState } from 'react';
import type { Crop, Language, PriceForecast } from '../types';
import { PRICE_FORECASTS } from '../data/mockData';
import { useTranslation } from '../i18n/useTranslation';
import {
  Brain,
  ShieldCheck,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { AudioSpeechButton } from './AudioSpeechButton';
import { convertRateToPerKg, formatRatePerKg } from '../utils/quantity';

interface PriceForecastEngineProps {
  language?: Language;
  selectedCrop: Crop;
  onSelectCrop: (crop: Crop) => void;
  onNavigateToMarketplace: () => void;
}

const DISTRICTS_LIST = ['Rajkot', 'Bhavnagar', 'Ahmedabad', 'Mehsana', 'Anand', 'Junagadh', 'Surat'];
const PERIODS_LIST: ('3 Days' | '7 Days' | '14 Days' | '30 Days')[] = [
  '3 Days',
  '7 Days',
  '14 Days',
  '30 Days',
];

export const PriceForecastEngine: React.FC<PriceForecastEngineProps> = ({
  selectedCrop,
  onSelectCrop,
  onNavigateToMarketplace,
}) => {
  const { t, translateCrop, language } = useTranslation();
  const [selectedDistrict, setSelectedDistrict] = useState('Rajkot');
  const [selectedPeriod, setSelectedPeriod] = useState<'3 Days' | '7 Days' | '14 Days' | '30 Days'>('7 Days');

  // Retrieve matching or fallback deterministic forecast
  const cropForecasts = PRICE_FORECASTS[selectedCrop] || PRICE_FORECASTS['Onion'];
  const baseForecast: PriceForecast =
    cropForecasts[selectedDistrict] ||
    Object.values(cropForecasts)[0] || {
      crop: selectedCrop,
      district: selectedDistrict,
      period: selectedPeriod,
      currentPrice: 2800,
      predictedPrice: 3080,
      priceChangePercent: 10.0,
      trendDirection: 'up',
      expectedDemand: 'High',
      arrivalPressure: 'Low Arrivals (Supply Tight)',
      confidenceScore: 93.5,
      recommendedWindow: 'Hold 3-4 days for peak realization',
      bestDestination: `${selectedDistrict} Corporate Processing Hub`,
      explanation: `Projected APMC arrivals in ${selectedDistrict} are declining by 15%, creating a supply deficit and driving processor bids upward.`,
      historicalSupplyPoints: [
        { label: 'Day -4', price: 2650, arrivalTons: 3800 },
        { label: 'Day -2', price: 2720, arrivalTons: 3500 },
        { label: 'Today', price: 2800, arrivalTons: 3200 },
        { label: 'Proj +3d', price: 2950, arrivalTons: 2800 },
        { label: 'Proj +7d', price: 3080, arrivalTons: 2500 },
      ],
    };

  // Adjust deterministic numbers based on selected period
  const periodMultiplier = selectedPeriod === '3 Days' ? 0.6 : selectedPeriod === '14 Days' ? 1.4 : selectedPeriod === '30 Days' ? 1.9 : 1.0;
  const adjustedPriceChange = (baseForecast.priceChangePercent * periodMultiplier).toFixed(2);
  const adjustedPredictedPrice = Math.round(baseForecast.currentPrice * (1 + (baseForecast.priceChangePercent * periodMultiplier) / 100));

  const currentPriceKg = convertRateToPerKg(baseForecast.currentPrice);
  const predictedPriceKg = convertRateToPerKg(adjustedPredictedPrice);

  const speechText = `${t('forecastTitle')}. ${translateCrop(selectedCrop)} in ${selectedDistrict}. ${formatRatePerKg(predictedPriceKg, language)}. ${baseForecast.explanation}`;

  return (
    <section id="forecast" className="py-10 sm:py-14 bg-[#17362C] text-[#F6F1E4] border-b border-[#D9FF55]/15 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#3F754A]/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#D9FF55]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D9FF55]/20 text-[#D9FF55] text-xs font-bold uppercase tracking-wider border border-[#D9FF55]/30">
            <Brain className="w-3.5 h-3.5 text-[#D9FF55]" />
            <span>Deterministic Arrival & Demand Predictive Engine</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black font-editorial text-white tracking-tight">
            {t('forecastTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-[#F6F1E4]/80 leading-relaxed">
            {t('forecastSubtitle')}
          </p>
          <div className="pt-1">
            <AudioSpeechButton textToRead={speechText} label={t('voiceListen')} className="bg-white/10 text-[#D9FF55] border-white/15" />
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#132B23]/90 p-4 rounded-3xl border border-white/10 shadow-lg">
          {/* Crop Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#D9FF55] mb-1.5">
              {t('selectCrop')}
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => onSelectCrop(e.target.value as Crop)}
              className="w-full bg-[#17362C] border border-[#D9FF55]/30 text-white rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#D9FF55] min-h-[44px]"
            >
              <optgroup label="🥦 શાકભાજી — Vegetables" className="bg-[#132B23] font-bold text-[#D9FF55]">
                <option value="Potato">🥔 બટાટા (Potato)</option>
                <option value="Onion">🧅 ડુંગળી (Onion)</option>
                <option value="Tomato">🍅 ટામેટા (Tomato)</option>
                <option value="GreenChillies">🌶️ લીલા મરચાં (Green Chillies)</option>
                <option value="BottleGourd">🥒 દૂધી (Bottle Gourd)</option>
                <option value="BitterGourd">🍈 કારેલા (Bitter Gourd)</option>
              </optgroup>
              <optgroup label="🍎 ફળો — Fruits" className="bg-[#132B23] font-bold text-[#D9FF55]">
                <option value="Banana">🍌 કેળા (Banana)</option>
                <option value="KesarMango">🥭 કેસર કેરી (Kesar Mango)</option>
                <option value="Pomegranate">🍎 દાડમ (Pomegranate)</option>
                <option value="Papaya">🍈 પપૈયા (Papaya)</option>
                <option value="Dates">🌴 ખારેક / ખજૂર (Dates)</option>
              </optgroup>
              <optgroup label="🌿 મસાલા પાકો — Spices" className="bg-[#132B23] font-bold text-[#D9FF55]">
                <option value="Cumin">🌿 જીરું (Cumin)</option>
                <option value="Fennel">🌱 વરિયાળી (Fennel)</option>
                <option value="Coriander">☘️ ધાણા (Coriander)</option>
                <option value="Mustard">🟡 રાઈ / સરસવ (Mustard)</option>
                <option value="Fenugreek">🍃 મેથી (Fenugreek)</option>
              </optgroup>
            </select>
          </div>

          {/* District Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#D9FF55] mb-1.5">
              Select Gujarat District
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full bg-[#17362C] border border-[#D9FF55]/30 text-white rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#D9FF55] min-h-[44px]"
            >
              {DISTRICTS_LIST.map((dist) => (
                <option key={dist} value={dist}>
                  📍 {dist} District
                </option>
              ))}
            </select>
          </div>

          {/* Period Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#D9FF55] mb-1.5">
              {t('selectPeriod')}
            </label>
            <div className="grid grid-cols-4 gap-1">
              {PERIODS_LIST.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(p)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] cursor-pointer ${
                    selectedPeriod === p
                      ? 'bg-[#D9FF55] text-[#17362C] shadow-sm font-extrabold'
                      : 'bg-[#17362C] text-[#F6F1E4]/70 hover:text-white border border-white/10'
                  }`}
                >
                  {p === '3 Days' ? t('horizon3Days') : p === '7 Days' ? t('horizon7Days') : p === '14 Days' ? t('horizon14Days') : t('horizon30Days')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Forecast Insights Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Main Prediction Score Card */}
          <div className="lg:col-span-7 bg-gradient-to-br from-[#244E3E] to-[#17362C] p-6 sm:p-8 rounded-3xl border border-[#D9FF55]/30 shadow-2xl flex flex-col justify-between space-y-6">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="bg-[#D9FF55] text-[#17362C] text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    {translateCrop(baseForecast.crop)} · {selectedDistrict}
                  </span>
                  <span className="text-xs text-emerald-300 font-bold">
                    {selectedPeriod}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1 rounded-full text-xs font-mono border border-white/10">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D9FF55]" />
                  <span>{baseForecast.confidenceScore}% {t('confidenceScore')}</span>
                </div>
              </div>

              {/* Price Jump Numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
                <div className="bg-[#132B23]/70 p-4 rounded-2xl border border-white/10">
                  <span className="text-xs text-[#F6F1E4]/70 block font-medium">Current Baseline Rate</span>
                  <div className="text-2xl sm:text-3xl font-black font-editorial text-white">
                    {formatRatePerKg(currentPriceKg, language)}
                  </div>
                </div>

                <div className="bg-[#17362C] p-4 rounded-2xl border border-[#D9FF55]/50 shadow-inner">
                  <span className="text-xs text-[#D9FF55] block font-bold">
                    {t('expectedPriceChange')} ({selectedPeriod})
                  </span>
                  <div className="text-2xl sm:text-3xl font-black font-editorial text-[#D9FF55] flex items-center gap-2">
                    <span>{formatRatePerKg(predictedPriceKg, language)}</span>
                    <span className="text-xs bg-[#FF7043] text-white px-2 py-0.5 rounded-full font-bold">
                      +{adjustedPriceChange}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Natural Language Prediction Rationale */}
              <div className="bg-[#132B23]/90 p-4 rounded-2xl border border-[#D9FF55]/20">
                <h4 className="text-xs font-bold text-[#D9FF55] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <Brain className="w-3.5 h-3.5" />
                  <span>{t('predictionRationale')}</span>
                </h4>
                <p className="text-xs sm:text-sm text-[#F6F1E4]/90 leading-relaxed font-medium">
                  "{baseForecast.explanation}"
                </p>
              </div>
            </div>

            {/* Action Window & CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-[#D9FF55]/20 text-[#D9FF55]">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-[#F6F1E4]/70 block font-semibold">{t('recommendedWindow')}</span>
                  <span className="text-xs sm:text-sm font-bold text-[#D9FF55]">
                    {baseForecast.recommendedWindow}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onNavigateToMarketplace}
                className="px-5 py-3 rounded-2xl bg-[#D9FF55] hover:bg-[#c9ef45] text-[#17362C] font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 min-h-[48px]"
              >
                <span>{t('sendOffer')}</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Supply Arrival Pressure & Destination Breakdown */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            
            {/* Arrival Pressure Card */}
            <div className="bg-[#132B23]/90 p-5 rounded-3xl border border-white/10 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#D9FF55]">
                  {t('arrivalPressure')}
                </span>
                <span className="text-xs bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-full font-bold">
                  {baseForecast.arrivalPressure.split(' ')[0]}
                </span>
              </div>
              <p className="text-xs text-[#F6F1E4]/80 leading-relaxed">
                Supply influx remains tight across Saurashtra APMC yards, giving growers strong bargaining leverage against processors.
              </p>
            </div>

            {/* Top Recommended Destination */}
            <div className="bg-[#132B23]/90 p-5 rounded-3xl border border-white/10 shadow-lg space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D9FF55]">
                {t('bestDestination')}
              </span>
              <h4 className="text-base font-bold text-white">
                {baseForecast.bestDestination}
              </h4>
              <p className="text-xs text-[#F6F1E4]/70">
                Direct factory gate dispatch with guaranteed escrow clearance within 24 hours of weighment.
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
