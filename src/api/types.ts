// Mirrors the charkha-lifestyle-backend repo's app/models.py — keep the two in
// sync by hand, across repos, for now.

export type ProductStatus = "live" | "draft";

// Not enforced by the backend (category is a free-text string on Product),
// but this is the set the seed catalog (app/seed_data.py) and the "Add
// Product" form both use — keep new categories added there reflected here.
export const PRODUCT_CATEGORIES = [
  "Men",
  "Women",
  "Kids",
  "Accessories",
] as const;

// The subset customers browse/search — Accessories is deliberately left
// out (garments only, per the storefront's scope), but stays in
// PRODUCT_CATEGORIES above so the admin "Add Product" form can still
// categorize/manage the accessory items already in the catalog.
export const STOREFRONT_CATEGORIES = ["Men", "Women", "Kids"] as const;

export interface Product {
  productId: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  imageKeys: string[];
  status: ProductStatus;
}

export type ChangeType =
  | "price_update"
  | "stock_update"
  | "description_update"
  | "new_listing";
export type ChangeRequestStatus = "pending" | "approved" | "rejected";

export interface InventoryChangeRequest {
  requestId: string;
  productId: string;
  submittedBy: string;
  changeType: ChangeType;
  payload: Partial<Product>;
  status: ChangeRequestStatus;
  reviewedBy?: string;
  note?: string;
  createdAt: string;
  decidedAt?: string;
}
