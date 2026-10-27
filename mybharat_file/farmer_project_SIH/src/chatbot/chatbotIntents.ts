import type { Language } from '../types';

export type ChatbotIntentType =
  | 'welcome'
  | 'sell_produce'
  | 'check_prices'
  | 'find_buyers'
  | 'net_payout'
  | 'transport'
  | 'storage'
  | 'payment_escrow'
  | 'track_orders'
  | 'complaint_grievance'
  | 'units_quantity'
  | 'change_language'
  | 'general_help'
  | 'fallback';

export interface IntentMatchResult {
  intent: ChatbotIntentType;
  confidence: number;
}

// Multilingual keyword synonym rules
const INTENT_PATTERNS: Record<ChatbotIntentType, Record<Language, string[]>> = {
  welcome: {
    en: ['hello', 'hi', 'namaste', 'hey', 'start', 'begin', 'howdy'],
    hi: ['नमस्ते', 'नमस्कार', 'प्रणाम', 'हेलो', 'हाय', 'शुरू'],
    gu: ['નમસ્તે', 'નમસ્કાર', 'હેલો', 'જય શ્રી કૃષ્ણ', 'શરૂ', 'કેમ છો'],
    mr: ['नमस्कार', 'नमस्ते', 'हॅलो', 'सुरुवात', 'हाय', 'राम राम'],
  },
  sell_produce: {
    en: ['sell', 'listing', 'create lot', 'list harvest', 'offer crop', 'post produce', 'sell produce', 'how to sell', 'add crop'],
    hi: ['बेचना', 'उपज बेचना', 'फसल बेचना', 'लॉट बनाना', 'बिक्री', 'कैसे बेचें', 'फसल जोड़ें', 'लिस्ट'],
    gu: ['વેચવું', 'ઉપજ વેચવી', 'પાક વેચવો', 'લોટ બનાવવો', 'વેચાણ નોંધણી', 'કેવી રીતે વેચવું', 'પાક ઉમેરો'],
    mr: ['विक्री', 'माल विकणे', 'पीक विकणे', 'लॉट तयार करा', 'नोंदणी', 'कसे विकावे', 'पीक जोडा'],
  },
  check_prices: {
    en: ['price', 'rate', 'mandi rate', 'market price', 'today price', 'today rates', 'apmc rate', 'crop price', 'bhav'],
    hi: ['भाव', 'दाम', 'मंडी भाव', 'आज का भाव', 'रेट', 'कीमत', 'बाजार भाव', 'फसल का भाव'],
    gu: ['ભાવ', 'આજના ભાવ', 'બજાર ભાવ', 'મંડી ભાવ', 'દર', 'કિંમત', 'પાકના ભાવ'],
    mr: ['भाव', 'बाजारभाव', 'आजचे भाव', 'मंडी दर', 'हमीभाव', 'दर', 'किंमत', 'पिकाचे भाव'],
  },
  find_buyers: {
    en: ['buyer', 'corporate buyer', 'food processor', 'exporter', 'who will buy', 'find buyer', 'direct buyer', 'contract'],
    hi: ['खरीदार', 'व्यापारी', 'कंपनी', 'कॉरपोरेट', 'कौन खरीदेगा', 'खरीदार खोजें', 'अनुबंध'],
    gu: ['ખરીદદાર', 'વેપારી', 'કંપની', 'કોર્પોરેટ', 'કોણ ખરીદશે', 'ખરીદદાર શોધો', 'કોન્ટ્રાક્ટ'],
    mr: ['खरेदीदार', 'व्यापारी', 'कंपनी', 'कॉर्पोरेट', 'कोण खरेदी करेल', 'खरेदीदार शोधा', 'करार'],
  },
  net_payout: {
    en: ['net payout', 'how calculated', 'deduction', 'cess', 'final amount', 'in bank', 'realization', 'profit', 'surplus'],
    hi: ['अंतिम भुगतान', 'नेट भुगतान', 'कटौती', 'खाते में कितना', 'गणना', 'कमीशन', 'मुनाफा'],
    gu: ['ચોખ્ખી રકમ', 'અંતિમ ચુકવણી', 'કપાત', 'ખાતામાં કેટલા', 'ગણતરી', 'કમિશન', 'નફો'],
    mr: ['निव्वळ रक्कम', 'अंतिम पेमेंट', 'कपात', 'खात्यात किती जमा होणार', 'हिशोब', 'नफा', 'कमिशन'],
  },
  transport: {
    en: ['transport', 'vehicle', 'truck', 'pickup', 'freight', 'pooled logistics', 'logistics', 'tempo', 'delivery'],
    hi: ['परिवहन', 'गाड़ी', 'ट्रक', 'भाड़ा', 'पिकअप', 'वाहन', 'ढुलाई', 'लॉजिस्टिक्स'],
    gu: ['પરિવહન', 'વાહન', 'ટ્રક', 'ભાડું', 'પિકઅપ', 'ગાડી', 'વાહન બુકિંગ', 'શેરિંગ વાહન'],
    mr: ['वाहतूक', 'गाडी', 'ट्रक', 'भाडे', 'पिकअप', 'वाहन', 'लॉजिस्टिक्स', 'टेम्पो'],
  },
  storage: {
    en: ['storage', 'cold storage', 'warehouse', 'wdra', 'hold crop', 'delay sale', 'store onions', 'godown'],
    hi: ['गोदाम', 'कोल्ड स्टोरेज', 'भंडारण', 'रखना', 'रोक कर बेचना', 'वेयरहाउस'],
    gu: ['સંગ્રહ', 'કોલ્ડ સ્ટોરેજ', 'ગોડાઉન', 'સાચવવું', 'રોકીને વેચવું', 'વેરહાઉસ'],
    mr: ['साठवणूक', 'कोल्ड स्टोरेज', 'गोदाम', 'ठेवणे', 'रोखून धरणे', 'वेअरहाऊस'],
  },
  payment_escrow: {
    en: ['payment', 'escrow', 'money in bank', 'when get money', 'safe payment', 'bank transfer', 'guarantee', 'upi'],
    hi: ['भुगतान', 'पैसा कब मिलेगा', 'एस्क्रो', 'बैंक खाता', 'सुरक्षित भुगतान', 'पेमेंट'],
    gu: ['ચુકવણી', 'પૈસા ક્યારે મળશે', 'એસ્ક્રો', 'બેંક ખાતું', 'સુરક્ષિત પેમેન્ટ', 'પેમેન્ટ'],
    mr: ['पेमेंट', 'पैसे कधी मिळणार', 'एस्क्रो', 'बँक खाते', 'सुरक्षित पेमेंट', 'बँक खात्यात'],
  },
  track_orders: {
    en: ['track', 'order status', 'status', 'lot status', 'where is truck', 'dispatch'],
    hi: ['ट्रैक', 'स्थिति', 'ऑर्डर की स्थिति', 'ट्रक कहाँ है', 'डिस्पैच'],
    gu: ['ટ્રેક', 'સ્થિતિ', 'ઓર્ડર સ્થિતિ', 'ટ્રક ક્યાં છે', 'ડિસ્પેચ'],
    mr: ['ट्रॅक', 'ऑर्डर स्थिती', 'स्थिती', 'ट्रक कुठे आहे', 'डिसपॅच'],
  },
  complaint_grievance: {
    en: ['complaint', 'grievance', 'dispute', 'cheat', 'fraud', 'weighment issue', 'delay', 'sla', 'arbitration', 'helpdesk'],
    hi: ['शिकायत', 'विवाद', 'धोखा', 'तौल में गड़बड़ी', 'समस्या', 'हेल्पडेस्क', 'निवारण'],
    gu: ['ફરિયાદ', 'વિવાદ', 'છેતરપિંડી', 'તોલાઈમાં તફાવત', 'સમસ્યા', 'સહાય કેન્દ્ર', 'નિવારણ'],
    mr: ['तक्रार', 'वाद', 'फसवणूक', 'वजनात गडबड', 'समस्या', 'हेल्पडेस्क', 'निवारण'],
  },
  units_quantity: {
    en: ['unit', 'kg', 'tonne', 'quintal', 'convert', 'how many kg', 'metric ton', 'quantity'],
    hi: ['इकाई', 'किग्रा', 'टन', 'क्विंटल', 'किलो', 'कितना किलो', 'मात्रा'],
    gu: ['એકમ', 'કિગ્રા', 'ટન', 'ક્વિન્ટલ', 'કિલો', 'કેટલા કિલો', 'જથ્થો'],
    mr: ['एकक', 'किलो', 'टन', 'क्विंटल', 'रूपांतर', 'किती किलो', 'प्रमाण'],
  },
  change_language: {
    en: ['language', 'hindi', 'gujarati', 'marathi', 'english', 'change language', 'speak gujarati', 'speak hindi'],
    hi: ['भाषा', 'हिंदी', 'गुजराती', 'मराठी', 'अंग्रेजी', 'भाषा बदलें'],
    gu: ['ભાષા', 'હિન્દી', 'ગુજરાતી', 'મરાઠી', 'અંગ્રેજી', 'ભાષા બદલો'],
    mr: ['भाषा', 'मराठी', 'हिंदी', 'गुजराती', 'इंग्रजी', 'भाषा बदला'],
  },
  general_help: {
    en: ['help', 'what can you do', 'support', 'guide', 'call helpline', 'features'],
    hi: ['मदद', 'सहायता', 'हेल्पलाइन', 'आप क्या कर सकते हैं', 'जानकारी'],
    gu: ['મદદ', 'સહાય', 'હેલ્પલાઇન', 'તમે શું કરી શકો છો', 'માહિતી'],
    mr: ['मदत', 'साहाय्य', 'हेल्पलाइन', 'तुम्ही काय करू शकता', 'माहिती'],
  },
  fallback: {
    en: [],
    hi: [],
    gu: [],
    mr: [],
  },
};

