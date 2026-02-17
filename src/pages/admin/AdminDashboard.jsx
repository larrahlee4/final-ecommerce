import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import MotionButton from '../../components/MotionButton.jsx'

const emptyForm = {
  name: '',
  slug: '',
  category: '',
  description: '',
  price: '',
  image_url: '',
  stock: '',
  is_featured: false,
}

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

function AdminDashboard() {
  const [userRole, setUserRole] = useState(null)
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm)

  const isAdmin = userRole === 'admin'

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id,name,slug,category,description,price,stock,image_url,is_featured')
      .order('created_at', { ascending: false })

    if (error) {
      setStatus(error.message)
      return
    }
    setProducts(data ?? [])
  }

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      const role = data?.user?.user_metadata?.role ?? null
      setUserRole(role)
      if (role === 'admin') {
        await loadProducts()
      }
    }
    init()
  }, [])

  const safeProducts = useMemo(() => products ?? [], [products])

  const onChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const onNameBlur = () => {
    if (!form.slug && form.name) {
      setForm((prev) => ({ ...prev, slug: slugify(prev.name) }))
    }
  }

  const handleCreate = async (event) => {
    event.preventDefault()
    setStatus('')
    setLoading(true)

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      price: Number(form.price || 0),
      image_url: form.image_url.trim(),
      stock: Number(form.stock || 0),
      is_featured: form.is_featured,
    }

    const { error } = await supabase.from('products').insert(payload)
    setLoading(false)

    if (error) {
      setStatus(error.message)
      return
    }

    setForm(emptyForm)
    await loadProducts()
  }

  const openEditModal = (product) => {
    setEditingProduct(product)
    setEditForm({
      name: product.name ?? '',
      slug: product.slug ?? '',
      category: product.category ?? '',
      description: product.description ?? '',
      price: String(product.price ?? ''),
      image_url: product.image_url ?? '',
      stock: String(product.stock ?? ''),
      is_featured: !!product.is_featured,
    })
  }

  const closeEditModal = () => {
    setEditingProduct(null)
    setEditForm(emptyForm)
  }

  const handleEditChange = (event) => {
    const { name, value } = event.target
    setEditForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSaveEdit = async (event) => {
    event.preventDefault()
    setStatus('')
    if (!editingProduct?.id) return

    const updates = {
      name: editForm.name.trim(),
      slug: editForm.slug.trim(),
      category: editForm.category.trim(),
      description: editForm.description.trim(),
      image_url: editForm.image_url.trim(),
      price: Number(editForm.price || 0),
      stock: Number(editForm.stock || 0),
      is_featured: !!editForm.is_featured,
    }

    const { error } = await supabase.from('products').update(updates).eq('id', editingProduct.id)

    if (error) {
      setStatus(error.message)
      return
    }

    closeEditModal()
    await loadProducts()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this product?')) return

    const { error } = await supabase.from('products').delete().eq('id', id)

    if (error) {
      setStatus(error.message)
      return
    }

    await loadProducts()
  }

  if (!isAdmin) {
    return (
      <section className="space-y-4">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--ink)]/65">Admin</p>
        <h1 className="text-4xl font-black uppercase text-[var(--ink)]">Admin access required</h1>
      </section>
    )
  }

  return (
    <section className="min-h-screen space-y-8 overflow-x-hidden bg-[var(--cream)]">
      <div className="border border-[var(--ink)] bg-white px-6 py-8 md:px-10">
        <p className="text-[11px] font-black uppercase tracking-[0.32em] text-[var(--ink)]/65">
          Admin
        </p>
        <h1 className="mt-3 text-4xl font-black uppercase leading-none md:text-5xl">
          Product management
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink)]/75">
          Add, edit, and manage inventory with the same product style system.
        </p>
      </div>

      {status && (
        <div className="border border-red-400 bg-red-50 p-4 text-sm text-red-700">
          {status}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <form
          onSubmit={handleCreate}
          className="grid h-fit max-h-[calc(100vh-8rem)] min-w-0 gap-4 self-start overflow-y-auto border border-[var(--ink)] bg-white p-6 lg:col-span-2 lg:sticky lg:top-24"
        >
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--ink)]/65">
            Add product
          </p>

          {[
            "name",
            "slug",
            "category",
            "image_url",
            "description",
            "price",
            "stock",
          ].map((field) => (
            <label
              key={field}
              className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--ink)]/70"
            >
              {field}
              <input
                name={field}
                value={form[field]}
                onChange={onChange}
                onBlur={field === "name" ? onNameBlur : undefined}
                type={
                  field === "price" || field === "stock" ? "number" : "text"
                }
                min={field === "stock" ? "0" : undefined}
                step={field === "stock" ? "1" : undefined}
                className="mt-2 w-full border border-[var(--ink)] bg-white px-3 py-2 text-sm text-[var(--ink)] outline-none"
              />
            </label>
          ))}

          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--ink)]/70">
              Featured
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({ ...prev, is_featured: true }))
                }
                className={`border px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] ${
                  form.is_featured
                    ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                    : "border-[var(--ink)] bg-white text-[var(--ink)]/70"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({ ...prev, is_featured: false }))
                }
                className={`border px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] ${
                  !form.is_featured
                    ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                    : "border-[var(--ink)] bg-white text-[var(--ink)]/70"
                }`}
              >
                No
              </button>
            </div>
          </div>

          <MotionButton
            disabled={loading}
            className="mt-2 border border-[var(--ink)] bg-[var(--ink)] px-6 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-white disabled:opacity-60"
          >
            {loading ? "Saving..." : "Add product"}
          </MotionButton>
        </form>

        <div className="min-w-0 space-y-4 self-start lg:col-span-1 lg:sticky lg:top-24">
          <div className="flex items-center justify-between border border-[var(--ink)] bg-white px-5 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--ink)]/65">
              Inventory
            </p>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--ink)]/60">
              {safeProducts.length} items
            </p>
          </div>

          <div className="space-y-3">
            {safeProducts.map((product) => (
              <article
                key={product.id}
                className="flex flex-wrap items-start justify-between gap-4 border border-[var(--ink)]/50 bg-[#e7e7e7] p-4 sm:flex-nowrap"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <img
                    src={
                      product.image_url ||
                      "https://placehold.co/640x640?text=No+Image"
                    }
                    alt={product.name}
                    className="h-16 w-16 border border-[var(--ink)] object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-lg font-black uppercase leading-tight text-[var(--ink)] sm:text-2xl">
                      {product.name}
                    </p>
                    <p className="mt-1 text-sm text-[var(--ink)]/75">
                      PHP {Number(product.price || 0).toFixed(2)}
                    </p>
                    <div className="mt-3 inline-flex items-center border border-[var(--ink)]">
                      <span className="px-3 py-1 text-xs font-black uppercase tracking-[0.14em]">
                        Stock
                      </span>
                      <span className="border-l border-[var(--ink)] px-3 py-1 text-sm">
                        {product.stock ?? 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:grid-cols-1">
                  <button
                    type="button"
                    onClick={() => handleDelete(product.id)}
                    className="h-8 w-19 border border-[var(--ink)] uppercase bg-white text-[11px] font-bold text-[var(--ink)] "
                    aria-label={`Remove ${product.name}`}
                    title="Remove"
                  >
                    Remove
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(product)}
                    className="border border-[var(--ink)] bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em]"
                  >
                    Edit
                  </button>
                </div>
              </article>
            ))}

            {safeProducts.length === 0 && (
              <div className="border border-[var(--ink)] bg-white p-6 text-sm text-[var(--ink)]/70">
                No products yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {editingProduct && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-3 sm:p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto border border-[var(--ink)] bg-white p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xl font-black uppercase">Edit product</h3>
              <button
                type="button"
                onClick={closeEditModal}
                className="border border-[var(--ink)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em]"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-2.5">
              {[
                "name",
                "slug",
                "category",
                "image_url",
                "description",
                "price",
                "stock",
              ].map((field) => (
                <label
                  key={field}
                  className="block text-[11px] font-black uppercase tracking-[0.22em] text-[var(--ink)]/70"
                >
                  {field}
                  <input
                    name={field}
                    value={editForm[field]}
                    onChange={handleEditChange}
                    type={
                      field === "price" || field === "stock" ? "number" : "text"
                    }
                    min={field === "stock" ? "0" : undefined}
                    step={field === "stock" ? "1" : undefined}
                    className="mt-2 w-full border border-[var(--ink)] bg-white px-3 py-2 text-sm text-[var(--ink)] outline-none"
                  />
                </label>
              ))}

              <div className="border border-[var(--ink)]/35 bg-[var(--sand)]/15 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--ink)]/65">
                  Restock helper
                </p>
                <div className="mt-2 flex gap-2">
                  {[5, 10, 20].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() =>
                        setEditForm((prev) => ({
                          ...prev,
                          stock: String(Math.max(0, Number(prev.stock || 0)) + amount),
                        }))
                      }
                      className="border border-[var(--ink)] bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em]"
                    >
                      +{amount} stock
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--ink)]/70">
                  Featured
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEditForm((prev) => ({ ...prev, is_featured: true }))
                    }
                    className={`border px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] ${
                      editForm.is_featured
                        ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                        : "border-[var(--ink)] bg-white text-[var(--ink)]/70"
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEditForm((prev) => ({ ...prev, is_featured: false }))
                    }
                    className={`border px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] ${
                      !editForm.is_featured
                        ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                        : "border-[var(--ink)] bg-white text-[var(--ink)]/70"
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="border border-[var(--ink)] px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="border border-[var(--ink)] bg-[var(--ink)] px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-white"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminDashboard
