import { randomBytes } from 'crypto';

export const generateId = (): string => {
  return randomBytes(6).toString('base64url').slice(0, 8);
};
