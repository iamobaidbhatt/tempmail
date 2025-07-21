import { z } from 'zod';

export interface Email {
  id: string; // Changed to string for mail.gw API
  from: string;
  subject: string;
  date: string;
  expiresIn?: string;
}

export interface EmailMessage {
  id: string; // Changed to string for mail.gw API
  from: string;
  to: string;
  subject: string;
  date: string;
  attachments: {
    filename: string;
    contentType: string;
    size: number;
  }[];
  body: string;
  textBody: string;
  htmlBody: string;
}

export const AddressSchema = z.object({
  street: z.string().describe('The street address, including the house or building number.'),
  city: z.string().describe('The city or town.'),
  state: z.string().describe('The state, province, or region.'),
  postalCode: z.string().describe('The postal or ZIP code.'),
  country: z.string().describe('The country.'),
});

export type Address = z.infer<typeof AddressSchema>;


export const GenerateAddressInputSchema = z.object({
  country: z.string().optional().describe('The country to generate an address from.'),
});

export type GenerateAddressInput = z.infer<typeof GenerateAddressInputSchema>;
