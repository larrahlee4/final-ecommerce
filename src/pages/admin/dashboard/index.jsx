import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../../lib/supabase.js"
import { getCachedUserRole } from "../../../lib/authRole.js"
import { fetchAdminActions, logAdminAction } from "../../../lib/adminAudit.js"
import {
  ActivityPage,
  AdminIcon,
  AnalyticsPage,
  OrdersPage,
  PlaceholderPanel,
  UsersPage,
} from "./AdminDashboardSections.jsx"

const Motion = motion

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "activity", label: "Activity", icon: "activity" },
  { id: "pendingOrders", label: "Pending Orders", icon: "orders" },
  { id: "orders", label: "All Orders", icon: "orders" },
  { id: "users", label: "Users", icon: "users" },
  { id: "products", label: "Products", icon: "products" },
  { id: "analytics", label: "Analytics", icon: "analytics" },
]

const emptyForm = {
  name: "",
  variant: "",
  slug: "",
  category: "",
  description: "",
  price: "",
  image_url: "",
  stock: "",
  is_featured: false,
}

const pageMotion = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
}

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

const normalizeText = (value) => String(value ?? "").trim().toLowerCase()

const toCurrency = (value) => `PHP ${Number(value || 0).toFixed(2)}`

const sumRevenue = (rows) =>
  rows.reduce((sum, row) => sum + Number(row.total || 0), 0)

const averageOrderValue = (total, count) => (count > 0 ? total / count : 0)

const growthPercent = (current, previous) => {
  if (previous <= 0) return null
  return ((current - previous) / previous) * 100
}

