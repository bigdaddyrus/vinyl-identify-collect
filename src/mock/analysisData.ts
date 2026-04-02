import { AnalysisResult } from '@/types';

/**
 * Mock stamp analysis results for Phase 1 development
 * In production, this would come from an AI API
 */

export const mockAnalysisResults: AnalysisResult[] = [
  {
    id: 'mock-1',
    name: '1856 British Guiana One-Cent Magenta',
    artist: '',
    albumName: '1856 British Guiana One-Cent Magenta',
    pressingName: '',
    origin: 'British Guiana',
    year: '1856',
    estimatedValue: 9480000,
    estimatedValueLow: 8500000,
    estimatedValueHigh: 9500000,
    confidence: 92,
    rarity: 'Extremely Rare',
    description:
      'This is one of the rarest and most valuable stamps in the world. The British Guiana 1c magenta is the only major stamp missing from even the British Royal Collection.',
    createdAt: Date.now(),
    extendedDetails: [
      {
        title: 'Physical Analysis',
        icon: 'search',
        items: [
          { label: 'Printing Method', value: 'Typeset' },
          { label: 'Paper Type', value: 'Magenta-colored wove paper' },
          { label: 'Perforation Details', value: 'Imperforate, cut to shape' },
          { label: 'Color Description', value: 'Black on magenta surface-colored paper' },
          { label: 'Watermark Info', value: 'None detected' },
        ],
      },
      {
        title: 'Value Analysis',
        icon: 'cash',
        items: [
          { label: 'Market Value', value: '$9,480,000 USD' },
          { label: 'Auction History', value: 'Sold at Sotheby\'s 2014 for $9.48M' },
          { label: 'Price Factors', value: 'Unique specimen, provenance, historical significance' },
          { label: 'Investment Potential', value: 'Exceptional — sole known example' },
          { label: 'Grading Notes', value: 'VG condition for age, corners trimmed octagonally' },
        ],
      },
      {
        title: 'Historical Context',
        icon: 'book',
        items: [
          { label: 'Historical Significance', value: 'Issued during a stamp shortage when a shipment from London was delayed' },
          { label: 'Series', value: 'Local provisional issue' },
          { label: 'Denomination', value: '1 cent' },
          { label: 'Catalog Number', value: 'SG #23' },
        ],
      },
      {
        title: 'Collector Info',
        icon: 'people',
        items: [
          { label: 'Collection Tips', value: 'Museum-grade preservation required. Climate-controlled storage essential.' },
          { label: 'Related Stamps', value: 'British Guiana 4c magenta (1856), also extremely rare' },
          { label: 'Provenance', value: 'Discovered in 1873 by a schoolboy in British Guiana' },
        ],
      },
      {
        title: 'Authentication',
        icon: 'shield-checkmark',
        items: [
          { label: 'Authenticity Indicators', value: 'Ship design, initials of postal clerk, characteristic shape' },
          { label: 'Expert Verification', value: 'Authenticated by Royal Philatelic Society London' },
          { label: 'Condition Grading', value: 'VG (Very Good) — expected wear for 168-year-old specimen' },
        ],
      },
    ],
  },
  {
    id: 'mock-2',
    name: '1918 Inverted Jenny',
    artist: '',
    albumName: '1918 Inverted Jenny',
    pressingName: '',
    origin: 'United States',
    year: '1918',
    estimatedValue: 1350000,
    estimatedValueLow: 1100000,
    estimatedValueHigh: 1600000,
    confidence: 88,
    rarity: 'Very Rare',
    description:
      'The Inverted Jenny is a famous US postage stamp error issued in 1918. The stamp features a Curtiss JN-4 biplane printed upside down relative to the border frame.',
    createdAt: Date.now(),
    extendedDetails: [
      {
        title: 'Physical Analysis',
        icon: 'search',
        items: [
          { label: 'Printing Method', value: 'Flat plate, two-color intaglio' },
          { label: 'Paper Type', value: 'Unwatermarked wove paper' },
          { label: 'Perforation Details', value: 'Perf 11' },
          { label: 'Color Description', value: 'Carmine rose and blue, center inverted' },
          { label: 'Watermark Info', value: 'None' },
        ],
      },
      {
        title: 'Value Analysis',
        icon: 'cash',
        items: [
          { label: 'Market Value', value: '$1,350,000 USD' },
          { label: 'Auction History', value: 'Regular auction appearances since 1918' },
          { label: 'Price Factors', value: 'Position on sheet, centering, gum condition' },
          { label: 'Investment Potential', value: 'Strong — consistent appreciation over decades' },
          { label: 'Grading Notes', value: 'Fine to Very Fine centering typical' },
        ],
      },
      {
        title: 'Historical Context',
        icon: 'book',
        items: [
          { label: 'Historical Significance', value: 'Most famous US stamp error, purchased by William T. Robey' },
          { label: 'Series', value: 'US Airmail Issue' },
          { label: 'Denomination', value: '24 cents' },
          { label: 'Catalog Number', value: 'Scott #C3a' },
        ],
      },
      {
        title: 'Authentication',
        icon: 'shield-checkmark',
        items: [
          { label: 'Authenticity Indicators', value: 'Plate characteristics, paper fluorescence, ink analysis' },
          { label: 'Expert Verification', value: 'Philatelic Foundation certification recommended' },
          { label: 'Condition Grading', value: 'F-VF (Fine to Very Fine) — typical centering for this issue' },
        ],
      },
    ],
  },
  {
    id: 'mock-3',
    name: '1869 Pictorial 24¢ Invert',
    artist: '',
    albumName: '1869 Pictorial 24¢ Invert',
    pressingName: '',
    origin: 'United States',
    year: '1869',
    estimatedValue: 125000,
    estimatedValueLow: 95000,
    estimatedValueHigh: 150000,
    confidence: 85,
    rarity: 'Rare',
    description:
      'Part of the 1869 Pictorial Issue series, this stamp features an inverted center showing the Declaration of Independence signing.',
    createdAt: Date.now(),
    extendedDetails: [
      {
        title: 'Physical Analysis',
        icon: 'search',
        items: [
          { label: 'Printing Method', value: 'Two-color letterpress' },
          { label: 'Paper Type', value: 'Hard white wove paper' },
          { label: 'Perforation Details', value: 'Perf 12' },
          { label: 'Color Description', value: 'Green and violet, center inverted' },
          { label: 'Watermark Info', value: 'None detected' },
        ],
      },
      {
        title: 'Value Analysis',
        icon: 'cash',
        items: [
          { label: 'Market Value', value: '$125,000 USD' },
          { label: 'Auction History', value: 'Scarce at auction, fewer than 12 known' },
          { label: 'Price Factors', value: 'Centering, color freshness, cancel type' },
          { label: 'Investment Potential', value: 'Very strong — extreme scarcity drives value' },
        ],
      },
      {
        title: 'Historical Context',
        icon: 'book',
        items: [
          { label: 'Historical Significance', value: 'First US pictorial stamp series with inverted error' },
          { label: 'Series', value: '1869 Pictorial Issue' },
          { label: 'Denomination', value: '24 cents' },
          { label: 'Catalog Number', value: 'Scott #120b' },
        ],
      },
      {
        title: 'Authentication',
        icon: 'shield-checkmark',
        items: [
          { label: 'Authenticity Indicators', value: 'Grill pattern, paper characteristics, ink composition' },
          { label: 'Expert Verification', value: 'PSE or PF certification essential' },
          { label: 'Condition Grading', value: 'Good — typical aging and minor roughness' },
        ],
      },
    ],
  },
];

/**
 * Returns a random mock result for development
 */
export const getRandomMockResult = (): AnalysisResult => {
  const randomIndex = Math.floor(Math.random() * mockAnalysisResults.length);
  return {
    ...mockAnalysisResults[randomIndex],
    id: `mock-${Date.now()}-${randomIndex}`,
    createdAt: Date.now(),
  };
};
