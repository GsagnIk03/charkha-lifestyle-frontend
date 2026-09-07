import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../api/client';
import type { Product } from '../api/types';

/**
 * Team-member inventory edit form. Visual reference: artboard
 * "Team Inventory Edit" at
 * https://claude.ai/code/artifact/0a1f84d7-6dee-43e5-8d32-6c514f68b1a1
 *
 * Submitting here creates an InventoryChangeRequest (status "pending") —
 * it never writes to the Product directly. Only the owner's decision on
 * the dashboard does that (see the atelier-backend repo's
 * app/routers/inventory_requests.py).
 */
export default function TeamEdit() {
  const { productId } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!productId) return;
    apiRequest<Product>(`/products/${productId}`).then((p) => {
      setProduct(p);
      setPrice(String(p.price));
      setStock(String(p.stock));
    });
  }, [productId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId) return;
    await apiRequest('/inventory-requests', {
      method: 'POST',
      body: {
        productId,
        changeType: 'price_update',
        payload: { price: Number(price), stock: Number(stock) },
      },
    });
    setSubmitted(true);
  }

  if (!product) {
    return <div style={{ padding: '32px 48px', color: 'var(--ink-muted)' }}>Loading&hellip;</div>;
  }

  return (
    <div style={{ padding: '32px 48px', maxWidth: 480 }}>
      <div
        style={{
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          padding: 16,
          marginBottom: 24,
          fontSize: 13,
          color: 'var(--ink-muted)',
        }}
      >
        Changes you make here are sent to the owner for review. They go live only after approval.
      </div>

      <h1 style={{ fontSize: 22, marginBottom: 20 }}>Edit &mdash; {product.name}</h1>

      {submitted ? (
        <p style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>Submitted for review.</p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label>
            <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 4 }}>Price (&#8377;)</div>
            <input value={price} onChange={(e) => setPrice(e.target.value)} style={{ width: '100%', padding: 10 }} />
          </label>
          <label>
            <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 4 }}>Stock Quantity</div>
            <input value={stock} onChange={(e) => setStock(e.target.value)} style={{ width: '100%', padding: 10 }} />
          </label>
          <button
            type="submit"
            style={{ height: 46, background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 600 }}
          >
            Submit for Review
          </button>
        </form>
      )}
    </div>
  );
}
