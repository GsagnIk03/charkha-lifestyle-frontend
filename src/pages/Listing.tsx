import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiRequest } from '../api/client';
import type { Product } from '../api/types';

/**
 * Category / listing page. Visual reference: artboard "Product Listing" at
 * https://claude.ai/code/artifact/0a1f84d7-6dee-43e5-8d32-6c514f68b1a1
 * Filters (size, color, price) are shown in the mockup but not wired up
 * here yet — start with category filtering server-side, add the rest once
 * the product schema settles.
 */
export default function Listing() {
  const { categorySlug } = useParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiRequest<Product[]>(`/products?category=${encodeURIComponent(categorySlug ?? '')}`)
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [categorySlug]);

  return (
    <div style={{ padding: '32px 48px' }}>
      <h1 style={{ fontSize: 28, marginBottom: 24, textTransform: 'capitalize' }}>{categorySlug}</h1>

      {loading ? (
        <p style={{ color: 'var(--ink-muted)' }}>Loading&hellip;</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 28 }}>
          {products.map((p) => (
            <Link key={p.productId} to={`/product/${p.productId}`} style={{ color: 'inherit' }}>
              <div style={{ aspectRatio: '3 / 4', background: 'var(--border)' }} />
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 8 }}>{p.name}</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>&#8377;{p.price.toLocaleString('en-IN')}</div>
            </Link>
          ))}
          {products.length === 0 && <p style={{ color: 'var(--ink-muted)' }}>No products in this category yet.</p>}
        </div>
      )}
    </div>
  );
}
