'use server';
/**
 * @fileOverview A flow to suggest possible causes and remedies for a detected plant disease,
 * including supplement recommendations with a buy link.
 *
 * - suggestRemedies - A function that suggests remedies for a plant disease, including
 *   supplement suggestions with a buy link.
 * - SuggestRemediesInput - The input type for the suggestRemedies function.
 * - SuggestRemediesOutput - The return type for the suggestRemedies function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const SuggestRemediesInputSchema = z.object({
  disease: z.string().describe('The name of the detected plant disease. If no disease detected, this field should be "No disease detected".'),
  plantDescription: z.string().describe('A description of the plant and its environment.'),
});
export type SuggestRemediesInput = z.infer<typeof SuggestRemediesInputSchema>;

const SuggestRemediesOutputSchema = z.object({
  possibleCauses: z.array(z.string()).describe('Possible causes of the disease.'),
  remedies: z.array(z.string()).describe('Suggested remedies for the disease.'),
  supplements: z.array(z.string()).optional().describe('Suggested supplements for the disease.'),
});
export type SuggestRemediesOutput = z.infer<typeof SuggestRemediesOutputSchema>;

export async function suggestRemedies(input: SuggestRemediesInput): Promise<SuggestRemediesOutput> {
  return suggestRemediesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRemediesPrompt',
  input: {
    schema: z.object({
      disease: z.string().describe('The name of the detected plant disease. If no disease detected, this field should be "No disease detected".'),
      plantDescription: z.string().describe('A description of the plant and its environment.'),
    }),
  },
  output: {
    schema: z.object({
      possibleCauses: z.array(z.string()).describe('Possible causes of the disease.'),
      remedies: z.array(z.string()).describe('Suggested remedies for the disease.'),
      supplements: z.array(z.string()).optional().describe('Suggested supplements for the disease, with instructions on how to use them. '),
    }),
  },
  prompt: `You are an expert in plant diseases and remedies.

  {% if disease == "No disease detected" %}
  Given the following description of the plant and its environment:
  {{{plantDescription}}}
  
  Please suggest possible causes and remedies for how to maintain this plant and keep it healthy.
  {% else %}
  You have identified that a plant has the following disease: {{{disease}}}.
  
  Given the following description of the plant and its environment:
  {{{plantDescription}}}
  
  Please suggest possible causes, remedies, and supplements for this disease.
  
  For each supplement, provide instructions on how to use them for the disease to make the plant healthy.
  {% endif %}
`,
});

const suggestRemediesFlow = ai.defineFlow<
  typeof SuggestRemediesInputSchema,
  typeof SuggestRemediesOutputSchema
>(
  {
    name: 'suggestRemediesFlow',
    inputSchema: SuggestRemediesInputSchema,
    outputSchema: SuggestRemediesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);

    return output!;
  }
);
