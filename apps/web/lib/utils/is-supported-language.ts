import { supportedLanguages } from '../types/language';

export function isSupportedLanguage(
  lang: string
): lang is (typeof supportedLanguages.options)[number] {
  return supportedLanguages.options.includes(lang as any);
}
