import {
  getOfficialTempleWebsite,
  getOfficialTempleHelpline,
  getAuthenticTempleDarshanDetails,
  getAuthenticTempleFacilities,
  getAuthenticVisitorGuidelines,
  getAuthenticTempleDetails,
} from '../authenticTempleMetadata';

import type { TempleMatchContext } from './types';

export interface TempleMetadataVerificationCase {
  name: string;
  ctx: TempleMatchContext;
}

export const TEMPLE_METADATA_VERIFICATION_CASES: TempleMetadataVerificationCase[] = [
  {
    name: 'Somnath',
    ctx: {
      temple: { name: 'Somnath Temple – Gujarat' },
      templeId: 'jyotirling-somnath-temple-gujarat',
      templeKey: 'Somnath Temple – Gujarat',
    },
  },
  {
    name: 'Mahakaleshwar',
    ctx: {
      temple: { name: 'Mahakaleshwar Temple – Ujjain' },
      templeId: 'jyotirling-mahakaleshwar-temple-ujjain',
      templeKey: 'Mahakaleshwar Temple – Ujjain',
    },
  },
  {
    name: 'Kashi Vishwanath',
    ctx: {
      temple: { name: 'Kashi Vishwanath Temple – Varanasi' },
      templeId: 'jyotirling-kashi-vishwanath-temple-varanasi',
      templeKey: 'Kashi Vishwanath Temple – Varanasi',
    },
  },
  {
    name: 'Tirupati',
    ctx: {
      temple: { name: 'Tirupati Balaji Temple – Andhra Pradesh' },
      templeId: 'other-tirupati-balaji-temple-andhra-pradesh',
      templeKey: 'Tirupati Balaji Temple – Andhra Pradesh',
    },
  },
  {
    name: 'Dwarka',
    ctx: {
      temple: { name: 'Shri Dwarkadhish Temple – Dwarka' },
      templeId: 'other-shri-dwarkadhish-temple-dwarka',
      templeKey: 'Shri Dwarkadhish Temple – Dwarka',
    },
  },
  {
    name: 'Kamakhya',
    ctx: {
      temple: { name: 'Kamakhya Temple – Guwahati' },
      templeId: 'shaktipeeth-kamakhya-temple-guwahati',
      templeKey: '',
    },
  },
  {
    name: 'Bakreshwar Unmapped',
    ctx: {
      temple: { name: 'Bakreshwar Temple – Birbhum' },
      templeId: 'bakreshwar-temple',
      templeKey: '',
    },
  },
  {
    name: 'Unknown Temple',
    ctx: {
      temple: { name: 'Some Unknown Temple' },
      templeId: 'some-unknown-temple',
      templeKey: '',
    },
  },
];

export const runTempleMetadataVerification = () => {
  return TEMPLE_METADATA_VERIFICATION_CASES.map(({ name, ctx }) => ({
    name,
    officialWebsite: getOfficialTempleWebsite(ctx),
    officialHelpline: getOfficialTempleHelpline(ctx),
    darshanDetails: getAuthenticTempleDarshanDetails(ctx),
    facilities: getAuthenticTempleFacilities(ctx),
    visitorGuidelinesCount: getAuthenticVisitorGuidelines(ctx).length,
    authenticDetails: getAuthenticTempleDetails(ctx),
  }));
};
