import { PassportMediaItem, PassportMediaType } from '../types/passport';

export const createMediaItem = (uri: string, type: PassportMediaType): PassportMediaItem => ({
  id: `passport_media_${Math.random().toString(36).slice(2, 10)}`,
  uri,
  type,
});
