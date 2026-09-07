import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/tokens.css';

import Layout from './components/Layout';
import Home from './pages/Home';
import Listing from './pages/Listing';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TeamEdit from './pages/TeamEdit';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/category/:categorySlug" element={<Listing />} />
          <Route path="/product/:productId" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          {/* TODO: gate these two behind an authenticated + role check once Cognito is wired up */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/inventory/:productId/edit" element={<TeamEdit />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
