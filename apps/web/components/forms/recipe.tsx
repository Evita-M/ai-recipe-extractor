'use client';

import { Label } from '@workspace/ui/components/label';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Formik, Form, FormikHelpers } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { z } from 'zod';

export const recipeFormSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  targetLanguage: z.enum(['cs', 'el', 'en']).nullable(),
});

export type RecipeFormValues = z.infer<typeof recipeFormSchema>;

interface RecipeFormProps {
  onSubmit: (
    values: RecipeFormValues,
    helpers: FormikHelpers<RecipeFormValues>
  ) => void | Promise<void>;
  initialValues: RecipeFormValues;
}

const languageSelectOptions = [
  { value: 'cs', label: 'Czech' },
  { value: 'el', label: 'Greek' },
  { value: 'en', label: 'English' },
];

export const RecipeForm = ({ onSubmit, initialValues }: RecipeFormProps) => {
  return (
    <Formik<RecipeFormValues>
      onSubmit={onSubmit}
      validationSchema={toFormikValidationSchema(recipeFormSchema)}
      initialValues={initialValues}
    >
      {({ errors, touched, handleChange, values, isSubmitting }) => (
        <Form className="space-y-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="url" isRequired>
              Recipe URL
            </Label>
            <Input
              id="url"
              name="url"
              type="url"
              placeholder="Enter recipe URL"
              value={values.url}
              onChange={handleChange}
              className={errors.url && touched.url ? 'border-red-500' : ''}
            />
            {errors.url && touched.url && (
              <span className="text-sm text-red-500">{errors.url}</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="targetLanguage">Translation</Label>
            <Select
              name="targetLanguage"
              value={values.targetLanguage ?? 'none'}
              onValueChange={(value) => {
                handleChange({
                  target: {
                    name: 'targetLanguage',
                    value: value === 'none' ? null : value,
                  },
                });
              }}
            >
              <SelectTrigger className="h-12 bg-white border-zinc-300 hover:border-zinc-300 focus:border-[#E9B000] focus:ring-1 focus:ring-[#E9B000] transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No translation</SelectItem>
                {languageSelectOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.targetLanguage && touched.targetLanguage && (
              <span className="text-sm text-red-500">
                {errors.targetLanguage}
              </span>
            )}
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full mt-4">
            {isSubmitting ? 'Processing...' : 'Create Notion Recipe'}
          </Button>
        </Form>
      )}
    </Formik>
  );
};
