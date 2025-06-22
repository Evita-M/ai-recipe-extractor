import { NextRequest, NextResponse } from 'next/server';
import { run } from '@openai/agents';
import { z } from 'zod';
import { recipeAgent } from '@/lib/agents/recipe-agent';
import { supportedLanguages } from '@/lib/types/language';

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

          if (!process.env.NOTION_DATABASE_ID) {
            throw new Error(
              'NOTION_DATABASE_ID is not set in the environment variables'
            );
          }

          if (targetLanguage) {
            const validatedLanguage = supportedLanguages.parse(targetLanguage);
            if (!validatedLanguage) {
              throw new Error('Target language is not supported');
            }
          }

          const stream = await run(
            recipeAgent,
            `URL: ${url}\nDatabase: ${process.env.NOTION_DATABASE_ID}\nTarget language: ${targetLanguage}`,
            {
              maxTurns: 6,
              stream: true,
            }
          );

          for await (const event of stream) {
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
          sendEvent({ status: 'failed', error: 'Failed to process recipe' });
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
