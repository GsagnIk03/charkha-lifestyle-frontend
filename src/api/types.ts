// Mirrors the charkha-lifestyle-backend repo's app/models.py — keep the two in
// sync by hand, across repos, for now.

export type ProductStatus = 'live' | 'draft';

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

export type ChangeType = 'price_update' | 'stock_update' | 'description_update' | 'new_listing';
export type ChangeRequestStatus = 'pending' | 'approved' | 'rejected';

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
