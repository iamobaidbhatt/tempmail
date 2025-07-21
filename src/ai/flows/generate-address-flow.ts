'use server';

/**
 * @fileOverview A random address generation AI agent.
 *
 * - generateRandomAddress - A function that handles the random address generation process.
 * - GenerateAddressOutput - The return type for the generateRandomAddress function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { Address, AddressSchema, GenerateAddressInput, GenerateAddressInputSchema } from '@/lib/types';


export async function generateRandomAddress(input?: GenerateAddressInput): Promise<Address> {
  return generateAddressFlow(input);
}

const generateAddressPrompt = ai.definePrompt({
  name: 'generateAddressPrompt',
  input: {schema: GenerateAddressInputSchema.optional()},
  output: {schema: AddressSchema},
  prompt: `Generate a single, realistic but fake physical address.
  {{#if country}}
  The address must be from {{country}}.
  {{else}}
  The address can be from any random country.
  {{/if}}
  The address should look authentic for the country it's from.`,
});

const generateAddressFlow = ai.defineFlow(
  {
    name: 'generateAddressFlow',
    inputSchema: GenerateAddressInputSchema.optional(),
    outputSchema: AddressSchema,
  },
  async (input) => {
    const {output} = await generateAddressPrompt(input);
    return output!;
  }
);
