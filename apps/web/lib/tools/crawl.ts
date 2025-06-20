import axios from 'axios';
import { z } from 'zod';
import { tool } from '@openai/agents';
import { loadModule } from 'cld3-asm';
import * as cheerio from 'cheerio';
import { supportedLanguages } from '../types/language';

function extractHtmlText(html: string): string {
  const $ = cheerio.load(html);

  const elementsToRemove = [
    'script',
    'style',
    'iframe',
    'svg',
    'meta',
    'link',
    'noscript',
    'header',
    'footer',
    'nav',
    'img',
    'video',
    'picture',
    'source',
    'audio',
    'canvas',
    'object',
    'embed',
    '.ads',
    '.sidebar',
  ];

  elementsToRemove.forEach((element) => {
    $(element).remove();
  });

  const main = $('main, article, .content, .post').first();
  const contentRoot = main.length ? main : $('body');

  contentRoot.find('*').each((_, el) => {
    const $el = $(el);
    if (!$el.text().trim() && $el.children().length === 0) {
      $el.remove();
    }
  });

  const text = contentRoot.text().replace(/\s+/g, ' ').trim();
  return text;
}

export const extractTextFromUrlTool = tool({
  name: 'extract_text_from_url',
  description:
    'Fetches the HTML content from a URL, extracts only the text, and validates that the recipe is in a supported language. This tool will throw an error if the detected language is not supported, stopping execution immediately.',
  parameters: z.object({
    url: z.string().describe('Must be a valid URL'),
  }),
  execute: async ({ url }: { url: string }) => {
    let detectedLanguageCode: string | undefined;

    try {
      console.log(`Fetching HTML content from: ${url}`);
      const { data: html } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AI-crawler/1.0)',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 10000,
        maxContentLength: 5 * 1024 * 1024, // 5MB max
      });

      const extractedHtmlText = extractHtmlText(html);

      console.log(`Extracted ${extractedHtmlText.length} characters`);

      try {
        const cld3 = await loadModule();
        const langResult = cld3.create().findLanguage(extractedHtmlText);
        detectedLanguageCode = langResult.language;

        const validatedLanguage =
          supportedLanguages.parse(detectedLanguageCode);

        console.log(
          `Detected language: ${detectedLanguageCode} (confidence: ${langResult.probability})`
        );
        return {
          extractedHtmlText,
          detectedLanguage: validatedLanguage,
          confidence: langResult.probability,
        };
      } catch (languageError) {
        if (languageError instanceof z.ZodError) {
          const errorMessage = `Detected language "${detectedLanguageCode || 'unknown'}" is not supported.`;
          throw new Error(errorMessage);
        }
        throw new Error('Error detecting language');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('not supported')) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(
            `HTTP ${error.response.status}: ${error.response.statusText} - failed to fetch ${url}`
          );
        } else if (error.request) {
          throw new Error(`Network error: Unable to reach ${url}`);
        }
      }

      throw new Error(
        `Failed to fetch content from ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});
