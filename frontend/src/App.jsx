import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './auth/ProtectedRoute';
import DashboardHome from './pages/DashboardHome';
import UsersPage from './pages/UsersPage';
import UserDetailPage from './pages/UserDetailPage';
import ProductsPage from './pages/ProductsPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import PlaygroundPage from './pages/PlaygroundPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public routes (read-only queries) */}
        <Route path="/" element={<DashboardHome />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/users/:id" element={<UserDetailPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/playground" element={<PlaygroundPage />} />

        {/* Protected routes (require authentication for mutations) */}
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute>
              <OrderDetailPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
