import * as cheerio from 'cheerio';

export async function extractHtmlText(url: string): Promise<string> {
  let html: string = '';
  try {
    console.log(`Fetching HTML content from: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AI-crawler/1.0)',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    html = await response.text();
  } catch (error) {
    console.error('Error fetching HTML content:', error);
    throw new Error('Failed to fetch HTML content');
  }

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
