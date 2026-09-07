import { Link } from 'react-router-dom';

/**
 * Visual reference: artboard "Shopping Bag" at
 * https://claude.ai/code/artifact/0a1f84d7-6dee-43e5-8d32-6c514f68b1a1
 * Cart state isn't wired up yet — this renders whatever a future
 * CartContext / store provides. Left as a placeholder shell so the route
 * and checkout hand-off exist from day one.
 */
export default function Cart() {
  return (
    <div style={{ padding: '32px 48px' }}>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Shopping Bag</h1>
      <p style={{ color: 'var(--ink-muted)' }}>
        TODO: read cart items from CartContext (or similar) once cart state exists.
      </p>
      <Link
        to="/checkout"
        style={{
          display: 'inline-block',
          marginTop: 16,
          height: 48,
          lineHeight: '48px',
          padding: '0 24px',
          background: 'var(--accent)',
          color: '#fff',
        }}
      >
        Proceed to Checkout
      </Link>
    </div>
  );
}
