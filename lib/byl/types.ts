export type BylCheckoutItem =
  | { price: string; quantity: number }
  | { price_id: number; quantity: number }
  | { price_data: { unit_amount: number; product_data: { name: string; client_reference_id?: string } }; quantity: number };

export type CreateBylCheckout = {
  items: BylCheckoutItem[];
  success_url?: string;
  cancel_url?: string;
  customer_email?: string;
  client_reference_id?: string;
  email_collection?: boolean;
  allow_promotion_codes?: boolean;
};

export type BylCheckout = { id: number; url: string };
export type BylWebhookEvent = { id: number; project_id: number; type: string; object: string; data: { object: Record<string, unknown> }; created_at: string; updated_at?: string };
