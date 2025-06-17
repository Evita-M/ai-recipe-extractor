import { z } from 'zod';

export const supportedLanguages = z.enum(['cs', 'el', 'en']);

export type SupportedLanguage = z.infer<typeof supportedLanguages>;
