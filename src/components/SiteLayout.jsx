import { Outlet, NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase.js";
import { getCart, removeFromCart, updateQty } from "../lib/cart.js";
import "../App.css";

const linkClass = ({ isActive }) =>
  isActive
    ? "text-[var(--gold)]"
    : "text-[var(--ink)]/80 hover:text-[var(--gold)] transition";

function SiteLayout() {
  const [signedIn, setSignedIn] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const isHomePage = location.pathname === "/";

  const updateCartCount = () => {
    const items = getCart();
    setCartItems(items);
    const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
    setCartCount(totalQty);
  };

  const handleDrawerQty = (id, qty) => {
    const nextQty = Math.max(1, Number(qty || 1));
    const items = updateQty(id, nextQty);
    setCartItems(items);
    setCartCount(items.reduce((sum, item) => sum + item.qty, 0));
  };

  const handleDrawerRemove = (id) => {
    const items = removeFromCart(id);
    setCartItems(items);
    setCartCount(items.reduce((sum, item) => sum + item.qty, 0));
  };

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSignedIn(!!data?.session?.user);
      updateCartCount();
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session?.user);
    });

    window.addEventListener("cartChanged", updateCartCount);
    init();

    return () => {
      sub?.subscription?.unsubscribe();
      window.removeEventListener("cartChanged", updateCartCount);
    };
  }, []);

  useEffect(() => {
    if (!isSearchOpen) return;
    setTimeout(() => searchInputRef.current?.focus(), 10);
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen) {
      setSearchQuery("");
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setSearchLoading(false);
        return;
      }

      setSearchLoading(true);
      const { data } = await supabase
        .from("products")
        .select("id,name,slug,price,image_url")
        .ilike("name", `%${searchQuery.trim()}%`)
        .order("created_at", { ascending: false })
        .limit(6);
      setSearchResults(data ?? []);
      setSearchLoading(false);
    }, 220);

    return () => clearTimeout(timer);
  }, [isSearchOpen, searchQuery]);

  useEffect(() => {
    const onEsc = (event) => {
      if (event.key === "Escape") setIsSearchOpen(false);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  useEffect(() => {
    setIsSearchOpen(false);
    setIsCartOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--cream)] text-[var(--ink)]">
      <header className="sticky top-0 z-50 border-b border-[var(--ink)]/10 bg-white/40 px-6 py-6 backdrop-blur-md transition-all duration-300 hover:bg-white/60 md:px-16">
        <nav className="flex flex-wrap items-center justify-between gap-6">
          <Link to="/" className="font-display text-2xl font-bold tracking-wide">
            Veloure Beauty
          </Link>
          <div className="flex flex-wrap items-center gap-8 text-m font-bold">
            <NavLink className={linkClass} to="/">
              Home
            </NavLink>
            <NavLink className={linkClass} to="/about">
              About
            </NavLink>
            <NavLink className={linkClass} to="/products">
              Product
            </NavLink>
            <NavLink className={linkClass} to="/community">
              Community
            </NavLink>
          </div>
          <div className="relative flex items-center gap-4 text-[var(--ink)]/70">
            {!signedIn && (
              <NavLink
                to="/login"
                className="rounded-full border border-[var(--ink)]/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--ink)]/70 transition hover:text-[var(--gold)]"
              >
                Sign in
              </NavLink>
            )}
            <button
              type="button"
              onClick={() => setIsSearchOpen((prev) => !prev)}
              className="rounded-full border border-[var(--ink)]/10 p-2 transition hover:text-[var(--gold)]"
              aria-label="Search"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </button>
            {signedIn && (
              <Link
                to="/profile"
                className="rounded-full border border-[var(--ink)]/10 p-2 transition hover:text-[var(--gold)]"
                aria-label="Account"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c1.8-3.5 5-5 8-5s6.2 1.5 8 5" />
                </svg>
              </Link>
            )}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative rounded-full border border-[var(--ink)]/10 p-2 transition hover:text-[var(--gold)]"
              aria-label="Cart"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path d="M6 6h15l-2 9H8L6 6Z" />
                <path d="M6 6 5 3H2" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--gold)] text-[10px] font-semibold text-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </nav>
      </header>

      {isSearchOpen && (
        <div className="fixed inset-x-0 top-[86px] z-[60] border-b border-[var(--ink)] bg-[#efefef] px-6 py-4 md:px-16">
          <div className="border border-[var(--ink)]/15 bg-[#f6f6f6] px-4 py-3">
            <div className="flex items-center">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="text-[var(--ink)]/75"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search products..."
                className="ml-3 w-full bg-transparent text-sm outline-none placeholder:text-[var(--ink)]/45"
              />
              <button
                type="button"
                className="text-3xl leading-none text-[var(--ink)]/70 transition hover:text-[var(--ink)]"
                onClick={() => setIsSearchOpen(false)}
                aria-label="Close search"
              >
                x
              </button>
            </div>
          </div>

          <div className="mt-4 border-t border-[var(--ink)]/35 pt-3">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--ink)]/55">
              Suggested search terms
            </p>
            <div className="mt-3 flex flex-wrap gap-x-7 gap-y-2">
              {["Collections", "About", "Products", "Help & FAQ", "Shipping & Delivery"].map(
                (term) => (
                  <button
                    key={term}
                    type="button"
                    className="text-sm text-[var(--ink)]/85 transition hover:text-[var(--ink)]"
                    onClick={() => setSearchQuery(term)}
                  >
                    {term}
                  </button>
                ),
              )}
            </div>
          </div>

          {(searchLoading || searchResults.length > 0 || searchQuery.trim()) && (
            <div className="mt-4 border-t border-[var(--ink)]/35 pt-3">
              {searchLoading && (
                <p className="text-sm text-[var(--ink)]/65">Searching...</p>
              )}
              {!searchLoading && searchResults.length === 0 && searchQuery.trim() && (
                <p className="text-sm text-[var(--ink)]/65">No products found.</p>
              )}
              {!searchLoading && searchResults.length > 0 && (
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {searchResults.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className="flex items-center gap-3 border border-[var(--ink)] bg-white px-3 py-2 text-left transition hover:bg-black hover:text-white"
                      onClick={() => navigate(`/product/${item.slug}`)}
                    >
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-11 w-11 border border-[var(--ink)] object-cover"
                      />
                      <div>
                        <p className="text-sm font-black uppercase leading-tight">
                          {item.name}
                        </p>
                        <p className="text-xs">PHP {Number(item.price || 0).toFixed(2)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            className="absolute inset-0 bg-black/20"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close cart"
          />
          <aside className="absolute right-3 top-3 flex h-[100vh] w-[92vw] max-w-[50vw] min-w-[320px] flex-col border border-[var(--ink)] bg-[#efefef] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--ink)] px-5 py-6">
              <p className="text-4xl font-black uppercase leading-none">
                Cart <span className="text-2xl">({cartCount} items)</span>
              </p>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="text-4xl leading-none text-[var(--ink)]/75 transition hover:text-[var(--ink)]"
                aria-label="Close cart"
              >
                x
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {cartItems.length === 0 ? (
                <p className="text-center text-2xl text-[var(--ink)]/85">
                  Your cart is currently empty.
                </p>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="border border-[var(--ink)] bg-white p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="h-16 w-16 border border-[var(--ink)] object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black uppercase">{item.name}</p>
                            <p className="text-xs text-[var(--ink)]/70">
                              PHP {Number(item.price || 0).toFixed(2)}
                            </p>
                            <div className="mt-2 inline-flex items-center border border-[var(--ink)]">
                              <button
                                type="button"
                                onClick={() => handleDrawerQty(item.id, item.qty - 1)}
                                className="h-7 w-7 text-sm"
                                aria-label={`Decrease ${item.name} quantity`}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.qty}
                                onChange={(event) =>
                                  handleDrawerQty(item.id, event.target.value)
                                }
                                className="h-7 w-10 border-x border-[var(--ink)] text-center text-xs outline-none"
                                aria-label={`${item.name} quantity`}
                              />
                              <button
                                type="button"
                                onClick={() => handleDrawerQty(item.id, item.qty + 1)}
                                className="h-7 w-7 text-sm"
                                aria-label={`Increase ${item.name} quantity`}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDrawerRemove(item.id)}
                          className="flex h-7 w-7 items-center justify-center border border-[var(--ink)] text-sm text-[var(--ink)]/75 transition hover:text-[var(--ink)]"
                          aria-label={`Remove ${item.name} from cart`}
                          title="Remove from cart"
                        >
                          x
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-[var(--ink)] px-6 py-6">
              <Link
                to="/checkout-list"
                onClick={() => setIsCartOpen(false)}
                className="mb-3 block w-full border border-[var(--ink)] bg-black px-6 py-4 text-center text-sm font-black uppercase tracking-[0.12em] text-white"
              >
                Proceed to checkout
              </Link>
              <Link
                to="/products"
                onClick={() => setIsCartOpen(false)}
                className="block w-full bg-[#5e5e61] px-6 py-4 text-center text-3xl font-black uppercase tracking-[0.08em] text-white"
              >
                Shop all
              </Link>
            </div>
          </aside>
        </div>
      )}

      <main className={isHomePage ? "flex-1 p-0" : "flex-1 px-6 pb-20 pt-10 md:px-16"}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <Outlet />
        </motion.div>
      </main>

      {!isHomePage && (
        <footer className="border-t border-[var(--ink)]/10 px-6 py-10 text-sm md:px-16">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-display text-2xl font-bold">Veloure Beauty</p>
              <p className="text-[color:var(--ink)]/70">Clean beauty, crafted daily.</p>
            </div>
            <div className="font-bold flex flex-wrap gap-6 text-s uppercase tracking-[0.2em] text-[var(--taupe)]">
              <span className="cursor-pointer transition hover:text-[var(--gold)]">
                Care
              </span>
              <span className="cursor-pointer transition hover:text-[var(--gold)]">
                Community
              </span>
              <span className="cursor-pointer transition hover:text-[var(--gold)]">
                Support
              </span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default SiteLayout;


