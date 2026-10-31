import { Routes, Route, useLocation } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";

import Home from "./pages/home";
import Auth from "./pages/auth";
import Checkout from "./pages/checkout";
import ProductDetails from "./pages/product";
import Cart from "./pages/cart";
import Wishlist from "./pages/wishlist";
import Shop from "./pages/shop";
import StorePublic from "./pages/store";
import OrderConfirmation from "./pages/orderConfirmation";
import BecomeSeller from "./pages/becomeSeller";
import ForgotPassword from "./pages/forgotPassword";
import ResetPassword from "./pages/resetPassword";
import NotFound from "./pages/notfound";
import About from "./pages/about";
import Terms from "./pages/terms";
import Privacy from "./pages/privacy";
import OrderDetail from "./pages/orderDetail";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import DashboardLayout from "./pages/dashboard/dashboardLayout";
import Inventory from "./pages/dashboard/inventory";
import Products from "./pages/dashboard/products";
import Overview from "./pages/dashboard/overview";
import MyOrders from "./pages/dashboard/myOrders";
import Sales from "./pages/dashboard/sales";
import StorePage from "./pages/dashboard/store";
import Notifications from "./pages/dashboard/notifications";
import Settings from "./pages/dashboard/settings";
import Profile from "./pages/dashboard/profile";
import Categories from "./pages/dashboard/categories";
import Sellers from "./pages/dashboard/sellers";
import Disputes from "./pages/dashboard/disputes";
import Deletions from "./pages/dashboard/deletions";
import AuditLog from "./pages/dashboard/auditLog";

import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ToastProvider } from "./context/ToastContext";
import ToastContainer from "./components/ToastContainer";
import { WishlistProvider } from "./context/WishlistContext";
import { NotificationProvider } from "./context/notificationContext";

export default function App() {
  const location = useLocation();
  return (
    <div className="app">
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <NotificationProvider>
                <ToastContainer />
                <Navbar />

              <ErrorBoundary resetKey={location.pathname}>
                <Routes>
                  {/* Guests and everyone */}
                  <Route path="/" element={<Home />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/auth/:mode" element={<Auth />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/products/:id" element={<ProductDetails />} />
                  <Route path="/stores/:id" element={<StorePublic />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {/* Logged in */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/orders/:id/confirmation" element={<OrderConfirmation />} />
                    <Route path="/orders/:id" element={<OrderDetail />} />
                    <Route path="/become-seller" element={<BecomeSeller />} />
                  </Route>

                  {/* Dashboard: buyer, seller, admin */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={["buyer", "seller", "admin"]}>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Overview />} />
                    <Route path="overview" element={<Overview />} />
                    <Route path="notifications" element={<Notifications />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="settings" element={<Settings />} />

                    {/* Buyer and seller (a seller can also buy) */}
                    <Route
                      path="orders"
                      element={
                        <ProtectedRoute allowedRoles={["buyer", "seller"]}>
                          <MyOrders />
                        </ProtectedRoute>
                      }
                    />

                    {/* Seller only */}
                    <Route
                      path="inventory"
                      element={
                        <ProtectedRoute allowedRoles={["seller"]}>
                          <Inventory />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="sales"
                      element={
                        <ProtectedRoute allowedRoles={["seller"]}>
                          <Sales />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="store"
                      element={
                        <ProtectedRoute allowedRoles={["seller"]}>
                          <StorePage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Admin only */}
                    <Route
                      path="products"
                      element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                          <Products />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="categories"
                      element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                          <Categories />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="sellers"
                      element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                          <Sellers />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="disputes"
                      element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                          <Disputes />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="audit"
                      element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                          <AuditLog />
                        </ProtectedRoute>
                      }
                    />
                                        <Route
                      path="deletions"
                      element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                          <Deletions />
                        </ProtectedRoute>
                      }
                    />
                  </Route>

                  <Route
                    path="/unauthorized"
                    element={<h1>403. You don't have access to this page</h1>}
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                </ErrorBoundary>
              </NotificationProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </div>
  );
}