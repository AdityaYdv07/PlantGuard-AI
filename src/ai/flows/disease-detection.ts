'use server';
/**
 * @fileOverview A plant disease detection AI agent.
 *
 * - detectDisease - A function that handles the plant disease detection process.
 * - DetectDiseaseInput - The input type for the detectDisease function.
 * - DetectDiseaseOutput - The return type for the detectDisease function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const DetectDiseaseInputSchema = z.object({
  photoUrl: z.string().describe('The URL of the plant photo.'),
});
export type DetectDiseaseInput = z.infer<typeof DetectDiseaseInputSchema>;

const DetectDiseaseOutputSchema = z.object({
  plantName: z.string().describe('The detected plant name.'),
  disease: z.string().describe('The detected disease, if any.'),
  confidence: z.number().describe('The confidence score of the disease detection.'),
});
export type DetectDiseaseOutput = z.infer<typeof DetectDiseaseOutputSchema>;

export async function detectDisease(input: DetectDiseaseInput): Promise<DetectDiseaseOutput> {
  return detectDiseaseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectDiseasePrompt',
  input: {
    schema: z.object({
      photoUrl: z.string().describe('The URL of the plant photo.'),
    }),
  },
  output: {
    schema: z.object({
      plantName: z.string().describe('The detected plant name.'),
      disease: z.string().describe('The detected disease, if any.'),
      confidence: z.number().describe('The confidence score of the disease detection.'),
    }),
  },
  prompt: `You are an expert in plant pathology. Analyze the provided image of the plant and identify the plant, and any potential diseases.

  Respond with the detected plant name, detected disease and a confidence score.
  If no disease is detected, state that no disease was detected and return a confidence of 1.0.

  Photo: {{media url=photoUrl mimeType="image/jpeg"}}`,
});

const detectDiseaseFlow = ai.defineFlow<
  typeof DetectDiseaseInputSchema,
  typeof DetectDiseaseOutputSchema
>(
  {
    name: 'detectDiseaseFlow',
    inputSchema: DetectDiseaseInputSchema,
    outputSchema: DetectDiseaseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
