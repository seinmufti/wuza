import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { load, save } from '@/lib/storage'
import { clockParts, formatClock, formatHours } from '@/lib/time'

export type Language = 'ar' | 'ckb' | 'en'

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'ar', label: 'العربية' },
  { code: 'ckb', label: 'کوردی' },
  { code: 'en', label: 'English' },
]

const RTL: Language[] = ['ar', 'ckb']

// Short clock and duration markers per language. Units like kW/kWh/W stay Latin everywhere.
const TIME_UNITS: Record<Language, { am: string; pm: string; h: string; m: string }> = {
  en: { am: 'am', pm: 'pm', h: 'h', m: 'm' },
  ar: { am: 'ص', pm: 'م', h: 'س', m: 'د' },
  ckb: { am: 'پ.ن', pm: 'د.ن', h: 'ک', m: 'خ' },
}

const en = {
  dailyNeed: 'Daily Need',
  peakLoad: 'Peak load',
  solar: 'Solar',
  inverter: 'Inverter',
  battery: 'Battery',
  panels: (n: number) => `${n} panels`,

  locationDaylight: 'Location & daylight',
  setLocation: 'Set location',
  clearLocation: 'Clear location',
  resetTimes: 'Reset times',
  peakSunH: 'peak sun h',
  cityOrTown: 'City or town',
  useMyLocation: 'Use my location',
  currentLocation: 'Current location',
  loading: 'Loading...',
  errSunData: 'Could not load sun data for that place.',
  errNoPlaces: 'No places found.',
  errSearch: 'Search failed. Check your connection.',
  errNoGeo: 'Location not available on this device.',
  errGeoDenied: 'Location permission denied.',
  ofDaylight: (d: string) => `${d} of daylight`,

  equipmentDetails: 'Equipment details',
  wPanels: (w: number) => `${w} W panels`,
  panelW: 'Panel (W)',
  panelWInfo: 'Rated power of one solar panel you plan to buy. Used to count how many panels you need.',
  derate: 'Derate (%)',
  derateInfo:
    "How much of a panel's rated power you really get after heat, dust, shading and wiring losses. 75% is typical.",
  usable: 'Usable (%)',
  usableInfo: 'How much of the battery you can safely drain each night (depth of discharge). Lithium is about 90%.',
  efficiency: 'Efficiency (%)',
  batteryEffInfo: 'Energy you get back out of the battery compared to what you put in. Lithium is about 95%.',
  inverterEffInfo: 'How much of the DC power from panels and battery comes out as usable AC power. Usually 90-95%.',
  margin: 'Margin (x)',
  marginInfo:
    'Extra headroom so the inverter never runs at its limit. 1.25 means 25% bigger than all your appliances together.',
  surge: 'Surge (x)',
  surgeInfo:
    'Start-up power as a multiple of running watts. Leave at 1 for lights, TVs and heaters. Fridges, ACs and pumps pull 3-5x for a moment when starting.',
  resetDefaults: 'Reset to defaults',
  moreInfo: 'More info',

  yourAppliances: 'Your appliances',
  add: 'Add',
  emptyTitle: 'Tap to add your first appliance',
  emptyHint: 'fridge, heater, lights, TV...',
  unnamed: 'Unnamed',
  allDay: 'All day',
  off: 'Off',
  namePlaceholder: 'Name (e.g. Fridge)',
  power: 'Power (watts)',
  quantity: 'Quantity',
  runsFrom: 'Runs from',
  overnight: 'Overnight Toggle',
  remove: 'Remove',
  delete: 'Delete',
  deleteAppliance: 'Delete appliance',
  language: 'Language',
  chooseAppliance: 'Add an appliance',
  day: 'Day',
  night: 'Night',
  deleteAll: 'Delete all appliances',
  deleteAllConfirm: (n: number) => `Delete all ${n} appliances? This can't be undone.`,
  other: 'Other',
  otherHint: 'Name it yourself',
  surgeShort: 'surge',
  presetNames: {
    fridge: 'Fridge',
    ac: 'Air conditioner',
    tv: 'TV',
    light: 'LED light',
    washer: 'Washing machine',
    pump: 'Water pump',
    fan: 'Fan',
    heater: 'Electric heater',
    laptop: 'Laptop',
    microwave: 'Microwave',
  } as Record<string, string>,
}

