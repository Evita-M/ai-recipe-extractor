import { NextRequest, NextResponse } from 'next/server';
import { run } from '@openai/agents';
import { z } from 'zod';
import { recipeAgent } from '@/lib/agents/recipe-agent';
import { supportedLanguages } from '@/lib/types/language';
import { isSupportedLanguage } from '@/lib/utils/is-supported-language';

// Input validation schema
const requestSchema = z.object({
  url: z.string().describe('Must be a valid URL'),
  targetLanguage: supportedLanguages
    .describe('Must be a supported language code by ISO 639-1')
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, targetLanguage } = requestSchema.parse(body);

    console.log(`Processing recipe from: ${url}`);

    if (targetLanguage && !isSupportedLanguage(targetLanguage)) {
      throw new Error('Target language is not supported');
    }

    if (!process.env.NOTION_DATABASE_ID) {
      throw new Error(
        'NOTION_DATABASE_ID is not set in the environment variables'
      );
    }

    // Use concise prompt for token efficiency
    const result = await run(
      recipeAgent,
      `URL: ${url}\nDatabase: ${process.env.NOTION_DATABASE_ID}\nTarget language: ${targetLanguage}`,
      {
        maxTurns: 10, // Allow enough turns for the multi-agent workflow
      }
    );

    console.log('Agent orchestration completed successfully');

    return NextResponse.json({
      success: true,
      result: result.finalOutput,
      message: `Successfully processed recipe from ${url}`,
    });
  } catch (error) {
    console.error('Recipe extraction error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to process recipe',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
