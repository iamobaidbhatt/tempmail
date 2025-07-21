'use server';

import { summarizeEmail } from '@/ai/flows/summarize-email';
import { generateRandomAddress } from '@/ai/flows/generate-address-flow';
import type { Address, GenerateAddressInput } from './types';

export async function getSummary(emailBody: string): Promise<{ summary?: string; error?: string }> {
  if (!emailBody || emailBody.trim().length < 20) { // Add a minimum length check
    return { error: 'Email content is too short to summarize.' };
  }
  
  try {
    const result = await summarizeEmail({ emailBody });
    return { summary: result.summary };
  } catch (error) {
    console.error('Error getting summary:', error);
    return { error: 'An AI error occurred while generating the summary.' };
  }
}

export async function getRandomAddress(input?: GenerateAddressInput): Promise<{ address?: Address; error?: string }> {
  try {
    const result = await generateRandomAddress(input);
    return { address: result };
  } catch (error) {
    console.error('Error generating address:', error);
    return { error: 'An AI error occurred while generating the address.' };
  }
}
