export enum ColorClass {
  Black = 'black',
  // Neutrals. ( add suffix according to the use e.g - '-txt', '-border')
  Neutral50 = 'neutral-50',
  Neutral100 = 'neutral-100',
  Neutral200 = 'neutral-200',
  Neutral250 = 'neutral-250',
  Neutral300 = 'neutral-300',
  // Primary. ( add suffix according to the use e.g - '-txt', '-border')
  Primary100 = 'primary-100',
  Primary200 = 'primary-200',
  Primary300 = 'primary-300',
  Primary400 = 'primary-400',
  Primary500 = 'primary-500',
  Primary600 = 'primary-600',
  Primary700 = 'primary-700',
  Primary800 = 'primary-800',
  // Accents.
  AccentPurple = 'accent-purple-500',
  AccentPrimary = 'accent-primary-500',
  AccentArchive = 'accent-archive-500',
  AccentSuccess = 'accent-success-500',
  AccentSuccess200 = 'accent-success-200',
  AccentWarning = 'accent-warning-500',
  AccentError = 'accent-error-500',
  // Red.
  Red100 = 'red-100',
  Red500 = 'red-500',
  // White.
  White = 'white',
  // Grays.
  Gray100 = 'gray-100',
  Gray200 = 'gray-200',
  Gray300 = 'gray-300',
  Gray350 = 'gray-350',
  Gray400 = 'gray-400',
  Gray500 = 'gray-500',
  Gray600 = 'gray-600',
  Gray700 = 'gray-700',
  Gray800 = 'gray-800',
  Gray850 = 'gray-850',
  Gray900 = 'gray-900',

  // Others.
  Teal500 = 'teal-500',
}

export enum ColorCodes {
  Neutral25 = '#f6f6f6',
  Neutral50 = '#efefef',
  Neutral100 = '#eceff1',
  Neutral150 = '#d9d9d9',
  Neutral200 = '#b0bec5',
  Neutral250 = '#7d98a6',
  Neutral300 = '#607d8b',
  Neutral400 = '#455a64',
  Primary200 = '#EFF8FF',
  Primary400 = '#63a2d8',
  Primary500 = '#3183c8',
  Primary600 = '#2368A2',
  Red200 = '#f5aaaa',
  Red300 = '#e46464',
  Red500 = '#dc3030',
  White = '#ffffff',
  Black = '#000000',
  GreenPolygon = '#259D58',
  OrangeLine = '#D68800',
  MapBackground = '#1e1e1e',
  DefaultAccessTagColor = '#82A7B7',
  PurpleAccent100 = '#DFD1FA',
  PurpleAccent500 = '#5E1AE6',
  Purple400 = '#764AE2',

  // Grays.
  Gray100 = ColorCodes.Neutral25,
  Gray200 = '#d1d1d1',
  Gray300 = '#b0b0b0',
  Gray350 = '#d8dfe2',
  Gray400 = '#888888',
  Gray500 = '#6d6d6d',
  Gray600 = '#5d5d5d',
  Gray700 = '#4f4f4f',
  Gray800 = '#454545',
  Gray900 = '#323232',

  // Default chart border color.
  RedAccent100 = '#FF6384',
  BlueAccent100 = '#36A2EB',

  // Default chart color.
  RedAccent200 = '#FFB1C1',
  BlueAccent200 = '#9BD0F5',

  // Color Bar.
  ColorBar1 = '#5CC4FA',
  ColorBar2 = '#E79985',
  ColorBar3 = '#919CEF',
  ColorBar4 = '#94EAE2',
  ColorBar5 = '#5013B4',
  ColorBar6 = '#87D541',
  ColorBar7 = '#419298',
  ColorBar8 = '#FADF57',
  ColorBar9 = '#EC68A1',
  ColorBar10 = '#EF8952',
  ColorBar11 = '#A56234',
  ColorBar12 = '#6DDA98',
  ColorBar13 = '#656363',
  ColorBar14 = '#2E6336',
  ColorBar15 = '#821A12',
  ColorBar16 = '#761569',
  ColorBar17 = '#88912C',
  ColorBar18 = '#0921CE',
  ColorBar19 = '#6D8997',
  ColorBar20 = '#CB75F7',
}

export const colorCycle = new Array(20)
  .fill('')
  .map((_, index) => `color-bar-${index + 1}`);

export const generateColor = (index: number) =>
  colorCycle[index % colorCycle.length];

export const colorBarHexCodes = [
  0x15c7ff, 0xf49580, 0x8c95d4, 0x74ede3, 0x580cbb, 0xa6ff4e, 0x01949a,
  0xffde2e, 0xff5da2, 0xff8243, 0xb05e27, 0x2fdd92, 0x656363, 0x116530,
  0x8e0505, 0x81006c, 0x869200, 0x0022d7, 0x668a99, 0xd96fff,
];
