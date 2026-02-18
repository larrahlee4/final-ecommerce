import { useMemo } from "react"
import { AnimatePresence, motion } from "framer-motion"

const Motion = motion

const pageMotion = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
}

function AdminIcon({ name, className = "h-4 w-4" }) {
  const base = { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: "1.8" }
  if (name === "dashboard") {
    return (
      <svg className={className} {...base}>
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="5" rx="1.5" />
        <rect x="13" y="10" width="8" height="11" rx="1.5" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" />
      </svg>
    )
  }
  if (name === "activity") {
    return (
      <svg className={className} {...base}>
        <path d="M3 12h4l2-5 4 10 2-5h6" />
      </svg>
    )
  }
  if (name === "orders") {
    return (
      <svg className={className} {...base}>
        <path d="M4 7h16M4 12h16M4 17h10" />
      </svg>
    )
  }
  if (name === "users") {
    return (
      <svg className={className} {...base}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 19c1.4-2.8 3.7-4 6-4s4.6 1.2 6 4" />
        <path d="M17 8h4M19 6v4" />
      </svg>
    )
  }
  if (name === "customers") {
    return (
      <svg className={className} {...base}>
        <circle cx="8" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M2.5 19c1.3-2.8 3.3-4 5.5-4s4.2 1.2 5.5 4" />
        <path d="M13 19c.8-1.8 2.2-2.8 4-2.8 1.8 0 3.2 1 4 2.8" />
      </svg>
    )
  }
  if (name === "products") {
    return (
      <svg className={className} {...base}>
        <path d="M3 7l9-4 9 4-9 4-9-4z" />
        <path d="M3 7v10l9 4 9-4V7" />
      </svg>
    )
  }
  if (name === "analytics") {
    return (
      <svg className={className} {...base}>
        <path d="M4 19V9M10 19V5M16 19v-7M22 19v-3" />
      </svg>
    )
  }
  if (name === "settings") {
    return (
      <svg className={className} {...base}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2h.1a1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9h.1a1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1v.1a1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6z" />
      </svg>
    )
  }
  if (name === "refresh") {
    return (
      <svg className={className} {...base}>
        <path d="M21 12a9 9 0 1 1-2.6-6.4" />
        <path d="M21 3v6h-6" />
      </svg>
    )
  }
  return null
}

const toCurrency = (value) => `PHP ${Number(value || 0).toFixed(2)}`

const sumRevenue = (rows) =>
  rows.reduce((sum, row) => sum + Number(row.total || 0), 0)

const averageOrderValue = (total, count) => (count > 0 ? total / count : 0)

