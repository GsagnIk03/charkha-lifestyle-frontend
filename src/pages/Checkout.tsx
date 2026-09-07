import { useState } from 'react';
import { apiRequest } from '../api/client';

/**
 * Visual reference: artboard "Checkout" at
 * https://claude.ai/code/artifact/0a1f84d7-6dee-43e5-8d32-6c514f68b1a1
 *
 * Payment flow (Razorpay): the backend creates a Razorpay order
 * (POST /orders) and returns an order id + key; this page then opens
 * Razorpay's Checkout widget with those values. Load their checkout.js
 * script (https://checkout.razorpay.com/v1/checkout.js) once this is
 * built out for real — not included yet since it shouldn't load on every
 * page, only here.
 */
export default function Checkout() {
  const [placing, setPlacing] = useState(false);

  async function handlePlaceOrder() {
    setPlacing(true);
    try {
      // TODO: replace with real cart contents once cart state exists.
      await apiRequest('/orders', {
        method: 'POST',
        body: { items: [] },
      });
      // TODO: open Razorpay checkout with the returned order id + key.
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div style={{ padding: '32px 48px' }}>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Checkout</h1>
      <p style={{ color: 'var(--ink-muted)' }}>
        TODO: delivery address form + saved addresses, per the mockup.
      </p>
      <button
        onClick={handlePlaceOrder}
        disabled={placing}
        style={{
          height: 50,
          padding: '0 24px',
          background: 'var(--accent)',
          color: '#fff',
          border: 'none',
          fontWeight: 600,
          marginTop: 16,
        }}
      >
        {placing ? 'Placing Order…' : 'Place Order'}
      </button>
    </div>
  );
}
