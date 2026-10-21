import type { SavedHome, SavedRoi } from '@/components/Saved'

// Built-in setups always shown on the Saved page (they can be loaded but not deleted).
// `name` is a translation key.

export const PRESET_HOME: SavedHome[] = [
  {
    id: 'preset-family4',
    name: 'familyOf4',
    savedAt: 0,
    items: [
      { id: 'p-tv', name: 'TV', icon: 'tv', watts: 120, qty: 1, surge: 1, from: 8.5, to: 24 },
      { id: 'p-fridge', name: 'Fridge', icon: 'fridge', watts: 150, qty: 1, surge: 4, from: 0, to: 24 },
      { id: 'p-laptop', name: 'Laptop', icon: 'laptop', watts: 65, qty: 1, surge: 1, from: 13, to: 23.25 },
      { id: 'p-washer', name: 'Washing machine', icon: 'washer', watts: 500, qty: 1, surge: 3, from: 10, to: 11.5 },
      { id: 'p-light', name: 'LED light', icon: 'light', watts: 10, qty: 24, surge: 1, from: 18, to: 24 },
      { id: 'p-pump', name: 'Water pump', icon: 'pump', watts: 750, qty: 1, surge: 4, from: 7, to: 8 },
    ],
    settings: {
      sunrise: 6,
      sunset: 18,
      location: null,
      panelWatts: 640,
      panelLength: 2.382,
      panelWidth: 1.134,
      dod: 0.9,
      batteryEff: 0.95,
      inverterEff: 0.92,
      derate: 0.75,
      safetyMargin: 1.25,
      pvRatio: 1.3,
      volts: 220,
    },
  },
]

export const PRESET_ROI: SavedRoi[] = [
  {
    id: 'preset-market',
    name: 'averageMarket',
    savedAt: 0,
    roi: {
      panelWatts: null,
      panelCount: null,
      panelPrice: 500,
      inverterKw: null,
      inverterPrice: 75,
      batteryKwh: null,
      batteryPrice: 300,
      kwhPrice: 72,
      monthKwh: null,
      usdRate: null,
    },
  },
]
