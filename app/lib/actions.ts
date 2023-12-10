'use server';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const CreateInvoiceSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['paid', 'pending']),
  date: z.string(),
});
const CreateInvoiceFormSchema = CreateInvoiceSchema.omit({
  id: true,
  date: true,
});

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoiceFormSchema.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // tranformamos para evitar errores de redondeo
  const amountInCents = amount * 100;

  // creamos fecha actual
  const [date] = new Date().toISOString().split('T');
  console.log({
    customerId,
    amountInCents,
    status,
    date,
  });

  await sql`
    INSERT INTO invoices
      (customer_id, amount, status, date)
    VALUES
      (${customerId}, ${amountInCents}, ${status}, ${date})
  `;

  // revalidamos la ruta para que se actualice el cache
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}
