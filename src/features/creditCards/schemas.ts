import { z } from 'zod'

export const creditCardSchema = z.object({
  card_name: z.string().trim().min(1, 'Card name is required').max(100, 'Card name is too long'),
  bank: z.string().trim().max(100).optional().or(z.literal('')),
  network: z.string().trim().max(50).optional().or(z.literal('')),
  credit_limit: z.coerce.number().min(0, 'Credit limit cannot be negative'),
  statement_day: z.coerce
    .number()
    .int('Statement day must be a whole number')
    .min(1, 'Statement day must be between 1 and 31')
    .max(31, 'Statement day must be between 1 and 31'),
  due_day: z.coerce
    .number()
    .int('Due day must be a whole number')
    .min(1, 'Due day must be between 1 and 31')
    .max(31, 'Due day must be between 1 and 31'),
  opening_balance: z.coerce.number().min(0, 'Opening balance cannot be negative'),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
})

export type CreditCardFormValues = z.infer<typeof creditCardSchema>
