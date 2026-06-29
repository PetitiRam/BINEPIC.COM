import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PetitiStyleInjector from './components/PetitiStyleInjector';
import GetStarted from './pages/GetStarted';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyPhone from './pages/VerifyPhone';
import PublicShop from './pages/PublicShop';
import DynamicPage from './pages/DynamicPage';

import SellerUpgrade from './pages/seller/SellerUpgrade';
import SellerDashboard from './pages/seller/SellerDashboard';

import DeliveryUpgrade from './pages/delivery/DeliveryUpgrade';
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';
import DriverDashboard from './pages/delivery/DriverDashboard';

import Marketplace from './pages/buyer/Marketplace';
import ProductDetail from './pages/buyer/ProductDetail';
import Checkout from './pages/buyer/Checkout';
import MyOrders from './pages/buyer/MyOrders';
import OrderTracking from './pages/buyer/OrderTracking';

import AdminPanel from './pages/admin/AdminPanel';

function isAuthed() {
  return !!localStorage.getItem('jedida_access_token');
}

function ProtectedRoute({ children }) {
  return isAuthed() ? children : <Navigate to="/signin" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <PetitiStyleInjector />
      <Routes>
        <Route path="/" element={<GetStarted />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-phone" element={<ProtectedRoute><VerifyPhone /></ProtectedRoute>} />
        <Route path="/s/:slug" element={<PublicShop />} />
        <Route path="/p/:slug" element={<DynamicPage />} />

        {/* Buyer / Main Marketplace */}
        <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
        <Route path="/product/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
        <Route path="/checkout/:productId" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
        <Route path="/orders/:orderId/track" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />

        {/* Seller */}
        <Route path="/seller/upgrade" element={<ProtectedRoute><SellerUpgrade /></ProtectedRoute>} />
        <Route path="/seller" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>} />

        {/* Delivery */}
        <Route path="/delivery/upgrade" element={<ProtectedRoute><DeliveryUpgrade /></ProtectedRoute>} />
        <Route path="/delivery" element={<ProtectedRoute><DeliveryDashboard /></ProtectedRoute>} />
        <Route path="/driver" element={<ProtectedRoute><DriverDashboard /></ProtectedRoute>} />

        {/* Admin (includes the AI Command Center tab) */}
        <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
