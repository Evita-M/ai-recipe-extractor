import { loadModule } from 'cld3-asm';

export async function detectLanguage(text: string) {
  try {
    const cld3 = await loadModule();
    const langResult = cld3.create().findLanguage(text);

    if (!langResult.language) {
      throw new Error('Language detection failed');
    }

    return langResult;
  } catch (error) {
    throw new Error('Error detecting language');
  }
}