const startOfDay = (date) => {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

const startOfWeek = (date) => {
  const copy = startOfDay(date)
  const day = (copy.getDay() + 6) % 7
  copy.setDate(copy.getDate() - day)
  return copy
}

const startOfMonth = (date) => {
  const copy = startOfDay(date)
  copy.setDate(1)
  return copy
}

const startOfYear = (date) => {
  const copy = startOfDay(date)
  copy.setMonth(0, 1)
  return copy
}

function AdminDashboard() {
  const navigate = useNavigate()
  const [userRole, setUserRole] = useState(() => getCachedUserRole())
  const [activePage, setActivePage] = useState("dashboard")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const [status, setStatus] = useState("")
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loadingCreate, setLoadingCreate] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [adminActions, setAdminActions] = useState([])
  const [loadingActions, setLoadingActions] = useState(false)
  const [activityPage, setActivityPage] = useState(1)
  const [adminAccounts, setAdminAccounts] = useState([])
  const [loadingAdminAccounts, setLoadingAdminAccounts] = useState(false)
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [customers, setCustomers] = useState([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [confirmingOrderId, setConfirmingOrderId] = useState("")
  const [revenueStats, setRevenueStats] = useState(null)
  const [loadingRevenue, setLoadingRevenue] = useState(false)

  const [productSearch, setProductSearch] = useState("")
  const [includeArchived, setIncludeArchived] = useState(false)
  const [productSortBy, setProductSortBy] = useState("name")
  const [productSortDirection, setProductSortDirection] = useState("asc")
  const [productPage, setProductPage] = useState(1)
  const [userSearch, setUserSearch] = useState("")
  const [userSortBy, setUserSortBy] = useState("lastSeen")
  const [userSortDirection, setUserSortDirection] = useState("desc")
  const [userPage, setUserPage] = useState(1)

  const isAdmin = userRole === "admin"

  const loadProducts = async (showArchived = includeArchived) => {
    let query = supabase
      .from("products")
      .select("id,name,variant,slug,category,description,price,stock,image_url,is_featured,is_archived,archived_at,created_at")
      .order("created_at", { ascending: false })
    if (!showArchived) {
      query = query.eq("is_archived", false)
    }
    const { data, error } = await query

    if (error) {
      setStatus(error.message)
      return
    }
    setProducts(data ?? [])
  }

  const loadOrders = async () => {
    setLoadingOrders(true)
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)
    setLoadingOrders(false)
    if (error) {
      setStatus(error.message)
      return
    }
    setOrders(data ?? [])
  }

  const loadCustomers = async () => {
    setLoadingCustomers(true)
    const { data: orderRows, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500)

    if (orderError) {
      setLoadingCustomers(false)
      setStatus(orderError.message)
      return
    }

    const orders = orderRows ?? []
    const orderIds = orders.map((row) => row.id).filter(Boolean)
    let itemRows = []
    if (orderIds.length > 0) {
      const { data: fetchedItems, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .in("order_id", orderIds)
      if (itemsError) {
        setLoadingCustomers(false)
        setStatus(itemsError.message)
        return
      }
      itemRows = fetchedItems ?? []
    }

    const itemsByOrder = itemRows.reduce((acc, item) => {
      const key = item.order_id
      if (!acc[key]) acc[key] = []
      acc[key].push(item)
      return acc
    }, {})

    const byCustomer = new Map()
    for (const row of orders) {
      const customerId = row.user_id || "unknown"
      const existing = byCustomer.get(customerId)
      const addressJson = row.address_json && typeof row.address_json === "object" ? row.address_json : {}
      const paymentStatus = row.payment_status || "pending"
      const pendingConfirmation = String(paymentStatus).toLowerCase() === "pending" ? 1 : 0
      const orderEntry = {
        id: row.id,
        total: Number(row.total || 0),
        createdAt: row.created_at,
        paymentStatus,
        confirmedAt: row.payment_confirmed_at || null,
        address: row.address || "",
        notes: row.notes || "",
        items: itemsByOrder[row.id] ?? [],
      }

      if (!existing) {
        byCustomer.set(customerId, {
          customerId,
          fullName: addressJson.fullName || "",
          phone: addressJson.phone || "",
          latestAddress: row.address || "",
          orderCount: 1,
          pendingConfirmationCount: pendingConfirmation,
          ltv: Number(row.total || 0),
          lastOrderAt: row.created_at,
          orders: [orderEntry],
        })
      } else {
        existing.orderCount += 1
        existing.pendingConfirmationCount = (existing.pendingConfirmationCount || 0) + pendingConfirmation
        existing.ltv += Number(row.total || 0)
        existing.orders.push(orderEntry)
      }
    }

    const customers = Array.from(byCustomer.values()).map((item) => {
      const sortedOrders = [...item.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      const repeatRate = item.orderCount > 0 ? ((item.orderCount - 1) / item.orderCount) * 100 : 0
      return {
        ...item,
        avgOrderValue: averageOrderValue(item.ltv, item.orderCount),
        repeatRate,
        lastOrderAt: sortedOrders[0]?.createdAt ?? item.lastOrderAt,
        fullName: item.fullName || "Customer",
        latestAddress: sortedOrders[0]?.address || item.latestAddress,
        orders: sortedOrders,
      }
    })

    customers.sort((a, b) => Number(b.ltv || 0) - Number(a.ltv || 0))
    setCustomers(customers)
    setLoadingCustomers(false)
  }

  const loadRevenueAnalytics = async () => {
    setLoadingRevenue(true)
    const now = new Date()
    const startDayDate = startOfDay(now)
    const startNextDayDate = new Date(startDayDate)
    startNextDayDate.setDate(startNextDayDate.getDate() + 1)
    const startPrevDayDate = new Date(startDayDate)
    startPrevDayDate.setDate(startPrevDayDate.getDate() - 1)
    const startYearDate = startOfYear(now)
    const startMonthDate = startOfMonth(now)
    const startWeekDate = startOfWeek(now)
    const startNextWeekDate = new Date(startWeekDate)
    startNextWeekDate.setDate(startNextWeekDate.getDate() + 7)
    const startPrevWeekDate = new Date(startWeekDate)
    startPrevWeekDate.setDate(startPrevWeekDate.getDate() - 7)
    const startPrevMonthDate = new Date(startMonthDate)
    startPrevMonthDate.setMonth(startPrevMonthDate.getMonth() - 1)
    const startNextMonthDate = new Date(startMonthDate)
    startNextMonthDate.setMonth(startNextMonthDate.getMonth() + 1)
    const startPrevYearDate = new Date(startYearDate)
    startPrevYearDate.setFullYear(startPrevYearDate.getFullYear() - 1)
    const startNextYearDate = new Date(startYearDate)
    startNextYearDate.setFullYear(startNextYearDate.getFullYear() + 1)

    let rows = []
    let errorMessage = ""
    const currentYearQuery = await supabase
      .from("orders")
      .select("id,total,created_at,payment_status")
      .gte("created_at", startPrevYearDate.toISOString())
      .lt("created_at", startNextYearDate.toISOString())

    if (currentYearQuery.error) {
      const fallback = await supabase
        .from("orders")
        .select("id,total,created_at")
        .gte("created_at", startPrevYearDate.toISOString())
        .lt("created_at", startNextYearDate.toISOString())
      rows = fallback.data ?? []
      errorMessage = fallback.error?.message ?? ""
    } else {
      rows = currentYearQuery.data ?? []
    }

    if (errorMessage) {
      setLoadingRevenue(false)
      setStatus(errorMessage)
      setRevenueStats(null)
      return
    }

    const validRows = rows.filter((row) => {
      const timestamp = new Date(row.created_at).getTime()
      if (Number.isNaN(timestamp)) return false
      const status = String(row.payment_status || "pending").toLowerCase()
      return status === "paid" || status === "confirmed"
    })

    const inRange = (row, start, end) => {
      const time = new Date(row.created_at).getTime()
      return time >= start.getTime() && time < end.getTime()
    }

    const weeklyRows = validRows.filter((row) => inRange(row, startWeekDate, startNextWeekDate))
    const previousWeeklyRows = validRows.filter((row) => inRange(row, startPrevWeekDate, startWeekDate))
    const monthlyRows = validRows.filter((row) => inRange(row, startMonthDate, startNextMonthDate))
    const previousMonthlyRows = validRows.filter((row) => inRange(row, startPrevMonthDate, startMonthDate))
    const annualRows = validRows.filter((row) => inRange(row, startYearDate, startNextYearDate))
    const previousAnnualRows = validRows.filter((row) => inRange(row, startPrevYearDate, startYearDate))
    const dailyRows = validRows.filter((row) => inRange(row, startDayDate, startNextDayDate))
    const previousDailyRows = validRows.filter((row) => inRange(row, startPrevDayDate, startDayDate))

    const dailyTotal = sumRevenue(dailyRows)
    const weeklyTotal = sumRevenue(weeklyRows)
    const monthlyTotal = sumRevenue(monthlyRows)
    const annualTotal = sumRevenue(annualRows)

    const hoursElapsedInDay = Math.max(1, now.getHours() + 1)
    const daysElapsedInMonth = Math.max(1, now.getDate())
    const monthsElapsedInYear = Math.max(1, now.getMonth() + 1)

    setRevenueStats({
      daily: {
        total: dailyTotal,
        count: dailyRows.length,
        avgOrderValue: averageOrderValue(dailyTotal, dailyRows.length),
        runRateLabel: `${toCurrency(dailyTotal / hoursElapsedInDay)} / hour`,
        growth: growthPercent(dailyTotal, sumRevenue(previousDailyRows)),
      },
      weekly: {
        total: weeklyTotal,
        count: weeklyRows.length,
        avgOrderValue: averageOrderValue(weeklyTotal, weeklyRows.length),
        runRateLabel: `${toCurrency(weeklyTotal / 7)} / day`,
        growth: growthPercent(weeklyTotal, sumRevenue(previousWeeklyRows)),
      },
      monthly: {
        total: monthlyTotal,
        count: monthlyRows.length,
        avgOrderValue: averageOrderValue(monthlyTotal, monthlyRows.length),
        runRateLabel: `${toCurrency(monthlyTotal / daysElapsedInMonth)} / day`,
        growth: growthPercent(monthlyTotal, sumRevenue(previousMonthlyRows)),
      },
      annual: {
        total: annualTotal,
        count: annualRows.length,
        avgOrderValue: averageOrderValue(annualTotal, annualRows.length),
        runRateLabel: `${toCurrency(annualTotal / monthsElapsedInYear)} / month`,
        growth: growthPercent(annualTotal, sumRevenue(previousAnnualRows)),
      },
    })

    setLoadingRevenue(false)
  }

  const refreshAnalytics = async () => {
    await Promise.all([loadOrders(), loadCustomers(), loadRevenueAnalytics()])
  }

  const loadAdminActions = async () => {
    setLoadingActions(true)
    const { data, error } = await fetchAdminActions(30)
    setLoadingActions(false)
    if (error) {
      setStatus(error.message)
      return
    }
    setAdminActions(data)
    setActivityPage(1)
  }

  const loadAdminAccounts = async (fallbackAdmin) => {
    const sourceAdmin = fallbackAdmin ?? { adminUserId: "", adminEmail: "" }
    setLoadingAdminAccounts(true)
    const { data, error } = await supabase
      .from("admin_action_logs")
      .select("admin_user_id,admin_email,created_at")
      .order("created_at", { ascending: false })
      .limit(1000)
    setLoadingAdminAccounts(false)
    if (error) {
      setStatus(error.message)
      return
    }

    const byAdmin = new Map()
    for (const row of data ?? []) {
      const id = row.admin_user_id ?? ""
      const email = row.admin_email ?? ""
      const key = id || email
      if (!key) continue
      const existing = byAdmin.get(key)
      if (!existing) {
        byAdmin.set(key, {
          adminUserId: id,
          adminEmail: email,
          lastSeen: row.created_at ?? null,
          actionCount: 1,
        })
      } else {
        existing.actionCount += 1
      }
    }

    if ((sourceAdmin?.adminUserId || sourceAdmin?.adminEmail) && !byAdmin.has(sourceAdmin.adminUserId || sourceAdmin.adminEmail)) {
      byAdmin.set(sourceAdmin.adminUserId || sourceAdmin.adminEmail, {
        adminUserId: sourceAdmin.adminUserId,
        adminEmail: sourceAdmin.adminEmail,
        lastSeen: null,
        actionCount: 0,
      })
    }

    setAdminAccounts(Array.from(byAdmin.values()))
  }

  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const sessionUser = sessionData?.session?.user
      const role = sessionData?.session?.user?.user_metadata?.role ?? getCachedUserRole()
      setUserRole(role)
      if (role === "admin") {
        const fallbackAdmin = {
          adminUserId: sessionUser?.id ?? "",
          adminEmail: sessionUser?.email ?? "",
        }
        await Promise.all([
          loadProducts(),
          loadOrders(),
          loadCustomers(),
          loadRevenueAnalytics(),
          loadAdminActions(),
          loadAdminAccounts(fallbackAdmin),
        ])
        await logAdminAction({
          actionType: "admin.dashboard.view",
          targetType: "dashboard",
          summary: "Opened admin dashboard",
        })
      }
    }
    init()
  }, [])

  const onChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const onNameBlur = () => {
    if (!form.slug && form.name) {
      setForm((prev) => ({ ...prev, slug: slugify(prev.name) }))
    }
  }

  const handleCreate = async (event) => {
    event.preventDefault()
    setStatus("")
    setLoadingCreate(true)
    if (!form.name.trim()) {
      setLoadingCreate(false)
      setStatus("Product name is required.")
      return
    }

    const payload = {
      name: form.name.trim(),
      variant: form.variant.trim(),
      slug: form.slug.trim() || slugify(form.name.trim()),
      category: form.category.trim(),
      description: form.description.trim(),
      price: Number(form.price || 0),
      image_url: form.image_url.trim(),
      stock: Number(form.stock || 0),
      is_featured: form.is_featured,
      is_archived: false,
      archived_at: null,
    }

    const nextName = normalizeText(payload.name)
    const nextVariant = normalizeText(payload.variant)
    const hasDuplicate = products.some((item) => {
      if (item?.is_archived) return false
      const currentName = normalizeText(item?.name)
      const currentVariant = normalizeText(item?.variant)
      if (currentName !== nextName) return false
      if (!nextVariant) return true
      return !currentVariant || currentVariant === nextVariant
    })

    if (hasDuplicate) {
      setLoadingCreate(false)
      setStatus("Duplicate product detected. Use a unique name or unique name + variant.")
      return
    }

    const { data, error } = await supabase.from("products").insert(payload).select("id,name").single()
    setLoadingCreate(false)

    if (error) {
      if (error.code === "23505") {
        setStatus("Duplicate product detected. Use a different name/variant or restore the archived item.")
      } else {
        setStatus(error.message)
      }
      return
    }

    await logAdminAction({
      actionType: "product.create",
      targetType: "product",
      targetId: data?.id ?? null,
      summary: `Created product "${payload.name}${payload.variant ? ` (${payload.variant})` : ""}"`,
      metadata: { price: payload.price, stock: payload.stock, featured: payload.is_featured, variant: payload.variant },
    })

    setForm(emptyForm)
    await Promise.all([loadProducts(), loadOrders(), loadAdminActions(), loadAdminAccounts()])
  }

  const openEditModal = (product) => {
    setEditingProduct(product)
    setEditForm({
      name: product.name ?? "",
      variant: product.variant ?? "",
      slug: product.slug ?? "",
      category: product.category ?? "",
      description: product.description ?? "",
      price: String(product.price ?? ""),
      image_url: product.image_url ?? "",
      stock: String(product.stock ?? ""),
      is_featured: !!product.is_featured,
    })
  }

  const closeEditModal = () => {
    setEditingProduct(null)
    setEditForm(emptyForm)
  }

  const handleEditChange = (event) => {
    const { name, value, type, checked } = event.target
    setEditForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSaveEdit = async (event) => {
    event.preventDefault()
    setStatus("")
    if (!editingProduct?.id) return
    if (!editForm.name.trim()) {
      setStatus("Product name is required.")
      return
    }

    const updates = {
      name: editForm.name.trim(),
      variant: editForm.variant.trim(),
      slug: editForm.slug.trim(),
      category: editForm.category.trim(),
      description: editForm.description.trim(),
      image_url: editForm.image_url.trim(),
      price: Number(editForm.price || 0),
      stock: Number(editForm.stock || 0),
      is_featured: !!editForm.is_featured,
    }

    const { error } = await supabase.from("products").update(updates).eq("id", editingProduct.id)
    if (error) {
      if (error.code === "23505") {
        setStatus("Duplicate product detected. Use a different name/variant or archive one of the duplicates.")
      } else {
        setStatus(error.message)
      }
      return
    }

    await logAdminAction({
      actionType: "product.update",
      targetType: "product",
      targetId: editingProduct.id,
      summary: `Updated product "${updates.name}${updates.variant ? ` (${updates.variant})` : ""}"`,
      metadata: { price: updates.price, stock: updates.stock, featured: updates.is_featured, variant: updates.variant },
    })

    closeEditModal()
    await Promise.all([loadProducts(), loadOrders(), loadAdminActions(), loadAdminAccounts()])
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Archive this product? It will be hidden from the storefront.")) return

    const productToArchive = products.find((item) => item.id === id)
    const { error } = await supabase
      .from("products")
      .update({ is_archived: true, archived_at: new Date().toISOString() })
      .eq("id", id)
    if (error) {
      setStatus(error.message)
      return
    }

    await logAdminAction({
      actionType: "product.archive",
      targetType: "product",
      targetId: id,
      summary: `Archived product "${productToArchive?.name ?? id}"`,
    })

    await Promise.all([loadProducts(), loadOrders(), loadAdminActions(), loadAdminAccounts()])
  }

  const handleRestore = async (id) => {
    const productToRestore = products.find((item) => item.id === id)
    const { error } = await supabase
      .from("products")
      .update({ is_archived: false, archived_at: null })
      .eq("id", id)
    if (error) {
      if (error.code === "23505") {
        setStatus("Cannot restore: an active product with the same name/variant already exists.")
      } else {
        setStatus(error.message)
      }
      return
    }

    await logAdminAction({
      actionType: "product.restore",
      targetType: "product",
      targetId: id,
      summary: `Restored product "${productToRestore?.name ?? id}"`,
    })

    await Promise.all([loadProducts(), loadOrders(), loadAdminActions(), loadAdminAccounts()])
  }

  const handleConfirmOrder = async (order) => {
    if (!order?.id) return
    const currentStatus = String(order.payment_status || "pending").toLowerCase()
    if (currentStatus !== "pending" && currentStatus !== "paid") return

    setStatus("")
    setConfirmingOrderId(order.id)

    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: "confirmed",
        payment_confirmed_at: new Date().toISOString(),
      })
      .eq("id", order.id)

    if (error) {
      setStatus(error.message)
      setConfirmingOrderId("")
      return
    }

    await logAdminAction({
      actionType: "order.confirm",
      targetType: "order",
      targetId: order.id,
      summary: `Confirmed order ${order.id.slice(0, 8)}`,
      metadata: { previousStatus: currentStatus, nextStatus: "confirmed" },
    })

    setConfirmingOrderId("")
    await Promise.all([loadOrders(), loadCustomers(), loadRevenueAnalytics(), loadAdminActions(), loadAdminAccounts()])
  }

  const stats = useMemo(() => {
    const totalProducts = products.length
    const totalStock = products.reduce((sum, item) => sum + Number(item.stock || 0), 0)
    const featured = products.filter((item) => item.is_featured).length
    const lowStock = products.filter((item) => Number(item.stock || 0) < 10).length
    return [
      { label: "Products", value: totalProducts, icon: "products" },
      { label: "Total Stock", value: totalStock, icon: "dashboard" },
      { label: "Featured", value: featured, icon: "analytics" },
      { label: "Low Stock", value: lowStock, icon: "activity" },
    ]
  }, [products])

  const revenueSnapshot = useMemo(() => {
    const now = new Date()
    const dayStart = startOfDay(now)
    const weekStart = startOfWeek(now)
    const monthStart = startOfMonth(now)
    const yearStart = startOfYear(now)
    const isPaid = (row) => {
      const status = String(row.payment_status || "pending").toLowerCase()
      return status === "paid" || status === "confirmed"
    }
    const paidOrders = orders.filter(isPaid)
    const daily = paidOrders.filter((row) => new Date(row.created_at) >= dayStart)
    const weekly = paidOrders.filter((row) => new Date(row.created_at) >= weekStart)
    const monthly = paidOrders.filter((row) => new Date(row.created_at) >= monthStart)
    const yearly = paidOrders.filter((row) => new Date(row.created_at) >= yearStart)
    return [
      { label: "Daily Revenue", total: sumRevenue(daily), count: daily.length },
      { label: "Weekly Revenue", total: sumRevenue(weekly), count: weekly.length },
      { label: "Monthly Revenue", total: sumRevenue(monthly), count: monthly.length },
      { label: "Annual Revenue", total: sumRevenue(yearly), count: yearly.length },
    ]
  }, [orders])

  const recentOrders = useMemo(() => {
    const next = [...orders]
    next.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return next.slice(0, 6)
  }, [orders])

  const pendingOrders = useMemo(
    () => orders.filter((row) => String(row.payment_status || "pending").toLowerCase() === "pending"),
    [orders],
  )

  const stockAlerts = useMemo(() => {
    const next = products
      .filter((item) => Number(item.stock || 0) < 10)
      .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0))
    return next.slice(0, 6)
  }, [products])

  const categoryChart = useMemo(() => {
    const counts = {}
    for (const product of products) {
      const key = product.category?.trim() || "Uncategorized"
      counts[key] = (counts[key] || 0) + 1
    }
    const entries = Object.entries(counts).map(([label, value]) => ({ label, value }))
    const total = Math.max(1, entries.reduce((sum, entry) => sum + entry.value, 0))
    entries.sort((a, b) => b.value - a.value)
    return entries.map((entry) => ({
      ...entry,
      percent: Math.max(6, Math.round((entry.value / total) * 100)),
    }))
  }, [products])

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase()
    if (!query) return products
    return products.filter((item) =>
      [item.name, item.variant, item.slug, item.category, item.description]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(query)),
    )
  }, [productSearch, products])

  const sortedProducts = useMemo(() => {
    const next = [...filteredProducts]
    next.sort((a, b) => {
      const left = a[productSortBy]
      const right = b[productSortBy]
      const direction = productSortDirection === "asc" ? 1 : -1
      if (typeof left === "number" && typeof right === "number") return (left - right) * direction
      return String(left ?? "").localeCompare(String(right ?? "")) * direction
    })
    return next
  }, [filteredProducts, productSortBy, productSortDirection])

  const rowsPerPage = 6
  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / rowsPerPage))
  const safePage = Math.min(productPage, totalPages)
  const pageRows = sortedProducts.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage)

  const onSortProducts = (key) => {
    if (productSortBy === key) {
      setProductSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
      return
    }
    setProductSortBy(key)
    setProductSortDirection("asc")
  }

  const onSortUsers = (key) => {
    if (userSortBy === key) {
      setUserSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
      return
    }
    setUserSortBy(key)
    setUserSortDirection("asc")
  }

  const handleAdminLogout = async () => {
    await supabase.auth.signOut()
    navigate("/login", { replace: true })
  }

  if (userRole === null) {
    return (
      <section className="min-h-screen p-6 text-slate-800">
        <p className="text-sm">Loading dashboard...</p>
      </section>
    )
  }

  if (!isAdmin) {
    return (
      <section className="min-h-screen p-6 text-slate-800">
        <p className="text-sm">Admin access required.</p>
      </section>
    )
  }

  return (
    <div className="admin-dashboard min-h-screen bg-[radial-gradient(circle_at_top_left,#f6f0e8,transparent_38%),radial-gradient(circle_at_80%_20%,#e5edf8,transparent_42%),linear-gradient(120deg,#f8fafc,#eef2f7)] text-slate-900">
      <div className="relative flex min-h-screen">
        <Motion.aside
          animate={{ width: sidebarCollapsed ? 88 : 256 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="hidden shrink-0 border-r border-white/40 bg-white/40 px-3 py-4 shadow-xl shadow-black/5 backdrop-blur-xl md:flex md:flex-col"
        >
          <div className="mb-5 flex items-center justify-between px-2">
            <span className={`font-semibold tracking-wide ${sidebarCollapsed ? "hidden" : "block"}`}>
              Veloure Admin
            </span>
            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs"
            >
              {sidebarCollapsed ? ">" : "<"}
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const active = activePage === item.id
              return (
                <Motion.button
                  key={item.id}
                  type="button"
                  onClick={() => setActivePage(item.id)}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                    active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-white/80"
                  }`}
                >
                  <Motion.span
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-black/5 text-xs"
                    animate={active ? { scale: 1.08, rotate: -6 } : { scale: 1, rotate: 0 }}
                    whileHover={{ scale: 1.14, rotate: -10 }}
                    whileTap={{ scale: 0.94, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 320, damping: 18 }}
                  >
                    <AdminIcon name={item.icon ?? item.id} className="h-4 w-4" />
                  </Motion.span>
                  {!sidebarCollapsed && (
                    <Motion.span
                      animate={active ? { x: 1 } : { x: 0 }}
                      whileHover={{ x: 2 }}
                      transition={{ duration: 0.18 }}
                    >
                      {item.label}
                    </Motion.span>
                  )}
                </Motion.button>
              )
            })}
          </nav>
          <button
            type="button"
            onClick={handleAdminLogout}
            className="mt-3 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.08em] text-rose-700"
          >
            {sidebarCollapsed ? "Out" : "Logout"}
          </button>
        </Motion.aside>

        <AnimatePresence>
          {mobileSidebarOpen && (
            <>
              <Motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileSidebarOpen(false)}
                className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
              />
              <Motion.aside
                initial={{ x: -260 }}
                animate={{ x: 0 }}
                exit={{ x: -260 }}
                transition={{ duration: 0.22 }}
                className="fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-white/40 bg-white/80 p-4 shadow-xl backdrop-blur-xl md:hidden"
              >
                <p className="mb-4 font-semibold">Veloure Admin</p>
                <nav className="flex-1 space-y-2">
                  {navItems.map((item) => (
                    <Motion.button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActivePage(item.id)
                        setMobileSidebarOpen(false)
                      }}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm ${
                        activePage === item.id ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-white"
                      }`}
                    >
                      <Motion.span
                        animate={activePage === item.id ? { scale: 1.08, rotate: -6 } : { scale: 1, rotate: 0 }}
                        whileHover={{ scale: 1.14, rotate: -10 }}
                        whileTap={{ scale: 0.94, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 320, damping: 18 }}
                      >
                        <AdminIcon name={item.icon ?? item.id} className="h-4 w-4" />
                      </Motion.span>
                      <Motion.span
                        animate={activePage === item.id ? { x: 1 } : { x: 0 }}
                        whileHover={{ x: 2 }}
                        transition={{ duration: 0.18 }}
                      >
                        {item.label}
                      </Motion.span>
                    </Motion.button>
                  ))}
                </nav>
                <button
                  type="button"
                  onClick={handleAdminLogout}
                  className="mt-3 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.08em] text-rose-700"
                >
                  Logout
                </button>
              </Motion.aside>
            </>
          )}
        </AnimatePresence>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/40 bg-white/45 px-4 py-3 backdrop-blur-xl md:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(true)}
                  className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-xs md:hidden"
                >
                  Menu
                </button>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Admin Panel</p>
                  <h1 className="text-lg font-semibold text-slate-900">
                    {navItems.find((item) => item.id === activePage)?.label}
                  </h1>
                </div>
              </div>
              <Motion.button
                type="button"
                onClick={() => navigate("/")}
                initial={false}
                whileHover="hover"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-700"
              >
                <Motion.span variants={{ hover: { x: 2, rotate: -8 } }} transition={{ duration: 0.2 }}>
                  <AdminIcon name="dashboard" className="h-3.5 w-3.5" />
                </Motion.span>
                <Motion.span variants={{ hover: { x: 4 } }} transition={{ duration: 0.2 }}>
                  Back to Storefront
                </Motion.span>
              </Motion.button>
            </div>
          </header>

          <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
            {status && (
              <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {status}
              </div>
            )}

            <AnimatePresence mode="wait">
              {activePage === "dashboard" && (
                <Motion.div key="dashboard" {...pageMotion} transition={{ duration: 0.25 }} className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {stats.map((stat, index) => (
                      <Motion.article
                        key={stat.label}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.26 }}
                        whileHover={{ y: -4 }}
                        className="rounded-3xl border border-white/40 bg-white/55 p-5 shadow-xl shadow-black/5 backdrop-blur-xl"
                      >
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                          <AdminIcon name={stat.icon} className="h-4 w-4" />
                        </span>
                        <p className="text-xs uppercase tracking-[0.13em] text-slate-500">{stat.label}</p>
                        <p className="mt-2 text-3xl font-semibold text-slate-900">{stat.value}</p>
                      </Motion.article>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {revenueSnapshot.map((entry, index) => (
                      <Motion.article
                        key={entry.label}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.26 }}
                        className="rounded-3xl border border-white/40 bg-white/55 p-5 shadow-xl shadow-black/5 backdrop-blur-xl"
                      >
                        <p className="text-xs uppercase tracking-[0.13em] text-slate-500">{entry.label}</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">{toCurrency(entry.total)}</p>
                        <p className="mt-1 text-xs text-slate-500">{entry.count} orders</p>
                      </Motion.article>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <section className="rounded-3xl border border-white/40 bg-white/55 p-6 shadow-xl shadow-black/5 backdrop-blur-xl">
                      <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-slate-900">
                        <AdminIcon name="products" className="h-5 w-5" />
                        Products by Category
                      </h2>
                      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {categoryChart.length === 0 && (
                          <p className="text-sm text-slate-500">No products yet.</p>
                        )}
                        {categoryChart.map((bar, index) => (
                          <Motion.article
                            key={bar.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.24, delay: index * 0.04 }}
                            className="rounded-xl border border-slate-200/70 bg-white/80 p-3"
                          >
                            <p className="text-[11px] uppercase tracking-[0.13em] text-slate-500">{bar.label}</p>
                            <p className="mt-1 text-2xl font-semibold text-slate-900">{bar.value}</p>
                            <p className="text-xs text-slate-500">{bar.percent}% of catalog</p>
                          </Motion.article>
                        ))}
                      </div>
                    </section>
                  </div>

                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <section className="rounded-3xl border border-white/40 bg-white/55 p-6 shadow-xl shadow-black/5 backdrop-blur-xl">
                      <div className="mb-4 flex items-center justify-between gap-2">
                        <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-slate-900">
                          <AdminIcon name="orders" className="h-5 w-5" />
                          Recent Orders
                        </h2>
                        <button
                          type="button"
                          onClick={() => setActivePage("orders")}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                        >
                          View all
                        </button>
                      </div>
                      <div className="space-y-2">
                        {recentOrders.length === 0 && <p className="text-sm text-slate-500">No orders yet.</p>}
                        {recentOrders.map((order) => (
                          <article key={order.id} className="rounded-xl border border-slate-200/70 bg-white/80 p-3 text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-slate-800">{order.id.slice(0, 8)}</p>
                              <p className="text-xs uppercase text-slate-500">{order.payment_status || "pending"}</p>
                            </div>
                            <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-500">
                              <p>{new Date(order.created_at).toLocaleString()}</p>
                              <p>{toCurrency(order.total)}</p>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>

                    <section className="rounded-3xl border border-white/40 bg-white/55 p-6 shadow-xl shadow-black/5 backdrop-blur-xl">
                      <div className="mb-4 flex items-center justify-between gap-2">
                        <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-slate-900">
                          <AdminIcon name="products" className="h-5 w-5" />
                          Inventory Alerts
                        </h2>
                        <button
                          type="button"
                          onClick={() => setActivePage("products")}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                        >
                          Manage
                        </button>
                      </div>
                      <div className="space-y-2">
                        {stockAlerts.length === 0 && <p className="text-sm text-slate-500">All products are healthy on stock.</p>}
                        {stockAlerts.map((item) => (
                          <article key={item.id} className="rounded-xl border border-slate-200/70 bg-white/80 p-3 text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-slate-800">{item.name}</p>
                              <p className="text-xs uppercase text-rose-600">Stock {Number(item.stock || 0)}</p>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">{item.category || "Uncategorized"}</p>
                          </article>
                        ))}
                      </div>
                    </section>
                  </div>
                </Motion.div>
              )}

              {activePage === "activity" && (
                <ActivityPage
                  key="activity"
                  loadingActions={loadingActions}
                  adminActions={adminActions}
                  activityPage={activityPage}
                  setActivityPage={setActivityPage}
                  onRefresh={loadAdminActions}
                />
              )}

              {activePage === "orders" && (
                <OrdersPage
                  key="orders"
                  loadingOrders={loadingOrders}
                  orders={orders}
                  onRefresh={loadOrders}
                  onConfirmOrder={handleConfirmOrder}
                  confirmingOrderId={confirmingOrderId}
                  title="All Orders"
                />
              )}

              {activePage === "pendingOrders" && (
                <OrdersPage
                  key="pending-orders"
                  loadingOrders={loadingOrders}
                  orders={pendingOrders}
                  onRefresh={loadOrders}
                  onConfirmOrder={handleConfirmOrder}
                  confirmingOrderId={confirmingOrderId}
                  title="Pending Orders"
                  hidePaymentColumns
                />
              )}

              {activePage === "products" && (
                <Motion.div key="products" {...pageMotion} transition={{ duration: 0.25 }} className="space-y-6">
                  <section className="rounded-3xl border border-white/40 bg-white/55 p-6 shadow-xl shadow-black/5 backdrop-blur-xl">
                    <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-slate-900">
                      <AdminIcon name="products" className="h-5 w-5" />
                      Add Product
                    </h2>
                    <form onSubmit={handleCreate} className="mt-4 grid gap-3 md:grid-cols-2">
                      {["name", "variant", "slug", "category", "image_url", "description", "price", "stock"].map((field) => (
                        <label key={field} className="text-xs uppercase tracking-[0.12em] text-slate-500">
                          {field}
                          <input
                            name={field}
                            value={form[field]}
                            onChange={onChange}
                            onBlur={field === "name" ? onNameBlur : undefined}
                            type={field === "price" || field === "stock" ? "number" : "text"}
                            min={field === "stock" ? "0" : undefined}
                            step={field === "stock" ? "1" : undefined}
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm outline-none"
                          />
                        </label>
                      ))}

                      <div className="md:col-span-2">
                        <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            name="is_featured"
                            checked={form.is_featured}
                            onChange={onChange}
                            className="h-4 w-4"
                          />
                          Featured product
                        </label>
                      </div>

                      <div className="md:col-span-2">
                        <button
                          type="submit"
                          disabled={loadingCreate}
                          className="rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                        >
                          {loadingCreate ? "Saving..." : "Add Product"}
                        </button>
                      </div>
                    </form>
                  </section>

                  <section className="rounded-3xl border border-white/40 bg-white/55 p-6 shadow-xl shadow-black/5 backdrop-blur-xl">
                    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-slate-900">
                        <AdminIcon name="products" className="h-5 w-5" />
                        Inventory
                      </h2>
                      <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                        <input
                          type="search"
                          value={productSearch}
                          onChange={(event) => {
                            setProductSearch(event.target.value)
                            setProductPage(1)
                          }}
                          placeholder="Search products..."
                          className="w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm outline-none md:w-72"
                        />
                        <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-xs">
                          <input
                            type="checkbox"
                            checked={includeArchived}
                            onChange={(event) => {
                              const next = event.target.checked
                              setIncludeArchived(next)
                              loadProducts(next)
                            }}
                          />
                          Show archived
                        </label>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[960px] border-separate border-spacing-y-2 text-left">
                        <thead>
                          <tr>
                            {[
                              ["name", "Name"],
                              ["variant", "Variant"],
                              ["slug", "Slug"],
                              ["category", "Category"],
                              ["price", "Price"],
                              ["stock", "Stock"],
                              ["is_featured", "Featured"],
                              ["is_archived", "Status"],
                            ].map(([key, label]) => {
                              const active = productSortBy === key
                              const indicator = active ? (productSortDirection === "asc" ? "^" : "v") : ""
                              return (
                                <th key={key} className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                  <button
                                    type="button"
                                    onClick={() => onSortProducts(key)}
                                    className="inline-flex items-center gap-1 transition-colors hover:text-slate-900"
                                  >
                                    {label}
                                    <span>{indicator}</span>
                                  </button>
                                </th>
                              )
                            })}
                            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {pageRows.length === 0 && (
                            <tr>
                              <td colSpan={9} className="rounded-xl bg-white/80 px-3 py-8 text-center text-sm text-slate-500">
                                No matching records.
                              </td>
                            </tr>
                          )}

                          {pageRows.map((item) => (
                            <tr key={item.id} className="rounded-xl bg-white/80 shadow-sm">
                              <td className="px-3 py-3 text-sm text-slate-700">{item.name}</td>
                              <td className="px-3 py-3 text-sm text-slate-700">{item.variant || "-"}</td>
                              <td className="px-3 py-3 text-sm text-slate-700">{item.slug}</td>
                              <td className="px-3 py-3 text-sm text-slate-700">{item.category || "N/A"}</td>
                              <td className="px-3 py-3 text-sm text-slate-700">${Number(item.price || 0).toFixed(2)}</td>
                              <td className="px-3 py-3 text-sm text-slate-700">{item.stock ?? 0}</td>
                              <td className="px-3 py-3 text-sm text-slate-700">{item.is_featured ? "Yes" : "No"}</td>
                              <td className="px-3 py-3 text-sm text-slate-700">{item.is_archived ? "Archived" : "Active"}</td>
                              <td className="px-3 py-3 text-sm text-slate-700">
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openEditModal(item)}
                                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                                    disabled={item.is_archived}
                                  >
                                    Edit
                                  </button>
                                  {item.is_archived ? (
                                    <button
                                      type="button"
                                      onClick={() => handleRestore(item.id)}
                                      className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700"
                                    >
                                      Restore
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(item.id)}
                                      className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs text-rose-700"
                                    >
                                      Archive
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm text-slate-500">
                        Page {safePage} of {totalPages}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setProductPage((prev) => Math.max(1, prev - 1))}
                          disabled={safePage === 1}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs disabled:opacity-40"
                        >
                          Prev
                        </button>
                        <button
                          type="button"
                          onClick={() => setProductPage((prev) => Math.min(totalPages, prev + 1))}
                          disabled={safePage === totalPages}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </section>
                </Motion.div>
              )}

              {activePage === "users" && (
                <UsersPage
                  key="users"
                  loadingAdminAccounts={loadingAdminAccounts}
                  adminAccounts={adminAccounts}
                  userSearch={userSearch}
                  setUserSearch={setUserSearch}
                  userSortBy={userSortBy}
                  userSortDirection={userSortDirection}
                  onSortUsers={onSortUsers}
                  userPage={userPage}
                  setUserPage={setUserPage}
                  onRefresh={() => loadAdminAccounts()}
                />
              )}
              {activePage === "analytics" && (
                <AnalyticsPage
                  key="analytics"
                  loadingRevenue={loadingRevenue}
                  revenueStats={revenueStats}
                  orders={orders}
                  customers={customers}
                  onRefresh={refreshAnalytics}
                />
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>

      {editingProduct && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-3 sm:p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">Edit Product</h3>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-lg border border-slate-300 px-3 py-1 text-xs"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              {["name", "variant", "slug", "category", "image_url", "description", "price", "stock"].map((field) => (
                <label key={field} className="block text-xs uppercase tracking-[0.12em] text-slate-500">
                  {field}
                  <input
                    name={field}
                    value={editForm[field]}
                    onChange={handleEditChange}
                    type={field === "price" || field === "stock" ? "number" : "text"}
                    min={field === "stock" ? "0" : undefined}
                    step={field === "stock" ? "1" : undefined}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                  />
                </label>
              ))}

              <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={editForm.is_featured}
                  onChange={handleEditChange}
                  className="h-4 w-4"
                />
                Featured product
              </label>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
