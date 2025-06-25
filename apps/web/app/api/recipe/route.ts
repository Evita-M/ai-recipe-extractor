import { NextRequest, NextResponse } from 'next/server';
import { run } from '@openai/agents';
import { z } from 'zod';
import { recipeAgent } from '@/lib/agents/recipe-agent';
import { supportedLanguages } from '@/lib/types/language';
import { extractHtmlText } from '@/lib/utils/extract-html-text';
import { detectLanguage } from '@/lib/utils/detect-language';

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

    if (!process.env.NOTION_DATABASE_ID) {
      return NextResponse.json(
        { error: 'NOTION_DATABASE_ID is not set in the environment variables' },
        { status: 500 }
      );
    }
    if (targetLanguage) {
      const validatedTargetLanguage =
        supportedLanguages.safeParse(targetLanguage);
      if (!validatedTargetLanguage.success) {
        return NextResponse.json(
          { error: 'Target language is not supported' },
          { status: 400 }
        );
      }
    }

    const extractedHtmlText = await extractHtmlText(url);
    if (extractedHtmlText.length === 0) {
      return NextResponse.json(
        { error: 'No text found in the HTML' },
        { status: 400 }
      );
    }

    const languageResult = await detectLanguage(extractedHtmlText);
    const validatedDetectedLanguage = supportedLanguages.safeParse(
      languageResult.language
    );
    if (!validatedDetectedLanguage.success) {
      return NextResponse.json(
        { error: 'Language of the recipe is not supported' },
        { status: 400 }
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        // const logger = new RecipeAgentLogger();

        const sendEvent = (data: object) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          console.log(`Processing recipe from: ${url}`);

          const agentStream = await run(
            recipeAgent,
            [
              `URL: ${url}`,
              `Database: ${process.env.NOTION_DATABASE_ID}`,
              `Target language: ${targetLanguage ?? 'not specified'}`,
              `Extracted Recipe Content:\n${extractedHtmlText}`,
            ].join('\n'),
            {
              maxTurns: 6,
              stream: true,
            }
          );

          for await (const event of agentStream) {
            // await logger.append(event);
            if (event.type === 'raw_model_stream_event') {
              const eventData = event.data;

              if (eventData.type === 'model') {
                const modelEvent = eventData.event;
                if (
                  modelEvent.type === 'response.output_item.added' ||
                  modelEvent.type === 'response.output_item.done'
                ) {
                  const item = modelEvent.item;

                  if (item.type === 'function_call') {
                    sendEvent({
                      status: item.status,
                      toolName: item.name,
                    });
                  }
                }
              }
            }
          }

          sendEvent({
            status: 'completed',
            message: 'Successfully processed recipe',
          });
        } catch (error) {
          sendEvent({
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
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
