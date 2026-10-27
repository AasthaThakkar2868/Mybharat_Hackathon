import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import type { NewsItem } from '../types';
import {
  Newspaper,
  Calendar,
  Pin,
  ChevronRight,
  Search,
  X,
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

export const NewsSection: React.FC = () => {
  const { t, language } = useTranslation();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeArticle, setActiveArticle] = useState<NewsItem | null>(null);

  useEffect(() => {
    const loadNews = async () => {
      try {
        const items = await dbService.getNews();
        setNews(items);
      } catch (err) {
        console.error('Error loading news:', err);
      }
    };
    loadNews();
  }, []);

  const getLocalizedTitle = (item: NewsItem): string => {
    if (language === 'mr') return item.titleMr || item.titleEn;
    if (language === 'hi') return item.titleHi || item.titleEn;
    if (language === 'gu') return item.titleGu || item.titleEn;
    return item.titleEn;
  };

  const getLocalizedSummary = (item: NewsItem): string => {
    if (language === 'mr') return item.summaryMr || item.summaryEn;
    if (language === 'hi') return item.summaryHi || item.summaryEn;
    if (language === 'gu') return item.summaryGu || item.summaryEn;
    return item.summaryEn;
  };

  const getLocalizedContent = (item: NewsItem): string => {
    if (language === 'mr') return item.contentMr || item.contentEn || item.summaryMr || item.summaryEn;
    if (language === 'hi') return item.contentHi || item.contentEn || item.summaryHi || item.summaryEn;
    if (language === 'gu') return item.contentGu || item.contentEn || item.summaryGu || item.summaryEn;
    return item.contentEn || item.summaryEn;
  };

  const getLocalizedCategory = (item: NewsItem): string => {
    if (language === 'mr') return item.categoryMr || item.category;
    if (language === 'hi') return item.categoryHi || item.category;
    if (language === 'gu') return item.categoryGu || item.category;
    return item.category;
  };

  const categories = [
    { key: 'All', en: 'All News', mr: 'सर्व बातम्या', hi: 'सभी समाचार', gu: 'બધા સમાચાર' },
    { key: 'MSP & Rates', en: 'MSP & Rates', mr: 'हमीभाव (MSP) व दर', hi: 'एमएसपी व दरें', gu: 'ટેકાના ભાવ અને દરો' },
    { key: 'Government Schemes', en: 'Government Schemes', mr: 'शासकीय योजना', hi: 'सरकारी योजनाएं', gu: 'સરકારી યોજનાઓ' },
    { key: 'Market Advisory', en: 'Market Advisory', mr: 'बाजार सल्ला', hi: 'बाजार सलाह', gu: 'બજાર માર્ગદર્શન' },
    { key: 'Weather & Logistics', en: 'Weather & Logistics', mr: 'हवामान व वाहतूक', hi: 'मौसम व लॉजिस्टिक्स', gu: 'હવામાન & પરિવહન' },
    { key: 'Platform Updates', en: 'Platform Updates', mr: 'प्लॅटफॉर्म अपडेट्स', hi: 'प्लेटफॉर्म अपडेट', gu: 'પ્લેટફોર્મ અપડેટ્સ' },
  ];

  const getCategoryLabel = (cat: typeof categories[0]) => {
    if (language === 'mr') return cat.mr;
    if (language === 'hi') return cat.hi;
    if (language === 'gu') return cat.gu;
    return cat.en;
  };

  const filteredNews = news.filter((item) => {
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        Boolean(item.titleEn?.toLowerCase().includes(q)) ||
        Boolean(item.titleMr?.toLowerCase().includes(q)) ||
        Boolean(item.titleHi?.toLowerCase().includes(q)) ||
        Boolean(item.titleGu?.toLowerCase().includes(q)) ||
        Boolean(item.summaryEn?.toLowerCase().includes(q)) ||
        Boolean(item.summaryMr?.toLowerCase().includes(q)) ||
        Boolean(item.summaryHi?.toLowerCase().includes(q)) ||
        Boolean(item.summaryGu?.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8" id="news">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#17362C]/15 dark:border-white/10 pb-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#17362C] dark:bg-emerald-900 text-[#D9FF55] dark:text-emerald-300 text-xs font-black">
            <Newspaper className="w-3.5 h-3.5" />
            <span>
              {language === 'mr'
                ? 'कृषीसेतू बातम्या व कृषी सल्ला'
                : language === 'hi'
                ? 'कृषिसेतु समाचार और बाजार मार्गदर्शन'
                : language === 'gu'
                ? 'કૃષિસેતુ સમાચાર અને બજાર માર્ગદર્શન'
                : 'KrushiSetu News & Market Advisories'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black font-editorial tracking-tight text-[#132B23] dark:text-emerald-100">
            {language === 'mr'
              ? 'शासकीय योजना, हमीभाव आणि कृषी उत्पन्न बाजार समिती अपडेट्स'
              : language === 'hi'
              ? 'सरकारी योजनाएं, समर्थन मूल्य और मंडी भाव अपडेट्स'
              : language === 'gu'
              ? 'સરકારી યોજનાઓ, ટેકાના ભાવ અને બજાર અપડેટ્સ'
              : 'Government Schemes, MSP & Mandi Market Updates'}
          </h2>
          <p className="text-xs sm:text-sm text-[#132B23]/75 dark:text-emerald-200/70 max-w-2xl font-medium">
            {language === 'mr'
              ? 'महाराष्ट्र राज्य कृषी पणन मंडळ (MSAMB), कृषी विद्यापीठे आणि खरेदीदारांकडून ताजी माहिती.'
              : language === 'hi'
              ? 'महाराष्ट्र राज्य कृषि पणन बोर्ड (MSAMB), कृषि विश्वविद्यालयों और प्रमुख खरीदारों से ताज़ा समाचार।'
              : language === 'gu'
              ? 'મહારાષ્ટ્ર રાજ્ય કૃષિ બજાર બોર્ડ (MSAMB), એગ્રીકલ્ચર યુનિવર્સિટીઓ અને અગ્રણી ખરીદદારો તરફથી સમાચાર.'
              : 'Official updates from Maharashtra State Agricultural Marketing Board (MSAMB), agriculture universities, and verified buyers.'}
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#132B23]/50 dark:text-emerald-300/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'mr'
                ? 'बातम्या शोधा...'
                : language === 'hi'
                ? 'समाचार खोजें...'
                : language === 'gu'
                ? 'સમાચાર શોધો...'
                : 'Search news & advisories...'
            }
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white dark:bg-neutral-900 border border-[#17362C]/20 dark:border-white/10 text-xs font-bold text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#3F754A]"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setSelectedCategory(cat.key)}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === cat.key
                ? 'bg-[#17362C] dark:bg-emerald-600 text-[#D9FF55] dark:text-white shadow-md scale-105'
                : 'bg-white dark:bg-neutral-900 text-[#132B23] dark:text-neutral-300 border border-[#17362C]/15 dark:border-white/10 hover:bg-[#17362C]/10 dark:hover:bg-neutral-800'
            }`}
          >
            {getCategoryLabel(cat)}
          </button>
        ))}
      </div>

      {/* News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNews.map((item) => (
          <article
            key={item.id}
            onClick={() => setActiveArticle(item)}
            className="group bg-white dark:bg-neutral-900 rounded-3xl border border-[#17362C]/15 dark:border-white/10 shadow-sm hover:shadow-xl hover:border-[#3F754A] dark:hover:border-emerald-500 transition-all p-5 flex flex-col justify-between cursor-pointer space-y-4 relative overflow-hidden"
          >
            {item.isPinned && (
              <div className="absolute top-4 right-4 bg-[#D9FF55] dark:bg-emerald-500 text-[#17362C] dark:text-neutral-950 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <Pin className="w-3 h-3" />
                <span>
                  {language === 'mr'
                    ? 'महत्त्वाची सूचना'
                    : language === 'hi'
                    ? 'प्रमुख सूचना'
                    : language === 'gu'
                    ? 'મુખ્ય સૂચના'
                    : 'Pinned'}
                </span>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-[#17362C]/10 dark:bg-emerald-950 text-[#17362C] dark:text-emerald-300">
                  {getLocalizedCategory(item)}
                </span>
                <span className="text-[10px] text-[#132B23]/50 dark:text-neutral-400 flex items-center gap-1 font-bold">
                  <Calendar className="w-3 h-3" />
                  {new Date(item.publishedAt).toLocaleDateString(
                    language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : language === 'gu' ? 'gu-IN' : 'en-IN'
                  )}
                </span>
              </div>

              <h3 className="text-base font-black text-[#132B23] dark:text-neutral-100 group-hover:text-[#3F754A] dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                {getLocalizedTitle(item)}
              </h3>

              <p className="text-xs text-[#132B23]/75 dark:text-neutral-400 font-medium line-clamp-3 leading-relaxed">
                {getLocalizedSummary(item)}
              </p>
            </div>

            <div className="pt-3 border-t border-[#17362C]/10 dark:border-white/10 flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#132B23]/60 dark:text-neutral-400 truncate max-w-[180px]">
                {item.authorName || 'KrushiSetu Desk'}
              </span>

              <span className="inline-flex items-center gap-1 text-xs font-black text-[#3F754A] dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                <span>
                  {language === 'mr'
                    ? 'वाचा'
                    : language === 'hi'
                    ? 'पढ़ें'
                    : language === 'gu'
                    ? 'વાંચો'
                    : 'Read'}
                </span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </article>
        ))}
      </div>

      {/* Article Detail Modal */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-[#F6F1E4] dark:bg-neutral-900 text-[#132B23] dark:text-neutral-100 rounded-3xl shadow-2xl border border-[#17362C]/20 dark:border-white/10 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 bg-[#17362C] dark:bg-neutral-950 text-[#F6F1E4] flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#D9FF55] dark:text-emerald-300">
                <Newspaper className="w-4 h-4" />
                <span>{getLocalizedCategory(activeArticle)}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-[#D9FF55] dark:text-emerald-300 text-xs font-black cursor-pointer flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>{t('common.close', 'Close')}</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <h2 className="text-xl sm:text-2xl font-black font-editorial text-[#132B23] dark:text-neutral-100 leading-snug">
                {getLocalizedTitle(activeArticle)}
              </h2>

              <div className="flex items-center gap-3 text-xs text-[#132B23]/60 dark:text-neutral-400 font-bold pb-2 border-b border-[#17362C]/10 dark:border-white/10">
                <span>
                  {language === 'mr'
                    ? 'स्रोत:'
                    : language === 'hi'
                    ? 'स्रोत:'
                    : language === 'gu'
                    ? 'પ્રકાશક:'
                    : 'Source:'}{' '}
                  {activeArticle.authorName || 'MSAMB'}
                </span>
                <span>·</span>
                <span>
                  {new Date(activeArticle.publishedAt).toLocaleDateString(
                    language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : language === 'gu' ? 'gu-IN' : 'en-IN'
                  )}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#D9FF55]/20 dark:bg-emerald-950/60 border border-[#17362C]/15 dark:border-emerald-500/30 text-xs sm:text-sm font-bold text-[#132B23] dark:text-emerald-200 leading-relaxed">
                {getLocalizedSummary(activeArticle)}
              </div>

              <div className="text-xs sm:text-sm text-[#132B23]/80 dark:text-neutral-300 space-y-2 leading-relaxed">
                <p>{getLocalizedContent(activeArticle)}</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-neutral-800/80 border border-[#17362C]/10 dark:border-white/10 text-xs text-[#132B23]/70 dark:text-neutral-400">
                <span className="font-black text-[#132B23] dark:text-neutral-200">
                  {language === 'mr'
                    ? 'सूचना:'
                    : language === 'hi'
                    ? 'सूचना:'
                    : language === 'gu'
                    ? 'સૂચના:'
                    : 'Notice:'}
                </span>{' '}
                {language === 'mr'
                  ? 'सदर माहिती महाराष्ट्र राज्य कृषी पणन मंडळ (MSAMB) व कृषी विभागाच्या मार्गदर्शनाखाली शेतकरी व खरेदीदारांच्या हितासाठी प्रसिद्ध करण्यात आली आहे.'
                  : language === 'hi'
                  ? 'यह जानकारी महाराष्ट्र राज्य कृषि पणन बोर्ड (MSAMB) व कृषि विभाग के दिशा-निर्देशों के तहत किसान व खरीदारों के हितार्थ प्रसारित की गई है।'
                  : language === 'gu'
                  ? 'આ માહિતી મહારાષ્ટ્ર રાજ્ય કૃષિ બજાર બોર્ડ (MSAMB) ના માર્ગદર્શન હેઠળ ખેડૂતો અને ખરીદદારોના હિતાર્થે પ્રસારિત કરવામાં આવી છે.'
                  : 'This advisory is published under the guidance of Maharashtra State Agricultural Marketing Board (MSAMB) for the welfare of farmers and buyers.'}
              </div>
            </div>

            <div className="px-6 py-3 bg-[#E5DFD0] dark:bg-neutral-950 border-t border-[#17362C]/10 dark:border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="px-5 py-2 rounded-xl bg-[#17362C] dark:bg-emerald-600 text-[#D9FF55] dark:text-white text-xs font-black cursor-pointer shadow hover:bg-[#244E3E] dark:hover:bg-emerald-500"
              >
                {language === 'mr'
                  ? 'समजले'
                  : language === 'hi'
                  ? 'समझ आ गया'
                  : language === 'gu'
                  ? 'સમજાયું'
                  : 'Got It'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
