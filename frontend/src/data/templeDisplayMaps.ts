export const CATEGORY_BADGE_MAP: Record<string, { emoji: string; label: string }> = {
  'jyotirlinga': { emoji: '🔱', label: 'Jyotirlinga' },
  'char dham': { emoji: '🕉', label: 'Char Dham' },
  'shakti peeth': { emoji: '🌺', label: 'Shakti Peeth' },
  'divya desam': { emoji: '🏛', label: 'Divya Desam' },
  'sacred': { emoji: '🙏', label: 'Sacred Temple' },
  'iskcon': { emoji: '🙏', label: 'ISKCON' },
  'sikh': { emoji: '☬', label: 'Gurdwara' },
};

export const AMENITY_MAP: Record<string, { label: string; iconName: any; iconColor: string; bgColor: string }> = {
  parking: { label: 'Parking', iconName: 'car-outline', iconColor: '#2563EB', bgColor: '#EFF6FF' },
  locker: { label: 'Lockers', iconName: 'lock-closed-outline', iconColor: '#4F46E5', bgColor: '#EEF2FF' },
  lockers: { label: 'Lockers', iconName: 'lock-closed-outline', iconColor: '#4F46E5', bgColor: '#EEF2FF' },
  prasad: { label: 'Prasad Counter', iconName: 'restaurant-outline', iconColor: '#EA580C', bgColor: '#FFF7ED' },
  drinking_water: { label: 'Drinking Water', iconName: 'water-outline', iconColor: '#0284C7', bgColor: '#F0F9FF' },
  restrooms: { label: 'Restrooms', iconName: 'man-outline', iconColor: '#059669', bgColor: '#ECFDF5' },
  shoe_stand: { label: 'Shoe Stand', iconName: 'footsteps-outline', iconColor: '#D97706', bgColor: '#FFFBEB' },
  wheelchair: { label: 'Wheelchair', iconName: 'body-outline', iconColor: '#7C3AED', bgColor: '#F5F3FF' },
  dharamshala: { label: 'Dharamshala', iconName: 'home-outline', iconColor: '#0D9488', bgColor: '#F0FDFA' },
  bhojanalaya: { label: 'Bhojanalaya', iconName: 'nutrition-outline', iconColor: '#D97706', bgColor: '#FFFBEB' },
  puja_booking: { label: 'Puja Booking', iconName: 'calendar-outline', iconColor: '#2563EB', bgColor: '#EFF6FF' },
  medical_aid: { label: 'Medical Aid', iconName: 'medkit-outline', iconColor: '#DC2626', bgColor: '#FEF2F2' },
  mobile_deposit: { label: 'Mobile Deposit', iconName: 'phone-portrait-outline', iconColor: '#4F46E5', bgColor: '#EEF2FF' },
  transport_assistance: { label: 'Transport', iconName: 'bus-outline', iconColor: '#059669', bgColor: '#ECFDF5' },
  hair_tonsuring: { label: 'Tonsuring', iconName: 'cut-outline', iconColor: '#EA580C', bgColor: '#FFF7ED' },
  holy_kund: { label: 'Holy Kund', iconName: 'water-outline', iconColor: '#0284C7', bgColor: '#F0F9FF' },
};

export const GUIDELINE_ICONS: Record<string, { iconName: any; iconColor: string; badgeBg: string }> = {
  '🎟️': { iconName: 'ticket-outline', iconColor: '#2563EB', badgeBg: '#EFF6FF' },
  '⏳': { iconName: 'time-outline', iconColor: '#D97706', badgeBg: '#FFFBEB' },
  '👕': { iconName: 'shirt-outline', iconColor: '#7C3AED', badgeBg: '#F5F3FF' },
  '📵': { iconName: 'phone-portrait-outline', iconColor: '#DC2626', badgeBg: '#FEF2F2' },
  '👞': { iconName: 'footsteps-outline', iconColor: '#D97706', badgeBg: '#FFFBEB' },
  '♿': { iconName: 'body-outline', iconColor: '#059669', badgeBg: '#ECFDF5' },
  '🚻': { iconName: 'home-outline', iconColor: '#0D9488', badgeBg: '#F0FDFA' },
  '👥': { iconName: 'people-outline', iconColor: '#2563EB', badgeBg: '#EFF6FF' },
};
