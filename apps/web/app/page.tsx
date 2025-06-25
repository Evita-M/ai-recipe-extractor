'use client';

import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { RecipeForm } from '@/components/forms/recipe';
import { FormikHelpers } from 'formik';
import { RecipeFormValues } from '@/components/forms/recipe';
import { useState } from 'react';
import {
  initialStepStatuses,
  Stepper,
  StepStatus,
  StepType,
} from '@/components/stepper';

export default function Page() {
  const [stepStatuses, setStepStatuses] =
    useState<Record<StepType, StepStatus>>(initialStepStatuses);

  const handleSubmit = async (
    values: RecipeFormValues,
    helpers: FormikHelpers<RecipeFormValues>
  ) => {
    setStepStatuses(initialStepStatuses);
    const { url, targetLanguage } = values;
    if (!url) return;

    try {
      const response = await fetch('/api/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          targetLanguage: targetLanguage || undefined,
        }),
      });

      if (!response.body) throw new Error('No response body');
      if (response.status !== 200) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split('\n\n');
        buffer = events.pop() || '';
        for (const event of events) {
          if (event.startsWith('data: ')) {
            const data = JSON.parse(event.slice(6));
            if (data.toolName === StepType.EXTRACT_RECIPE) {
              setStepStatuses((prev) => ({
                ...prev,
                [StepType.EXTRACT_RECIPE]: data.status,
              }));
            }
            if (data.toolName === StepType.TRANSLATE_RECIPE) {
              setStepStatuses((prev) => ({
                ...prev,
                [StepType.TRANSLATE_RECIPE]: data.status,
              }));
            }
            if (data.toolName === StepType.PUBLISH_RECIPE) {
              setStepStatuses((prev) => ({
                ...prev,
                [StepType.PUBLISH_RECIPE]: data.status,
              }));
            }
          }
        }
      }
      toast.success('Recipe published successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      helpers.setSubmitting(false);
      helpers.resetForm();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-svh bg-zinc-50">
      <div className="w-full max-w-md ">
        <Stepper stepStatuses={stepStatuses} />
      </div>
      <Card className="w-full max-w-xl mx-4 mt-4">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-medium tracking-tight text-zinc-900 mb-4">
            Recipe to Notion
          </CardTitle>
          <p className="text-zinc-500">
            Transform any recipe into a beautifully formatted Notion page.
            Simply paste a recipe URL from any supported website. The recipe
            will be automatically extracted and saved to your Notion workspace.
            You can optionally translate the recipe to English, Czech, or Greek.
          </p>
        </CardHeader>
        <CardContent>
          <RecipeForm
            onSubmit={handleSubmit}
            initialValues={{ url: '', targetLanguage: null }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