/**
 * Multilingual match with typo and token overlap tolerance
 */
export function matchUserIntent(userInput: string, language: Language): IntentMatchResult {
  const normalized = userInput.toLowerCase().trim();
  if (!normalized) {
    return { intent: 'welcome', confidence: 1 };
  }

  let bestIntent: ChatbotIntentType = 'fallback';
  let highestScore = 0;

  const intents = Object.keys(INTENT_PATTERNS) as ChatbotIntentType[];

  for (const intent of intents) {
    if (intent === 'fallback') continue;

    const langPatterns = INTENT_PATTERNS[intent][language] || [];
    const allPatterns = [
      ...langPatterns,
      ...INTENT_PATTERNS[intent].en,
      ...INTENT_PATTERNS[intent].hi,
      ...INTENT_PATTERNS[intent].gu,
      ...INTENT_PATTERNS[intent].mr,
    ];

    for (const pattern of allPatterns) {
      const pat = pattern.toLowerCase();
      // Exact match
      if (normalized === pat) {
        return { intent, confidence: 1.0 };
      }
      // Substring match
      if (normalized.includes(pat)) {
        const score = pat.length / normalized.length + 0.4;
        if (score > highestScore) {
          highestScore = score;
          bestIntent = intent;
        }
      }
    }
  }

  if (highestScore >= 0.3) {
    return { intent: bestIntent, confidence: highestScore };
  }

  return { intent: 'fallback', confidence: 0 };
}