export type Strings = typeof en

const ar: Strings = {
  dailyNeed: 'الاحتياج اليومي',
  peakLoad: 'أعلى حمل',
  solar: 'ألواح شمسية',
  inverter: 'الإنفرتر',
  battery: 'البطارية',
  panels: (n) => `${n} ألواح`,

  locationDaylight: 'الموقع وضوء النهار',
  setLocation: 'تحديد الموقع',
  clearLocation: 'مسح الموقع',
  resetTimes: 'إعادة الأوقات',
  peakSunH: 'ساعة ذروة شمسية',
  cityOrTown: 'مدينة أو بلدة',
  useMyLocation: 'استخدم موقعي',
  currentLocation: 'الموقع الحالي',
  loading: 'جارٍ التحميل...',
  errSunData: 'تعذّر تحميل بيانات الشمس لهذا المكان.',
  errNoPlaces: 'لم يتم العثور على أماكن.',
  errSearch: 'فشل البحث. تحقق من الاتصال.',
  errNoGeo: 'الموقع غير متاح على هذا الجهاز.',
  errGeoDenied: 'تم رفض إذن الموقع.',
  ofDaylight: (d) => `${d} من ضوء النهار`,

  equipmentDetails: 'تفاصيل المعدات',
  wPanels: (w) => `ألواح ${w} واط`,
  panelW: 'اللوح (واط)',
  panelWInfo: 'القدرة الاسمية للوح شمسي واحد تنوي شراءه. تُستخدم لحساب عدد الألواح التي تحتاجها.',
  derate: 'معامل الفقد (%)',
  derateInfo: 'النسبة التي تحصل عليها فعلاً من قدرة اللوح بعد خسائر الحرارة والغبار والظل والأسلاك. 75% هي النسبة المعتادة.',
  usable: 'القابل للاستخدام (%)',
  usableInfo: 'كم يمكنك تفريغ البطارية بأمان كل ليلة (عمق التفريغ). الليثيوم حوالي 90%.',
  efficiency: 'الكفاءة (%)',
  batteryEffInfo: 'الطاقة التي تستعيدها من البطارية مقارنة بما تشحنه فيها. الليثيوم حوالي 95%.',
  inverterEffInfo: 'كم من الكهرباء المستمرة القادمة من الألواح والبطارية تخرج كهرباء متناوبة قابلة للاستخدام. عادةً 90-95%.',
  margin: 'الهامش (×)',
  marginInfo: 'هامش إضافي حتى لا يعمل الإنفرتر عند أقصى حده. 1.25 يعني أكبر بـ25% من مجموع أجهزتك.',
  surge: 'تيار البدء (×)',
  surgeInfo: 'قدرة البدء كمضاعف للقدرة أثناء التشغيل. اتركها 1 للإنارة والتلفاز والمدافئ. الثلاجات والمكيفات والمضخات تسحب 3-5 أضعاف لحظة التشغيل.',
  resetDefaults: 'إعادة الإعدادات الافتراضية',
  moreInfo: 'معلومات إضافية',

  yourAppliances: 'أجهزتك',
  add: 'إضافة',
  emptyTitle: 'اضغط لإضافة أول جهاز',
  emptyHint: 'ثلاجة، مدفأة، إنارة، تلفاز...',
  unnamed: 'بدون اسم',
  allDay: 'طوال اليوم',
  off: 'متوقف',
  namePlaceholder: 'الاسم (مثلاً ثلاجة)',
  power: 'القدرة (واط)',
  quantity: 'الكمية',
  runsFrom: 'يعمل من',
  overnight: 'تشغيل ليلي',
  remove: 'حذف',
  delete: 'حذف',
  deleteAppliance: 'حذف الجهاز',
  language: 'اللغة',
  chooseAppliance: 'إضافة جهاز',
  day: 'النهار',
  night: 'الليل',
  deleteAll: 'حذف كل الأجهزة',
  deleteAllConfirm: (n) => `حذف كل الأجهزة (${n})؟ لا يمكن التراجع عن ذلك.`,
  other: 'أخرى',
  otherHint: 'سمّه بنفسك',
  surgeShort: 'تيار البدء',
  presetNames: {
    fridge: 'ثلاجة',
    ac: 'مكيف هواء',
    tv: 'تلفاز',
    light: 'مصباح LED',
    washer: 'غسالة',
    pump: 'مضخة ماء',
    fan: 'مروحة',
    heater: 'مدفأة كهربائية',
    laptop: 'حاسوب محمول',
    microwave: 'مايكروويف',
  },
}

