'use client';

import axios from 'axios';
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

export default function Page() {
  const handleSubmit = async (
    values: RecipeFormValues,
    helpers: FormikHelpers<RecipeFormValues>
  ) => {
    const { url, targetLanguage } = values;
    if (!url) return;

    try {
      await axios.post('/api/recipe', {
        url,
        targetLanguage: targetLanguage || undefined,
      });

      toast.success('Recipe created successfully!');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(
          err.response?.data?.message ||
            err.message ||
            'Failed to process recipe'
        );
      } else {
        toast.error('Something went wrong');
      }
    } finally {
      helpers.setSubmitting(false);
      helpers.resetForm();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-svh bg-zinc-50">
      <Card className="w-full max-w-xl mx-4">
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
