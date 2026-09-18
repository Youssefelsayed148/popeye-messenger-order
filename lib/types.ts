export type MenuItem = {
  id: string;
  category: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
  created_at: string;
};

export type OrderItem = {
  item_id: string;
  name: string;
  qty: number;
  unit_price: number;
};

export type Order = {
  id: string;
  psid: string;
  items: OrderItem[];
  total: number;
  status: string;
  channel: string;
  customer_note: string | null;
  customer_name?: string | null;
  phone?: string | null;
  zone_name?: string | null;
  delivery_fee?: number | null;
  address?: string | null;
  floor?: string | null;
  apartment?: string | null;
  landmark?: string | null;
  payment_method?: string | null;
  created_at: string;
};

export type DeliveryZone = {
  area_id: number;
  area_name: string;
  delivery_fee: number;
  sort_order: number | null;
};

export type Offer = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
  created_at: string;
};

export type OfferItem = {
  id: string;
  offer_id: string;
  item_name: string;
  category_hint: string | null;
  quantity: number;
  is_selectable: boolean;
  is_free: boolean;
  item_price: number | null;
  sort_order: number;
};

export type MenuSeedRow = Pick<
  MenuItem,
  "category" | "name" | "description" | "price" | "image_url" | "sort_order"
> & {
  description?: string | null;
  image_url?: string | null;
};
