import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase.js";
import { getCachedUserRole } from "../../lib/authRole.js";
import MotionButton from "../../components/MotionButton.jsx";

const Motion = motion;

const navItems = [
  { id: "account", label: "Account" },
  { id: "orders", label: "Orders" },
];

const pageMotion = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

const emptyProfileDetails = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Philippines",
};

const normalizeProfileDetails = (details) => ({
  fullName: String(details?.fullName ?? "").trim(),
  phone: String(details?.phone ?? "").trim(),
  line1: String(details?.line1 ?? "").trim(),
  line2: String(details?.line2 ?? "").trim(),
  city: String(details?.city ?? "").trim(),
  state: String(details?.state ?? "").trim(),
  postalCode: String(details?.postalCode ?? "").trim(),
  country: "Philippines",
});

const formatProfileAddress = (details) =>
  [details.line1, details.line2, [details.city, details.state, details.postalCode].filter(Boolean).join(", "), details.country]
    .filter(Boolean)
    .join(" | ");

function OrdersPage({ orders, orderPage, setOrderPage }) {
  const rowsPerPage = 5;
  const totalPages = Math.max(1, Math.ceil(orders.length / rowsPerPage));
  const safePage = Math.min(orderPage, totalPages);
  const pageRows = orders.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  return (
    <Motion.section
      {...pageMotion}
      transition={{ duration: 0.24 }}
      className="space-y-4 border border-[var(--ink)] bg-white p-6"
    >
      <h2 className="text-2xl font-black uppercase tracking-[0.06em]">Order history</h2>

      {orders.length === 0 && <p className="text-sm text-[var(--ink)]/70">No purchases yet.</p>}

      <div className="space-y-3">
        {pageRows.map((order) => (
          <article key={order.id} className="border border-[var(--ink)] bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ink)] pb-2">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.08em]">Order {order.id.slice(0, 8)}</p>
                <p className="text-xs text-[var(--ink)]/65">{new Date(order.date).toLocaleString()}</p>
              </div>
              <span className="border border-[var(--ink)] px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em]">
                {order.paymentStatus}
              </span>
            </div>

            <p className="mt-2 text-xs text-[var(--ink)]/75">Address: {order.address || "N/A"}</p>
            {order.notes && <p className="mt-1 text-xs text-[var(--ink)]/75">Notes: {order.notes}</p>}

            <div className="mt-3 space-y-1 text-sm">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2 text-[var(--ink)]/85">
                  <span>{item.name}</span>
                  <span>
                    {item.qty} x PHP {Number(item.price || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3 space-y-1 border-t border-[var(--ink)] pt-2 text-sm text-[var(--ink)]/85">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>PHP {Number(order.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>PHP {Number(order.shippingFee || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black">
                <span>Total</span>
                <span>PHP {Number(order.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {orders.length > rowsPerPage && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--ink)]/70">
            Page {safePage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOrderPage((prev) => Math.max(1, prev - 1))}
              disabled={safePage === 1}
              className="border border-[var(--ink)] bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.08em] disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setOrderPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safePage === totalPages}
              className="border border-[var(--ink)] bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.08em] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </Motion.section>
  );
}

function Profile() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(() => getCachedUserRole());
  const [activePage, setActivePage] = useState("account");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [orders, setOrders] = useState([]);
  const [orderPage, setOrderPage] = useState(1);
  const [showSignOut, setShowSignOut] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [profileDetails, setProfileDetails] = useState(emptyProfileDetails);
  const [preferProfileCheckout, setPreferProfileCheckout] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const isCustomer = userRole === "customer";

  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      setUserEmail(user.email ?? "");
      const role = user.user_metadata?.role ?? getCachedUserRole() ?? "customer";
      setUserRole(role);
      if (role === "admin") {
        navigate("/admin", { replace: true });
        return;
      }
      const savedDetails = normalizeProfileDetails(user.user_metadata?.profile_details ?? {});
      setProfileDetails(savedDetails);
      setPreferProfileCheckout(Boolean(user.user_metadata?.checkout_use_profile_defaults ?? true));

      const { data: orderRows, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .eq("user_id", user.id);

      if (ordersError) {
        setStatus(ordersError.message);
        setOrders([]);
        return;
      }

      const orderList = orderRows ?? [];
      if (orderList.length === 0) {
        setOrders([]);
        return;
      }

      const orderIds = orderList.map((order) => order.id);
      const { data: itemRows } = await supabase
        .from("order_items")
        .select("*")
        .in("order_id", orderIds);

      const itemsByOrderId = (itemRows ?? []).reduce((acc, item) => {
        const key = item.order_id;
        if (!acc[key]) acc[key] = [];
        acc[key].push({
          id: item.id ?? `${key}-${item.product_id}`,
          name: item.product_name ?? "Product",
          qty: Number(item.qty || 0),
          price: Number(item.price || 0),
        });
        return acc;
      }, {});

      const mapped = orderList.map((order) => ({
        id: order.id,
        date: order.created_at ?? new Date().toISOString(),
        total: Number(order.total || 0),
        subtotal: Number(order.subtotal || 0),
        shippingFee: Number(order.shipping_fee || 0),
        address: order.address ?? "",
        notes: order.notes ?? "",
        paymentStatus: order.payment_status ?? "confirmed",
        items: itemsByOrderId[order.id] ?? [],
      }));

      setOrders(mapped);
      setOrderPage(1);
    };

    init();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setStatus("");
    setSavingProfile(true);
    const normalized = normalizeProfileDetails(profileDetails);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setSavingProfile(false);
      setStatus("Please sign in again to save your details.");
      return;
    }

    const nextMetadata = {
      ...(user.user_metadata ?? {}),
      profile_details: normalized,
      checkout_use_profile_defaults: preferProfileCheckout,
    };

    const { error: updateError } = await supabase.auth.updateUser({ data: nextMetadata });
    setSavingProfile(false);

    if (updateError) {
      setStatus(updateError.message);
      return;
    }

    setProfileDetails(normalized);
    setStatus("Profile details saved.");
  };

  if (userRole === null) return null;
  if (!isCustomer) return null;

  return (
    <div className="min-h-[70vh] bg-[#efefef] text-[var(--ink)]">
      <div className="relative flex min-h-[70vh] border border-[var(--ink)]">
        <Motion.aside
          animate={{ width: sidebarCollapsed ? 88 : 252 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="hidden shrink-0 border-r border-[var(--ink)] bg-white px-3 py-4 md:block"
        >
          <div className="mb-5 flex items-center justify-between px-2">
            <span className={`font-black uppercase tracking-[0.08em] ${sidebarCollapsed ? "hidden" : "block"}`}>
              Veloure Beauty
            </span>
            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="border border-[var(--ink)] bg-white px-2 py-1 text-xs font-black"
            >
              {sidebarCollapsed ? ">" : "<"}
            </button>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const active = activePage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActivePage(item.id)}
                  className={`flex w-full items-center gap-3 border px-3 py-3 text-left text-xs font-black uppercase tracking-[0.1em] transition ${
                    active
                      ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                      : "border-[var(--ink)] bg-white text-[var(--ink)] hover:bg-[var(--sand)]/25"
                  }`}
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center border border-current text-xs">
                    {item.label[0]}
                  </span>
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </Motion.aside>

        <AnimatePresence>
          {mobileSidebarOpen && (
            <>
              <Motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileSidebarOpen(false)}
                className="fixed inset-0 z-40 bg-black/40 md:hidden"
              />
              <Motion.aside
                initial={{ x: -260 }}
                animate={{ x: 0 }}
                exit={{ x: -260 }}
                transition={{ duration: 0.22 }}
                className="fixed left-0 top-0 z-50 h-full w-64 border-r border-[var(--ink)] bg-white p-4 shadow-xl md:hidden"
              >
                <p className="mb-4 font-black uppercase tracking-[0.08em]">Veloure Beauty</p>
                <nav className="space-y-2">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActivePage(item.id);
                        setMobileSidebarOpen(false);
                      }}
                      className={`block w-full border px-3 py-2 text-left text-xs font-black uppercase tracking-[0.1em] ${
                        activePage === item.id
                          ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                          : "border-[var(--ink)] bg-white text-[var(--ink)] hover:bg-[var(--sand)]/25"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>
              </Motion.aside>
            </>
          )}
        </AnimatePresence>

        <div className="flex min-h-[70vh] min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-[var(--ink)] bg-white px-4 py-3 md:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(true)}
                  className="border border-[var(--ink)] bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.1em] md:hidden"
                >
                  Menu
                </button>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--ink)]/65">My Profile</p>
                  <h1 className="text-lg font-black uppercase tracking-[0.05em]">
                    {navItems.find((item) => item.id === activePage)?.label}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/products")}
                  className="border border-[var(--ink)] bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.1em]"
                >
                  Shop
                </button>
                <button
                  type="button"
                  onClick={() => setShowSignOut(true)}
                  className="border border-[var(--ink)] bg-[var(--ink)] px-3 py-2 text-xs font-black uppercase tracking-[0.1em] text-white"
                >
                  Sign out
                </button>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
            {status && (
              <div className="border border-red-400 bg-red-50 px-4 py-3 text-sm text-red-700">{status}</div>
            )}

            <AnimatePresence mode="wait">
              {activePage === "orders" && (
                <OrdersPage key="orders" orders={orders} orderPage={orderPage} setOrderPage={setOrderPage} />
              )}

              {activePage === "account" && (
                <Motion.section
                  key="account"
                  {...pageMotion}
                  transition={{ duration: 0.24 }}
                  className="space-y-4"
                >
                  <div className="overflow-hidden border border-[var(--ink)] bg-white">
                    <div className="h-28 border-b border-[var(--ink)] bg-[linear-gradient(120deg,#f8efe2_0%,#f3e5d1_45%,#ead5bb_100%)]" />
                    <div className="px-5 pb-5">
                      <div className="-mt-10 flex items-end gap-3">
                        <div className="grid h-20 w-20 place-items-center border-2 border-[var(--ink)] bg-white text-2xl font-black uppercase">
                          {(profileDetails.fullName || userEmail || "U").trim().charAt(0)}
                        </div>
                        <div className="pb-1">
                          <h2 className="text-2xl font-black uppercase tracking-[0.06em]">
                            {profileDetails.fullName || "Your profile"}
                          </h2>
                          <p className="text-xs text-[var(--ink)]/65">{userEmail || "No email available"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                    <div className="space-y-4 border border-[var(--ink)] bg-white p-5">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--ink)]/65">Personal details</p>
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--ink)]/65">
                          Full name
                          <input
                            name="fullName"
                            value={profileDetails.fullName}
                            onChange={handleProfileChange}
                            className="mt-2 w-full border border-[var(--ink)] px-3 py-2 text-sm outline-none"
                            placeholder="Juan Dela Cruz"
                          />
                        </label>
                        <label className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--ink)]/65">
                          Phone
                          <input
                            name="phone"
                            value={profileDetails.phone}
                            onChange={handleProfileChange}
                            className="mt-2 w-full border border-[var(--ink)] px-3 py-2 text-sm outline-none"
                            placeholder="0917..."
                          />
                        </label>
                        <label className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--ink)]/65 md:col-span-2">
                          Street address
                          <input
                            name="line1"
                            value={profileDetails.line1}
                            onChange={handleProfileChange}
                            className="mt-2 w-full border border-[var(--ink)] px-3 py-2 text-sm outline-none"
                            placeholder="House no., street, subdivision"
                          />
                        </label>
                        <label className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--ink)]/65 md:col-span-2">
                          Unit / landmark
                          <input
                            name="line2"
                            value={profileDetails.line2}
                            onChange={handleProfileChange}
                            className="mt-2 w-full border border-[var(--ink)] px-3 py-2 text-sm outline-none"
                            placeholder="Building, floor, landmark"
                          />
                        </label>
                        <label className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--ink)]/65">
                          City
                          <input
                            name="city"
                            value={profileDetails.city}
                            onChange={handleProfileChange}
                            className="mt-2 w-full border border-[var(--ink)] px-3 py-2 text-sm outline-none"
                          />
                        </label>
                        <label className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--ink)]/65">
                          Province / state
                          <input
                            name="state"
                            value={profileDetails.state}
                            onChange={handleProfileChange}
                            className="mt-2 w-full border border-[var(--ink)] px-3 py-2 text-sm outline-none"
                          />
                        </label>
                        <label className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--ink)]/65">
                          Postal code
                          <input
                            name="postalCode"
                            value={profileDetails.postalCode}
                            onChange={handleProfileChange}
                            className="mt-2 w-full border border-[var(--ink)] px-3 py-2 text-sm outline-none"
                          />
                        </label>
                        <label className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--ink)]/65">
                          Country
                          <input
                            name="country"
                            value="Philippines"
                            readOnly
                            className="mt-2 w-full border border-[var(--ink)] bg-[var(--sand)]/20 px-3 py-2 text-sm outline-none"
                          />
                        </label>
                      </div>
                      <label className="flex items-start gap-2 border border-[var(--ink)] bg-[var(--sand)]/20 px-3 py-2 text-xs text-[var(--ink)]/80">
                        <input
                          type="checkbox"
                          checked={preferProfileCheckout}
                          onChange={(event) => setPreferProfileCheckout(event.target.checked)}
                          className="mt-[2px]"
                        />
                        <span>Use these details as default in checkout.</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleSaveProfile}
                          disabled={savingProfile}
                          className="border border-[var(--ink)] bg-[var(--ink)] px-4 py-2 text-[11px] font-black uppercase tracking-[0.1em] text-white disabled:opacity-50"
                        >
                          {savingProfile ? "Saving..." : "Save profile"}
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate("/products")}
                          className="border border-[var(--ink)] bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.1em]"
                        >
                          Browse products
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="border border-[var(--ink)] bg-white p-5">
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--ink)]/65">Saved for checkout</p>
                        <p className="mt-3 text-sm text-[var(--ink)]/80">
                          {formatProfileAddress(normalizeProfileDetails(profileDetails)) || "No saved address yet."}
                        </p>
                        <p className="mt-2 text-xs text-[var(--ink)]/65">
                          {profileDetails.fullName || profileDetails.phone
                            ? `${profileDetails.fullName || "No name"}${profileDetails.phone ? ` • ${profileDetails.phone}` : ""}`
                            : "Add your full name and phone to speed up checkout."}
                        </p>
                      </div>
                      <div className="border border-[var(--ink)] bg-white p-5">
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--ink)]/65">Session</p>
                        <p className="mt-2 text-sm text-[var(--ink)]/75">Manage your current session from the top bar sign out button.</p>
                      </div>
                    </div>
                  </div>
                </Motion.section>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>

      {showSignOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-6">
          <div className="w-full max-w-md border border-[var(--ink)] bg-white p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--ink)]/65">Confirm</p>
            <h2 className="mt-2 text-2xl font-black uppercase">Sign out?</h2>
            <p className="mt-3 text-sm text-[var(--ink)]/75">You can sign back in anytime with your email and password.</p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <MotionButton
                onClick={() => setShowSignOut(false)}
                className="border border-[var(--ink)] px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em]"
              >
                Cancel
              </MotionButton>
              <MotionButton
                onClick={handleSignOut}
                className="border border-[var(--ink)] bg-[var(--ink)] px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-white"
              >
                Sign out
              </MotionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