const startOfDay = (date) => {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function PlaceholderPanel({ title }) {
  return (
    <Motion.section
      {...pageMotion}
      transition={{ duration: 0.25 }}
      className="rounded-3xl border border-white/40 bg-white/55 p-6 shadow-xl shadow-black/5 backdrop-blur-xl"
    >
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">
        Previous admin functionality is focused on Product Management and Activity Logs.
      </p>
    </Motion.section>
  )
}

function ActivityPage({ loadingActions, adminActions, activityPage, setActivityPage, onRefresh }) {
  const rowsPerPage = 8
  const totalPages = Math.max(1, Math.ceil(adminActions.length / rowsPerPage))
  const safePage = Math.min(activityPage, totalPages)
  const pageRows = adminActions.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage)

  return (
    <Motion.section
      {...pageMotion}
      transition={{ duration: 0.25 }}
      className="rounded-3xl border border-white/40 bg-white/55 p-6 shadow-xl shadow-black/5 backdrop-blur-xl"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-slate-900">
          <AdminIcon name="activity" className="h-5 w-5" />
          Recent Activity
        </h2>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
        >
          <AdminIcon name="refresh" className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>
      <div className="space-y-3">
        {loadingActions && <p className="text-sm text-slate-500">Loading activity...</p>}
        {!loadingActions && adminActions.length === 0 && (
          <p className="text-sm text-slate-500">No admin actions recorded yet.</p>
        )}
        {!loadingActions &&
          pageRows.map((entry) => (
            <article key={entry.id} className="rounded-2xl border border-slate-200/70 bg-white/75 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.09em] text-slate-500">
                  {entry.admin_email || entry.admin_user_id}
                </p>
                <p className="text-[11px] text-slate-400">
                  {new Date(entry.created_at).toLocaleString()}
                </p>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-800">{entry.action_type}</p>
              <p className="mt-1 text-xs text-slate-500">
                {entry.summary || `${entry.target_type}: ${entry.target_id || "N/A"}`}
              </p>
            </article>
          ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Page {safePage} of {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActivityPage((prev) => Math.max(1, prev - 1))}
            disabled={safePage === 1}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs disabled:opacity-40"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setActivityPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={safePage === totalPages}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </Motion.section>
  )
}

function UsersPage({
  loadingAdminAccounts,
  adminAccounts,
  userSearch,
  setUserSearch,
  userSortBy,
  userSortDirection,
  onSortUsers,
  userPage,
  setUserPage,
  onRefresh,
}) {
  const getLogStatus = (item) => {
    if (!item.lastSeen || item.actionCount <= 0) return "No logs"
    const lastSeenAt = new Date(item.lastSeen).getTime()
    if (Number.isNaN(lastSeenAt)) return "Unknown"
    return "Logged"
  }

  const filteredAdmins = useMemo(() => {
    const query = userSearch.trim().toLowerCase()
    if (!query) return adminAccounts
    return adminAccounts.filter((item) =>
      [item.adminEmail, item.adminUserId]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(query)),
    )
  }, [adminAccounts, userSearch])

  const sortedAdmins = useMemo(() => {
    const next = [...filteredAdmins]
    next.sort((a, b) => {
      const left = a[userSortBy]
      const right = b[userSortBy]
      const direction = userSortDirection === "asc" ? 1 : -1
      if (typeof left === "number" && typeof right === "number") return (left - right) * direction
      return String(left ?? "").localeCompare(String(right ?? "")) * direction
    })
    return next
  }, [filteredAdmins, userSortBy, userSortDirection])

  const rowsPerPage = 8
  const totalPages = Math.max(1, Math.ceil(sortedAdmins.length / rowsPerPage))
  const safePage = Math.min(userPage, totalPages)
  const pageRows = sortedAdmins.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage)

  return (
    <Motion.section
      {...pageMotion}
      transition={{ duration: 0.25 }}
      className="space-y-4 rounded-3xl border border-white/40 bg-white/55 p-6 shadow-xl shadow-black/5 backdrop-blur-xl"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-slate-900">
          <AdminIcon name="users" className="h-5 w-5" />
          Admin Accounts
        </h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="search"
            value={userSearch}
            onChange={(event) => {
              setUserSearch(event.target.value)
              setUserPage(1)
            }}
            placeholder="Search admin by email or id..."
            className="w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm outline-none sm:w-72"
          />
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
          >
            <AdminIcon name="refresh" className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-left">
          <thead>
            <tr>
              {[
                ["adminEmail", "Email"],
                ["adminUserId", "Admin ID"],
                ["logStatus", "Log Status"],
                ["actionCount", "Logged Actions"],
                ["lastSeen", "Last Seen"],
              ].map(([key, label]) => {
                const active = userSortBy === key
                const indicator = active ? (userSortDirection === "asc" ? "^" : "v") : ""
                return (
                  <th key={key} className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    <button
                      type="button"
                      onClick={() => onSortUsers(key)}
                      className="inline-flex items-center gap-1 transition-colors hover:text-slate-900"
                    >
                      {label}
                      <span>{indicator}</span>
                    </button>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {loadingAdminAccounts && (
              <tr>
                <td colSpan={5} className="rounded-xl bg-white/80 px-3 py-8 text-center text-sm text-slate-500">
                  Loading admin accounts...
                </td>
              </tr>
            )}
            {!loadingAdminAccounts && pageRows.length === 0 && (
              <tr>
                <td colSpan={5} className="rounded-xl bg-white/80 px-3 py-8 text-center text-sm text-slate-500">
                  No admin accounts found.
                </td>
              </tr>
            )}
            {!loadingAdminAccounts &&
              pageRows.map((item) => (
                <tr key={`${item.adminUserId}-${item.adminEmail}`} className="rounded-xl bg-white/80 shadow-sm">
                  <td className="px-3 py-3 text-sm text-slate-700">{item.adminEmail || "N/A"}</td>
                  <td className="px-3 py-3 text-sm text-slate-700">{item.adminUserId || "N/A"}</td>
                  <td className="px-3 py-3 text-sm text-slate-700">{getLogStatus(item)}</td>
                  <td className="px-3 py-3 text-sm text-slate-700">{item.actionCount}</td>
                  <td className="px-3 py-3 text-sm text-slate-700">
                    {item.lastSeen ? new Date(item.lastSeen).toLocaleString() : "No activity yet"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Page {safePage} of {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setUserPage((prev) => Math.max(1, prev - 1))}
            disabled={safePage === 1}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs disabled:opacity-40"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setUserPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={safePage === totalPages}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </Motion.section>
  )
}

function OrdersPage({ loadingOrders, orders, onRefresh }) {
  return (
    <Motion.section
      {...pageMotion}
      transition={{ duration: 0.25 }}
      className="space-y-4 rounded-3xl border border-white/40 bg-white/55 p-6 shadow-xl shadow-black/5 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-slate-900">
          <AdminIcon name="orders" className="h-5 w-5" />
          Orders
        </h2>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
        >
          <AdminIcon name="refresh" className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[940px] border-separate border-spacing-y-2 text-left">
          <thead>
            <tr>
              {["Order", "Created", "Customer", "Address", "Total", "Payment status", "Confirmed at"].map((label) => (
                <th key={label} className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loadingOrders && (
              <tr>
                <td colSpan={7} className="rounded-xl bg-white/80 px-3 py-8 text-center text-sm text-slate-500">
                  Loading orders...
                </td>
              </tr>
            )}
            {!loadingOrders && orders.length === 0 && (
              <tr>
                <td colSpan={7} className="rounded-xl bg-white/80 px-3 py-8 text-center text-sm text-slate-500">
                  No orders found.
                </td>
              </tr>
            )}
            {!loadingOrders &&
              orders.map((order) => (
                <tr key={order.id} className="rounded-xl bg-white/80 shadow-sm">
                  <td className="px-3 py-3 text-sm text-slate-700">{order.id.slice(0, 8)}</td>
                  <td className="px-3 py-3 text-sm text-slate-700">{new Date(order.created_at).toLocaleString()}</td>
                  <td className="px-3 py-3 text-sm text-slate-700">{order.user_id}</td>
                  <td className="max-w-sm px-3 py-3 text-xs text-slate-700">{order.address || "N/A"}</td>
                  <td className="px-3 py-3 text-sm text-slate-700">PHP {Number(order.total || 0).toFixed(2)}</td>
                  <td className="px-3 py-3 text-sm text-slate-700">{order.payment_status || "pending"}</td>
                  <td className="px-3 py-3 text-xs text-slate-700">
                    {order.payment_confirmed_at ? new Date(order.payment_confirmed_at).toLocaleString() : "-"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </Motion.section>
  )
}

function CustomersPage({
  loadingCustomers,
  customers,
  customerSearch,
  setCustomerSearch,
  customerPage,
  setCustomerPage,
  onRefresh,
  onOpenCustomer,
}) {
  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase()
    if (!query) return customers
    return customers.filter((customer) =>
      [
        customer.customerId,
        customer.fullName,
        customer.phone,
        customer.latestAddress,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(query)),
    )
  }, [customers, customerSearch])

  const rowsPerPage = 8
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / rowsPerPage))
  const safePage = Math.min(customerPage, totalPages)
  const pageRows = filteredCustomers.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage)
  const repeatCustomers = customers.filter((item) => item.orderCount > 1).length
  const repeatRate = customers.length > 0 ? (repeatCustomers / customers.length) * 100 : 0

  return (
    <Motion.section
      {...pageMotion}
      transition={{ duration: 0.25 }}
      className="space-y-4 rounded-3xl border border-white/40 bg-white/55 p-6 shadow-xl shadow-black/5 backdrop-blur-xl"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-slate-900">
          <AdminIcon name="customers" className="h-5 w-5" />
          Customer History
        </h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="search"
            value={customerSearch}
            onChange={(event) => {
              setCustomerSearch(event.target.value)
              setCustomerPage(1)
            }}
            placeholder="Search by customer, name, phone, address..."
            className="w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm outline-none sm:w-80"
          />
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
          >
            <AdminIcon name="refresh" className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Motion.article
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24 }}
          whileHover={{ y: -2 }}
          className="rounded-2xl border border-slate-200/70 bg-white/80 p-3"
        >
          <p className="text-[11px] uppercase tracking-[0.13em] text-slate-500">Customers</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{customers.length}</p>
        </Motion.article>
        <Motion.article
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.04 }}
          whileHover={{ y: -2 }}
          className="rounded-2xl border border-slate-200/70 bg-white/80 p-3"
        >
          <p className="text-[11px] uppercase tracking-[0.13em] text-slate-500">Repeat Buyers</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{repeatCustomers}</p>
        </Motion.article>
        <Motion.article
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.08 }}
          whileHover={{ y: -2 }}
          className="rounded-2xl border border-slate-200/70 bg-white/80 p-3"
        >
          <p className="text-[11px] uppercase tracking-[0.13em] text-slate-500">Repeat Rate</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{repeatRate.toFixed(1)}%</p>
        </Motion.article>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-separate border-spacing-y-2 text-left">
          <thead>
            <tr>
              {["Customer", "Orders", "LTV", "Avg Order", "Repeat", "Last Order", "Actions"].map((label) => (
                <th key={label} className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loadingCustomers && (
              <tr>
                <td colSpan={7} className="rounded-xl bg-white/80 px-3 py-8 text-center text-sm text-slate-500">
                  Loading customer history...
                </td>
              </tr>
            )}
            {!loadingCustomers && pageRows.length === 0 && (
              <tr>
                <td colSpan={7} className="rounded-xl bg-white/80 px-3 py-8 text-center text-sm text-slate-500">
                  No customers found.
                </td>
              </tr>
            )}
            {!loadingCustomers &&
              pageRows.map((customer) => (
                <Motion.tr
                  key={customer.customerId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-xl bg-white/80 shadow-sm"
                >
                  <td className="px-3 py-3 text-sm text-slate-700">
                    <p className="font-semibold text-slate-800">{customer.fullName || "Customer"}</p>
                    <p className="text-xs text-slate-500">{customer.customerId}</p>
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-700">{customer.orderCount}</td>
                  <td className="px-3 py-3 text-sm text-slate-700">{toCurrency(customer.ltv)}</td>
                  <td className="px-3 py-3 text-sm text-slate-700">{toCurrency(customer.avgOrderValue)}</td>
                  <td className="px-3 py-3 text-sm text-slate-700">{customer.repeatRate.toFixed(1)}%</td>
                  <td className="px-3 py-3 text-sm text-slate-700">
                    {customer.lastOrderAt ? new Date(customer.lastOrderAt).toLocaleString() : "N/A"}
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-700">
                    <button
                      type="button"
                      onClick={() => onOpenCustomer(customer)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                    >
                      View details
                    </button>
                  </td>
                </Motion.tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Page {safePage} of {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCustomerPage((prev) => Math.max(1, prev - 1))}
            disabled={safePage === 1}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs disabled:opacity-40"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setCustomerPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={safePage === totalPages}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </Motion.section>
  )
}

function CustomerDetailDrawer({ customer, onClose }) {
  return (
    <Motion.div
      className="fixed inset-0 z-[80]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button type="button" className="absolute inset-0 bg-black/35" onClick={onClose} aria-label="Close drawer" />
      <Motion.aside
        className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-2xl"
        initial={{ x: 44, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 44, opacity: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Customer Details</p>
            <h3 className="text-xl font-semibold text-slate-900">{customer.fullName || "Customer"}</h3>
            <p className="text-xs text-slate-500">{customer.customerId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
          >
            Close
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] uppercase tracking-[0.13em] text-slate-500">Orders</p>
            <p className="mt-1 text-lg font-semibold">{customer.orderCount}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] uppercase tracking-[0.13em] text-slate-500">LTV</p>
            <p className="mt-1 text-lg font-semibold">{toCurrency(customer.ltv)}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] uppercase tracking-[0.13em] text-slate-500">Avg Order</p>
            <p className="mt-1 text-lg font-semibold">{toCurrency(customer.avgOrderValue)}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] uppercase tracking-[0.13em] text-slate-500">Repeat</p>
            <p className="mt-1 text-lg font-semibold">{customer.repeatRate.toFixed(1)}%</p>
          </article>
        </div>

        <div className="space-y-3">
          {customer.orders.map((order, index) => (
            <Motion.article
              key={order.id}
              className="rounded-xl border border-slate-200 bg-white p-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.16) }}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-slate-800">Order {order.id.slice(0, 8)}</p>
                <p className="text-xs uppercase tracking-[0.08em] text-slate-500">{order.paymentStatus || "pending"}</p>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-500">
                <p>{new Date(order.createdAt).toLocaleString()}</p>
                <p>{toCurrency(order.total)}</p>
              </div>
              <p className="mt-2 text-xs text-slate-600">Address: {order.address || "N/A"}</p>
              {order.notes && <p className="mt-1 text-xs text-slate-600">Notes: {order.notes}</p>}
              <div className="mt-3 space-y-1 border-t border-slate-200 pt-2 text-xs text-slate-700">
                {order.items.length === 0 && <p>No item rows available.</p>}
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2">
                    <p>
                      {item.product_name} x{Number(item.qty || 0)}
                    </p>
                    <p>{toCurrency(Number(item.price || 0) * Number(item.qty || 0))}</p>
                  </div>
                ))}
              </div>
            </Motion.article>
          ))}
        </div>
      </Motion.aside>
    </Motion.div>
  )
}

function AnalyticsPage({ loadingRevenue, revenueStats, orders, customers, onRefresh }) {
  const customerRows = useMemo(() => customers ?? [], [customers])
  const cards = revenueStats
    ? [
        { id: "daily", label: "Daily Revenue", ...revenueStats.daily },
        { id: "weekly", label: "Weekly Revenue", ...revenueStats.weekly },
        { id: "monthly", label: "Monthly Revenue", ...revenueStats.monthly },
        { id: "annual", label: "Annual Revenue", ...revenueStats.annual },
      ]
    : []

  const paidOrders = useMemo(() => {
    return (orders ?? []).filter((row) => {
      const status = String(row.payment_status || "confirmed").toLowerCase()
      return status === "paid" || status === "confirmed"
    })
  }, [orders])

  const statusBreakdown = useMemo(() => {
    const counts = { pending: 0, paid: 0, confirmed: 0, other: 0 }
    for (const row of orders ?? []) {
      const status = String(row.payment_status || "pending").toLowerCase()
      if (status in counts) counts[status] += 1
      else counts.other += 1
    }
    const total = Math.max(1, (orders ?? []).length)
    return [
      { label: "Pending", value: counts.pending, percent: Math.round((counts.pending / total) * 100) },
      { label: "Paid", value: counts.paid, percent: Math.round((counts.paid / total) * 100) },
      { label: "Confirmed", value: counts.confirmed, percent: Math.round((counts.confirmed / total) * 100) },
      { label: "Other", value: counts.other, percent: Math.round((counts.other / total) * 100) },
    ]
  }, [orders])

  const weeklyTrend = useMemo(() => {
    const end = startOfDay(new Date())
    const buckets = []
    for (let i = 7; i >= 0; i -= 1) {
      const start = new Date(end)
      start.setDate(end.getDate() - i * 7)
      const next = new Date(start)
      next.setDate(start.getDate() + 7)
      const bucketOrders = paidOrders.filter((row) => {
        const time = new Date(row.created_at).getTime()
        return time >= start.getTime() && time < next.getTime()
      })
      buckets.push({
        label: `W-${i + 1}`,
        revenue: sumRevenue(bucketOrders),
      })
    }
    const maxRevenue = Math.max(1, ...buckets.map((entry) => entry.revenue))
    return buckets.map((entry) => ({
      ...entry,
      percent: Math.max(6, Math.round((entry.revenue / maxRevenue) * 100)),
    }))
  }, [paidOrders])

  const topCustomers = useMemo(() => {
    const ranked = [...customerRows]
    ranked.sort((a, b) => Number(b.ltv || 0) - Number(a.ltv || 0))
    return ranked.slice(0, 5)
  }, [customerRows])

  const topProducts = useMemo(() => {
    const byProduct = new Map()
    for (const customer of customerRows) {
      for (const order of customer.orders ?? []) {
        const status = String(order.paymentStatus || "pending").toLowerCase()
        if (status !== "paid" && status !== "confirmed") continue
        for (const item of order.items ?? []) {
          const key = item.product_name || "Unnamed product"
          const current = byProduct.get(key) || { name: key, units: 0, revenue: 0 }
          const qty = Number(item.qty || 0)
          const price = Number(item.price || 0)
          current.units += qty
          current.revenue += qty * price
          byProduct.set(key, current)
        }
      }
    }
    const ranked = Array.from(byProduct.values())
    ranked.sort((a, b) => b.revenue - a.revenue)
    return ranked.slice(0, 5)
  }, [customerRows])

  const avgTicket = averageOrderValue(sumRevenue(paidOrders), paidOrders.length)

  return (
    <Motion.section
      {...pageMotion}
      transition={{ duration: 0.25 }}
      className="space-y-4 rounded-3xl border border-white/40 bg-white/55 p-6 shadow-xl shadow-black/5 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-slate-900">
          <AdminIcon name="analytics" className="h-5 w-5" />
          Revenue Analytics
        </h2>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
        >
          <AdminIcon name="refresh" className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {loadingRevenue && <p className="text-sm text-slate-500">Loading revenue analytics...</p>}
      {!loadingRevenue && !revenueStats && <p className="text-sm text-slate-500">No analytics data available.</p>}

      {!loadingRevenue && revenueStats && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            {cards.map((card) => (
              <article key={card.id} className="rounded-2xl border border-slate-200/70 bg-white/80 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{card.label}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{toCurrency(card.total)}</p>
                <div className="mt-4 space-y-1 text-xs text-slate-600">
                  <p>Orders: {card.count}</p>
                  <p>Average order value: {toCurrency(card.avgOrderValue)}</p>
                  <p>Run rate: {card.runRateLabel}</p>
                  <p>
                    Change vs previous period:{" "}
                    {card.growth === null ? "N/A" : `${card.growth >= 0 ? "+" : ""}${card.growth.toFixed(1)}%`}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <article className="rounded-2xl border border-slate-200/70 bg-white/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Paid/Confirmed Orders</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{paidOrders.length}</p>
            </article>
            <article className="rounded-2xl border border-slate-200/70 bg-white/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Average Ticket</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{toCurrency(avgTicket)}</p>
            </article>
            <article className="rounded-2xl border border-slate-200/70 bg-white/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Unique Customers</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{customerRows.length}</p>
            </article>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-600">Payment Status Mix</h3>
              <div className="mt-4 space-y-3">
                {statusBreakdown.map((entry) => (
                  <div key={entry.label}>
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                      <p>{entry.label}</p>
                      <p>
                        {entry.value} ({entry.percent}%)
                      </p>
                    </div>
                    <div className="h-2 rounded bg-slate-100">
                      <div className="h-2 rounded bg-slate-700" style={{ width: `${Math.max(2, entry.percent)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-600">Weekly Revenue Trend (8 weeks)</h3>
              <div className="mt-4 flex h-40 items-end gap-2">
                {weeklyTrend.map((entry) => (
                  <div key={entry.label} className="flex flex-1 flex-col items-center gap-1">
                    <div className="relative flex h-32 w-full items-end rounded bg-slate-100 p-1">
                      <div className="w-full rounded bg-slate-700" style={{ height: `${entry.percent}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-500">{entry.label}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-600">Top Customers by LTV</h3>
              <div className="mt-3 space-y-2 text-sm">
                {topCustomers.length === 0 && <p className="text-slate-500">No customer data.</p>}
                {topCustomers.map((entry) => (
                  <div key={entry.customerId} className="flex items-center justify-between rounded border border-slate-200 bg-white p-2">
                    <p className="truncate pr-3 text-slate-700">{entry.fullName || entry.customerId}</p>
                    <p className="font-semibold text-slate-900">{toCurrency(entry.ltv)}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-600">Top Products by Revenue</h3>
              <div className="mt-3 space-y-2 text-sm">
                {topProducts.length === 0 && <p className="text-slate-500">No product revenue data yet.</p>}
                {topProducts.map((entry) => (
                  <div key={entry.name} className="rounded border border-slate-200 bg-white p-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate pr-3 text-slate-700">{entry.name}</p>
                      <p className="font-semibold text-slate-900">{toCurrency(entry.revenue)}</p>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{entry.units} units sold</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </Motion.section>
  )
}

export {
  ActivityPage,
  AdminIcon,
  AnalyticsPage,
  CustomersPage,
  CustomerDetailDrawer,
  OrdersPage,
  PlaceholderPanel,
  UsersPage,
}

