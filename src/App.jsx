import { Routes, Route, useLocation } from "react-router-dom";
import SiteLayout from "./components/SiteLayout.jsx";
import Home from "./pages/shop/Home.jsx";
import Shop from "./pages/shop/Shop.jsx";
import Product from "./pages/shop/Product.jsx";
import Cart from "./pages/shop/Cart.jsx";
import Checkout from "./pages/shop/Checkout.jsx";
import CheckoutList from "./pages/shop/CheckoutList.jsx";
import OrderSuccess from "./pages/shop/OrderSuccess.jsx";
import Search from "./pages/shop/Search.jsx";
import Login from "./pages/auth/Login.jsx";
import Signup from "./pages/auth/Signup.jsx";
import Profile from "./pages/auth/Profile.jsx";
import Dashboard from "./pages/auth/Dashboard.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import About from "./pages/content/About.jsx";
import Community from "./pages/content/Community.jsx";
import NotFound from "./pages/system/NotFound.jsx";

function App() {
  const location = useLocation();
  return (
    <Routes location={location}>
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/" element={<SiteLayout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="shop" element={<Shop />} />
        <Route path="products" element={<Shop />} />
        <Route path="product/:slug" element={<Product />} />
        <Route path="cart" element={<Cart />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="search" element={<Search />} />
        <Route path="checkout-list" element={<CheckoutList />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="order-success" element={<OrderSuccess />} />
        <Route path="community" element={<Community />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