const ckb: Strings = {
  dailyNeed: 'پێویستی ڕۆژانە',
  peakLoad: 'زۆرترین بار',
  solar: 'پانێڵی خۆر',
  inverter: 'ئینڤێرتەر',
  battery: 'پاتری',
  panels: (n) => `${n} پانێڵ`,

  locationDaylight: 'شوێن و ڕووناکی ڕۆژ',
  setLocation: 'دیاریکردنی شوێن',
  clearLocation: 'سڕینەوەی شوێن',
  resetTimes: 'گەڕاندنەوەی کاتەکان',
  peakSunH: 'کاتژمێری خۆری تەواو',
  cityOrTown: 'شار یان شارۆچکە',
  useMyLocation: 'شوێنی من بەکاربهێنە',
  currentLocation: 'شوێنی ئێستا',
  loading: 'بارکردن...',
  errSunData: 'نەتوانرا زانیاری خۆر بۆ ئەو شوێنە باربکرێت.',
  errNoPlaces: 'هیچ شوێنێک نەدۆزرایەوە.',
  errSearch: 'گەڕان سەرکەوتوو نەبوو. پەیوەندییەکەت بپشکنە.',
  errNoGeo: 'شوێن لەم ئامێرەدا بەردەست نییە.',
  errGeoDenied: 'ڕێگەپێدانی شوێن ڕەتکرایەوە.',
  ofDaylight: (d) => `${d} ڕووناکی ڕۆژ`,

  equipmentDetails: 'وردەکاری ئامێرەکان',
  wPanels: (w) => `پانێڵی ${w} وات`,
  panelW: 'پانێڵ (وات)',
  panelWInfo: 'توانای یەک پانێڵی خۆر کە دەتەوێت بیکڕیت. بۆ ژماردنی ئەو پانێڵانەی پێویستتە بەکاردێت.',
  derate: 'ڕێژەی کەمبوونەوە (%)',
  derateInfo: 'چەندە لە توانای پانێڵەکە بەڕاستی وەردەگریت دوای لەدەستدانی گەرما، تۆز، سێبەر و وایەر. 75% ئاساییە.',
  usable: 'بەکارهاتوو (%)',
  usableInfo: 'چەندە دەتوانیت پاتریەکە هەموو شەوێک بە سەلامەتی بەتاڵ بکەیت. لیسیۆم نزیکەی 90%.',
  efficiency: 'کارایی (%)',
  batteryEffInfo: 'ئەو وزەیەی لە پاتریەکە وەریدەگریتەوە بەراورد بەوەی تێیدەکەیت. لیسیۆم نزیکەی 95%.',
  inverterEffInfo: 'چەندە لە کارەبای DC ی پانێڵ و پاتری دەبێتە کارەبای AC ی بەکارهاتوو. زۆرجار 90-95%.',
  margin: 'پەراوێز (×)',
  marginInfo: 'جێگەی زیادە تا ئینڤێرتەرەکە هەرگیز لە سنووری خۆیدا کار نەکات. 1.25 واتە 25% گەورەتر لە کۆی ئامێرەکانت.',
  surge: 'هێزی دەستپێکردن (×)',
  surgeInfo: 'توانای دەستپێکردن وەک چەند هێندەی توانای کارکردن. بۆ گڵۆپ، تەلەفزیۆن و هیتەر بیهێڵەرەوە 1. سەلاجە، سپلیت و پەمپ لە دەستپێکردندا 3-5 هێندە ڕادەکێشن.',
  resetDefaults: 'گەڕاندنەوە بۆ بنەڕەت',
  moreInfo: 'زانیاری زیاتر',

  yourAppliances: 'ئامێرەکانت',
  add: 'زیادکردن',
  emptyTitle: 'کرتە بکە بۆ زیادکردنی یەکەم ئامێر',
  emptyHint: 'سەلاجە، هیتەر، گڵۆپ، تەلەفزیۆن...',
  unnamed: 'بێ ناو',
  allDay: 'هەموو ڕۆژ',
  off: 'کوژاوە',
  namePlaceholder: 'ناو (بۆ نموونە سەلاجە)',
  power: 'توانا (وات)',
  quantity: 'ژمارە',
  runsFrom: 'کاردەکات لە',
  overnight: 'دۆخی شەو',
  remove: 'لابردن',
  delete: 'سڕینەوە',
  deleteAppliance: 'سڕینەوەی ئامێر',
  language: 'زمان',
  chooseAppliance: 'زیادکردنی ئامێر',
  day: 'ڕۆژ',
  night: 'شەو',
  deleteAll: 'سڕینەوەی هەموو ئامێرەکان',
  deleteAllConfirm: (n) => `هەموو ئامێرەکان (${n}) بسڕدرێنەوە؟ ناگەڕێتەوە.`,
  other: 'تر',
  otherHint: 'خۆت ناوی لێبنێ',
  surgeShort: 'هێزی دەستپێکردن',
  presetNames: {
    fridge: 'سەلاجە',
    ac: 'سپلیت',
    tv: 'تەلەفزیۆن',
    light: 'گڵۆپی LED',
    washer: 'جلشۆر',
    pump: 'پەمپی ئاو',
    fan: 'پانکە',
    heater: 'هیتەری کارەبا',
    laptop: 'لاپتۆپ',
    microwave: 'مایکرۆوەیڤ',
  },
}

