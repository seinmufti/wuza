import {
  AirVent,
  Droplets,
  Fan,
  Heater,
  Laptop,
  Lightbulb,
  Microwave,
  Plug,
  Refrigerator,
  Tv,
  WashingMachine,
  type LucideIcon,
} from 'lucide-react'

export type ApplianceIcon =
  | 'fridge'
  | 'ac'
  | 'tv'
  | 'light'
  | 'washer'
  | 'pump'
  | 'fan'
  | 'heater'
  | 'laptop'
  | 'microwave'
  | 'plug'

export const APPLIANCE_ICONS: Record<ApplianceIcon, LucideIcon> = {
  fridge: Refrigerator,
  ac: AirVent,
  tv: Tv,
  light: Lightbulb,
  washer: WashingMachine,
  pump: Droplets,
  fan: Fan,
  heater: Heater,
  laptop: Laptop,
  microwave: Microwave,
  plug: Plug,
}

// Typical running watts, start-up surge and a usual daily usage window (clock hours; `to` past 24 =
// runs past midnight). The name comes from the translations (presetNames) to match the language.
export const PRESETS: {
  icon: Exclude<ApplianceIcon, 'plug'>
  watts: number
  surge: number
  from: number
  to: number
}[] = [
  { icon: 'fridge', watts: 150, surge: 4, from: 0, to: 24 }, // always on
  { icon: 'ac', watts: 1500, surge: 3, from: 12, to: 20 }, // hot afternoon into evening
  { icon: 'tv', watts: 120, surge: 1, from: 18, to: 23 }, // evening
  { icon: 'light', watts: 10, surge: 1, from: 18, to: 24 }, // dusk to midnight
  { icon: 'washer', watts: 500, surge: 3, from: 10, to: 11.5 }, // one cycle
  { icon: 'pump', watts: 750, surge: 4, from: 7, to: 8 }, // filling the tank
  { icon: 'fan', watts: 75, surge: 2, from: 22, to: 30 }, // overnight, 10pm to 6am
  { icon: 'heater', watts: 2000, surge: 1, from: 19, to: 23 }, // winter evening
  { icon: 'laptop', watts: 65, surge: 1, from: 9, to: 17 }, // working day
  { icon: 'microwave', watts: 1000, surge: 2, from: 19, to: 19.5 }, // dinner
]
