import type { AvatarId } from '@/models/types';

const USER_AVATAR_URLS: Record<AvatarId, string> = {
  'boy-blond': '/avatars/user-boy-blond.webp',
  'boy-light-brown': '/avatars/user-boy-light-brown.webp',
  'boy-dark': '/avatars/user-boy-dark.webp',
  'girl-blond': '/avatars/user-girl-blond.webp',
  'girl-light-brown': '/avatars/user-girl-light-brown.webp',
  'girl-dark': '/avatars/user-girl-dark.webp',
  'girl-red': '/avatars/user-girl-red.webp',
};

export const COACH_AVATAR_URL = '/avatars/coach.webp';

export function getUserAvatarUrl(avatarId?: AvatarId): string {
  return USER_AVATAR_URLS[avatarId ?? 'girl-light-brown'];
}
