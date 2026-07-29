let ImagePickerModule: typeof import('expo-image-picker') | null = null;
let isLoaded = false;

export const getSafeImagePicker = (): typeof import('expo-image-picker') | null => {
  if (isLoaded) {
    return ImagePickerModule;
  }
  
  try {
    ImagePickerModule = require('expo-image-picker');
  } catch (error) {
    console.warn('[safeImagePicker] expo-image-picker native module is unavailable:', error);
    ImagePickerModule = null;
  }
  
  isLoaded = true;
  return ImagePickerModule;
};
