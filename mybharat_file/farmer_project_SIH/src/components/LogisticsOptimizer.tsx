import React, { useState } from 'react';
import type { Language, LogisticsPlan } from '../types';
import { SAMPLE_LOGISTICS_PLAN } from '../data/mockData';
import { useTranslation } from '../i18n/useTranslation';
import {
  Truck,
  Leaf,
  Navigation,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { AudioSpeechButton } from './AudioSpeechButton';

interface LogisticsOptimizerProps {
  language?: Language;
}

export const LogisticsOptimizer: React.FC<LogisticsOptimizerProps> = () => {
  const { t } = useTranslation();
  const [plan] = useState<LogisticsPlan>(SAMPLE_LOGISTICS_PLAN);
  const [activeStopIndex, setActiveStopIndex] = useState<number>(1);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulateRoute = () => {
    setIsSimulating(true);
    let current = 0;
    const interval = setInterval(() => {
      current++;
      if (current >= plan.stops.length) {
        clearInterval(interval);
        setIsSimulating(false);
      } else {
        setActiveStopIndex(current);
      }
    }, 1200);
  };

  const speechText = `${t('logisticsTitle')}. ${t('logisticsSubtitle')}`;

  return (
    <section id="logistics" className="py-10 sm:py-14 bg-[#17362C] text-[#F6F1E4] border-b border-[#D9FF55]/15 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D9FF55]/20 text-[#D9FF55] text-xs font-bold uppercase tracking-wider border border-[#D9FF55]/30">
            <Truck className="w-3.5 h-3.5 text-[#D9FF55]" />
            <span>FPO Farm-Gate Pooling & Freight Optimization</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black font-editorial text-white tracking-tight">
            {t('logisticsTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-[#F6F1E4]/80 leading-relaxed">
            {t('logisticsSubtitle')}
          </p>
          <div className="pt-1">
            <AudioSpeechButton textToRead={speechText} label={t('voiceListen')} className="bg-white/10 text-[#D9FF55] border-white/15" />
          </div>
        </div>

        {/* 3 Metric Cards: Distance, Cost Savings, CO2 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-[#132B23] p-5 rounded-3xl border border-white/10 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D9FF55]">
                {t('distanceAfter')}
              </span>
              <Navigation className="w-4 h-4 text-[#D9FF55]" />
            </div>
            <div className="text-3xl font-black font-editorial text-white">
              {plan.totalDistanceOptimizedKm} km
              <span className="text-xs font-normal text-white/60 ml-2 line-through">
                {plan.totalDistanceBeforeKm} km
              </span>
            </div>
            <p className="text-xs text-emerald-300 font-semibold mt-1">
              -33.8% Transit Road Mileage via Dynamic Pooling
            </p>
          </div>

          <div className="bg-[#244E3E] p-5 rounded-3xl border border-[#D9FF55]/40 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D9FF55]">
                {t('farmerSavings')}
              </span>
              <span className="text-xs bg-[#D9FF55] text-[#17362C] font-black px-2 py-0.5 rounded-full">
                -57.1%
              </span>
            </div>
            <div className="text-3xl font-black font-editorial text-[#D9FF55]">
              ₹{plan.optimizedCostPerKg.toFixed(2)}/kg
              <span className="text-xs font-normal text-white/60 ml-2 line-through">
                ₹{plan.regularCostPerKg.toFixed(2)}/kg
              </span>
            </div>
            <p className="text-xs text-white/90 font-medium mt-1">
              ₹{plan.totalFarmerSavingsRs.toLocaleString()} Total Freight Saved for Pool #{plan.planId.split('-').pop()}
            </p>
          </div>

          <div className="bg-[#132B23] p-5 rounded-3xl border border-white/10 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D9FF55]">
                {t('co2Saved')}
              </span>
              <Leaf className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="text-3xl font-black font-editorial text-white">
              {plan.co2SavedKg} kg CO₂
            </div>
            <p className="text-xs text-emerald-300 font-semibold mt-1">
              Reduced tailpipe emissions by consolidating small loads
            </p>
          </div>
        </div>

        {/* Interactive Route Map & Stops Card */}
        <div className="bg-[#132B23] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono text-[#D9FF55]">Route ID: {plan.planId}</span>
              <h3 className="text-lg font-black font-editorial text-white mt-0.5">
                Active Vehicle: {plan.vehicleType}
              </h3>
              <p className="text-xs text-white/70">
                Estimated Transit Time: {plan.estimatedTransitHours} hours · Real-Time GPS Tracking Enabled
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSimulateRoute}
                disabled={isSimulating}
                className="px-5 py-3 rounded-xl bg-[#D9FF55] hover:bg-[#c9ef45] text-[#17362C] font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[44px]"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSimulating ? 'Traversing Route...' : t('optimizeRouteBtn')}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveStopIndex(0)}
                className="p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer min-h-[44px]"
                title="Reset Route"
                aria-label="Reset Route"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Multi-Stop Sequential Node View */}
          <div className="relative pt-2 pb-2">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {plan.stops.map((stop, idx) => (
                <div
                  key={stop.id}
                  onClick={() => setActiveStopIndex(idx)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    activeStopIndex === idx
                      ? 'bg-[#244E3E] border-[#D9FF55] shadow-lg ring-2 ring-[#D9FF55]/30'
                      : idx < activeStopIndex
                      ? 'bg-[#17362C] border-[#3F754A] text-white/80'
                      : 'bg-[#17362C]/50 border-white/5 text-white/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold bg-black/40 px-2 py-0.5 rounded-full text-[#D9FF55]">
                        Stop 0{idx + 1}
                      </span>
                      <span className="text-xs">
                        {idx < activeStopIndex ? '✓ Done' : activeStopIndex === idx ? '🚚 Current' : '⏳ Queued'}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white mb-1 line-clamp-2">
                      {stop.name}
                    </h4>
                    <p className="text-[10px] text-white/60 mb-2">{stop.location}</p>
                  </div>

                  <div className="text-[11px] font-bold text-[#D9FF55] pt-2 border-t border-white/10">
                    Load: {(stop.loadWeightKg / 1000).toFixed(1)} MT
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Aggregation Summary Banner */}
          <div className="bg-[#17362C] p-4 rounded-2xl border border-[#D9FF55]/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D9FF55] animate-ping" />
              <span className="font-semibold text-white">
                Pooling Route: Gondal APMC Hub → Mahuva FPO → Sanand Direct Buyer Facility
              </span>
            </div>
            <span className="text-[#D9FF55] font-bold shrink-0">
              Total Consolidated Cargo: 30.0 Metric Tonnes (100% Capacity)
            </span>
          </div>

        </div>

      </div>
    </section>
  );
};
