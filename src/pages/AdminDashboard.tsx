import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import type { InventoryChangeRequest, Product } from '../api/types';

/**
 * Owner-only dashboard. Visual reference: artboard "Owner Dashboard" at
 * https://claude.ai/code/artifact/0a1f84d7-6dee-43e5-8d32-6c514f68b1a1
 *
 * TODO: gate this route on the signed-in user's Cognito group being
 * "owner" — a team member hitting this URL directly should be redirected
 * to /admin/inventory/:productId/edit instead.
 */
export default function AdminDashboard() {
  const [pending, setPending] = useState<InventoryChangeRequest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  function refresh() {
    apiRequest<InventoryChangeRequest[]>('/inventory-requests?status=pending').then(setPending);
    apiRequest<Product[]>('/products').then(setProducts);
  }

  useEffect(refresh, []);

  async function decide(requestId: string, decision: 'approved' | 'rejected') {
    await apiRequest(`/inventory-requests/${requestId}`, {
      method: 'PATCH',
      body: { status: decision },
    });
    refresh();
  }

  return (
    <div style={{ padding: '32px 48px' }}>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Dashboard</h1>

      <h2 style={{ fontSize: 18, marginBottom: 12 }}>Pending Approvals</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 40 }}>
        <thead>
          <tr style={{ textAlign: 'left', fontSize: 12, color: 'var(--ink-muted)' }}>
            <th>Submitted By</th>
            <th>Product</th>
            <th>Change</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {pending.map((req) => (
            <tr key={req.requestId} style={{ borderTop: '1px solid var(--border)' }}>
              <td style={{ padding: '10px 0' }}>{req.submittedBy}</td>
              <td>{req.productId}</td>
              <td>{req.changeType}</td>
              <td>
                <button onClick={() => decide(req.requestId, 'approved')} style={{ marginRight: 8 }}>
                  Approve
                </button>
                <button onClick={() => decide(req.requestId, 'rejected')}>Reject</button>
              </td>
            </tr>
          ))}
          {pending.length === 0 && (
            <tr>
              <td colSpan={4} style={{ padding: '10px 0', color: 'var(--ink-muted)' }}>
                Nothing waiting on you right now.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <h2 style={{ fontSize: 18, marginBottom: 12 }}>Inventory</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', fontSize: 12, color: 'var(--ink-muted)' }}>
            <th>Product</th>
            <th>Stock</th>
            <th>Price</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.productId} style={{ borderTop: '1px solid var(--border)' }}>
              <td style={{ padding: '10px 0' }}>{p.name}</td>
              <td>{p.stock}</td>
              <td>&#8377;{p.price.toLocaleString('en-IN')}</td>
              <td>{p.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
