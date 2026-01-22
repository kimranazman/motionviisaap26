export const INDUSTRY_PRESETS = [
  'Technology',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Education',
  'Government',
  'Media',
  'Energy',
  'Other',
] as const

export type Industry = (typeof INDUSTRY_PRESETS)[number]
