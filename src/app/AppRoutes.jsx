import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, GuestRoute } from '../routes/AppRoutes';
import { ROLES } from '../constants/roles';
import AdminLayout from '../layouts/AdminLayout';
import CashierLayout from '../layouts/CashierLayout';
import LoginPage from '../pages/login/LoginPage';
import AdminDashboard from '../pages/dashboard/AdminDashboard';
import ProductsPage from '../pages/products/ProductsPage';
import ProductDetail from '../pages/products/ProductDetail';
import InventoryPage from '../pages/inventory/InventoryPage';
import POSPage from '../pages/sales/POSPage';
import SalesHistoryPage from '../pages/sales/SalesHistoryPage';
import SaleDetailPage from '../pages/sales/SaleDetailPage';
import DailySalesReport from '../pages/reports/DailySalesReport';
import ProductReport from '../pages/reports/ProductReport';
import InventoryReport from '../pages/reports/InventoryReport';
import AnalyticsPage from '../pages/analytics/AnalyticsPage';
import BusinessSettings from '../pages/settings/BusinessSettings';
import UserSettings from '../pages/settings/UserSettings';
import ProfilePage from '../pages/profile/ProfilePage';
import AppShellLayout from '../layouts/AppShellLayout';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />

        <Route path="/admin" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="sales" element={<SalesHistoryPage />} />
          <Route path="sales/:id" element={<SaleDetailPage />} />
          <Route path="reports" element={<AnalyticsPage />} />
          <Route path="reports/daily" element={<DailySalesReport />} />
          <Route path="reports/products" element={<ProductReport />} />
          <Route path="reports/inventory" element={<InventoryReport />} />
          <Route path="settings/business" element={<BusinessSettings />} />
          <Route path="settings/users" element={<UserSettings />} />
        </Route>

        <Route path="/pos" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.CASHIER]}><CashierLayout /></ProtectedRoute>}>
          <Route index element={<POSPage />} />
        </Route>

        <Route path="/profile" element={<ProtectedRoute><AppShellLayout /></ProtectedRoute>}>
          <Route index element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
