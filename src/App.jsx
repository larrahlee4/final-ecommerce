
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import SiteLayout from './components/SiteLayout.jsx'
import Home from './pages/Home.jsx'
import Shop from './pages/Shop.jsx'
import Product from './pages/Product.jsx'
import Cart from './pages/Cart.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import About from './pages/About.jsx'
import Community from './pages/Community.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import Search from './pages/Search.jsx'
import Profile from './pages/Profile.jsx'
import Signup from './pages/Signup.jsx'
import Checkout from './pages/Checkout.jsx'
import CheckoutList from './pages/CheckoutList.jsx'
import NotFound from './pages/NotFound.jsx'

function App() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
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
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="search" element={<Search />} />
          <Route path="checkout-list" element={<CheckoutList />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="community" element={<Community />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}

export default App
