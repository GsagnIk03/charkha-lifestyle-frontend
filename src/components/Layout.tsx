import { Outlet } from 'react-router-dom';

/**
 * Shared page frame. The storefront header/footer live inside individual
 * page components for now (matching the mockups at
 * https://claude.ai/code/artifact/0a1f84d7-6dee-43e5-8d32-6c514f68b1a1) —
 * pull the header/footer markup out into components here once the visual
 * design is finalized and stops moving.
 */
export default function Layout() {
  return <Outlet />;
}
