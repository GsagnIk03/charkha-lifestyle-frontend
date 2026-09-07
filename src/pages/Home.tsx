import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import type { Product } from '../api/types';

/**
 * Storefront home page. Visual reference:
 * https://claude.ai/code/artifact/0a1f84d7-6dee-43e5-8d32-6c514f68b1a1 (artboard "Home")
 * This is a functional skeleton — hero copy, category tiles, and the
 * tailoring teaser are still static; wire them up as that content becomes
 * real (categories from the API, tailoring once that flow is designed).
 */
export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiRequest<Product[]>('/products?status=live&limit=4')
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <header style={{ padding: '20px 48px', borderBottom: '1px solid var(--border)' }}>
        <span className="serif" style={{ fontSize: 24 }}>
          ATELIER
        </span>
      </header>

      <section style={{ padding: '64px 48px' }}>
        <h1 style={{ fontSize: 44 }}>Considered clothing, made to last.</h1>
        <p style={{ color: 'var(--ink-muted)', maxWidth: 420 }}>
          Studio-crafted staples and occasion wear, finished with fabric and fit that hold up beyond a season.
        </p>
      </section>

      <section style={{ padding: '0 48px 64px' }}>
        <h2 style={{ fontSize: 24, marginBottom: 24 }}>New Arrivals</h2>

        {loading && <p style={{ color: 'var(--ink-muted)' }}>Loading&hellip;</p>}
        {error && <p style={{ color: 'var(--ink-muted)' }}>Couldn&rsquo;t load products yet ({error}).</p>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 24 }}>
          {products.map((p) => (
            <Link key={p.productId} to={`/product/${p.productId}`} style={{ color: 'inherit' }}>
              <div style={{ aspectRatio: '3 / 4', background: 'var(--border)' }} />
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 8 }}>{p.name}</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>&#8377;{p.price.toLocaleString('en-IN')}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
