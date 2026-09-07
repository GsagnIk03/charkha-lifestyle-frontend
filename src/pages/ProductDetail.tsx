import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../api/client';
import type { Product } from '../api/types';

/**
 * Visual reference: artboard "Product Detail" at
 * https://claude.ai/code/artifact/0a1f84d7-6dee-43e5-8d32-6c514f68b1a1
 * Size/color selection and "Add to Bag" are UI-only until the cart state
 * (context or a small store) is built.
 */
export default function ProductDetail() {
  const { productId } = useParams();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!productId) return;
    apiRequest<Product>(`/products/${productId}`).then(setProduct);
  }, [productId]);

  if (!product) {
    return <div style={{ padding: '32px 48px', color: 'var(--ink-muted)' }}>Loading&hellip;</div>;
  }

  return (
    <div style={{ display: 'flex', gap: 48, padding: '32px 48px' }}>
      <div style={{ flex: '0 0 500px', aspectRatio: '3 / 4', background: 'var(--border)' }} />
      <div style={{ flex: 1, maxWidth: 460 }}>
        <h1 style={{ fontSize: 28 }}>{product.name}</h1>
        <div style={{ fontSize: 24, fontWeight: 600, margin: '12px 0' }}>
          &#8377;{product.price.toLocaleString('en-IN')}
        </div>
        <p style={{ color: 'var(--ink-muted)' }}>{product.description}</p>
        <button
          style={{
            height: 48,
            padding: '0 24px',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            fontWeight: 600,
            marginTop: 16,
          }}
        >
          Add to Bag
        </button>
      </div>
    </div>
  );
}
