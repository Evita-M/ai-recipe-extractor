import axios from 'axios';
import { z } from 'zod';
import { tool } from '@openai/agents';
import { loadModule } from 'cld3-asm';
import * as cheerio from 'cheerio';

import { isSupportedLanguage } from '../utils/is-supported-language';

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
    'Fetches the HTML content from a URL and extracts only the text.',
  parameters: z.object({
    url: z.string().describe('Must be a valid URL'),
  }),
  execute: async ({ url }: { url: string }) => {
    let detectedLanguageCode: string;
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

      try {
        const cld3 = await loadModule();
        const langResult = cld3.create().findLanguage(extractedHtmlText);
        detectedLanguageCode = langResult.language;

        if (!isSupportedLanguage(detectedLanguageCode)) {
          throw new Error('Language is not supported');
        }
      } catch (error) {
        console.error('Error detecting language:', error);
        throw new Error('Error detecting language');
      }

      console.log(
        `Successfully extracted ${extractedHtmlText.length} characters of content and detected language code "${detectedLanguageCode}"`
      );

      return {
        extractedHtmlText,
        detectedLanguageCode,
      };
    } catch (error) {
      console.error('Error fetching HTML:', error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(
            `HTTP ${error.response.status}: ${error.response.statusText} - Failed to fetch ${url}`
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