const STRINGS: Record<Language, Strings> = { en, ar, ckb }

type I18n = {
  lang: Language
  setLang: (l: Language) => void
  t: Strings
  dir: 'ltr' | 'rtl'
  /** 12-hour clock in the current language, e.g. 6:30pm / 6:30م */
  clock: (h: number, withMinutes?: boolean) => string
  clockParts: (h: number) => { time: string; suffix: string }
  /** Duration like 1h 55m / 1س 55د */
  hours: (h: number) => string
}

const I18nContext = createContext<I18n | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const code = load('wuza.language', { code: 'en' as Language }).code
    return code in STRINGS ? code : 'en'
  })
  const dir = RTL.includes(lang) ? 'rtl' : 'ltr'

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [lang, dir])

  const value = useMemo<I18n>(() => {
    const u = TIME_UNITS[lang]
    // Wrap Arabic/Kurdish times in a right-to-left isolate (RLI…PDI) so "10س 5د" keeps its
    // order even inside left-to-right rows like the day/night bar labels.
    const iso = dir === 'rtl' ? (s: string) => `⁧${s}⁩` : (s: string) => s
    return {
      lang,
      setLang: (l) => {
        setLangState(l)
        save('wuza.language', { code: l })
      },
      t: STRINGS[lang],
      dir,
      clock: (h, withMinutes = false) => iso(formatClock(h, withMinutes, u)),
      clockParts: (h) => clockParts(h, u),
      hours: (h) => iso(formatHours(h, u)),
    }
  }, [lang, dir])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}
