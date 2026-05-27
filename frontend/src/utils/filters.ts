import { Platform } from 'react-native';

export const FILTERS = ['Normal', 'Vivid', 'Warm', 'Cool'];

export const getFilterStyle = (filterName?: string): any => {
  if (Platform.OS !== 'web' || !filterName) return {};
  switch (filterName) {
    case 'Vivid':
      return { filter: 'saturate(1.6) contrast(1.1) brightness(1.05)' };
    case 'Warm':
      return { filter: 'sepia(0.35) saturate(1.2) contrast(0.95)' };
    case 'Cool':
      return { filter: 'hue-rotate(15deg) saturate(1.15) brightness(1.05)' };
    default:
      return { filter: 'none' };
  }
};

export const getOverlayStyle = (filterName?: string): any => {
  if (Platform.OS === 'web' || !filterName) return { display: 'none' };
  switch (filterName) {
    case 'Vivid':
      return { backgroundColor: 'rgba(255, 255, 255, 0.08)' };
    case 'Warm':
      return { backgroundColor: 'rgba(255, 170, 0, 0.12)' };
    case 'Cool':
      return { backgroundColor: 'rgba(0, 150, 255, 0.08)' };
    default:
      return { display: 'none' };
  }
};
