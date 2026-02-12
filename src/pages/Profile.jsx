import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import MotionButton from '../components/MotionButton.jsx'

function Profile() {
  const [orders, setOrders] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [showSignOut, setShowSignOut] = useState(false)
  const [status, setStatus] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data?.user
      if (!user) {
        navigate('/login')
        return
      }
      const role = user.user_metadata?.role ?? 'customer'
      setIsAdmin(role === 'admin')

      const { data: orderRows, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (ordersError) {
        setStatus(ordersError.message)
        setOrders([])
        return
      }

      const orderList = orderRows ?? []
      if (orderList.length === 0) {
        setOrders([])
        return
      }

      const orderIds = orderList.map((order) => order.id)
      const { data: itemRows } = await supabase.from('order_items').select('*').in('order_id', orderIds)

      const itemsByOrderId = (itemRows ?? []).reduce((acc, item) => {
        const key = item.order_id
        if (!acc[key]) acc[key] = []
        acc[key].push({
          id: item.id ?? `${key}-${item.product_id}`,
          name: item.product_name ?? 'Product',
          qty: Number(item.qty || 0),
          price: Number(item.price || 0),
        })
        return acc
      }, {})

      const mappedOrders = orderList.map((order) => ({
        id: order.id,
        date: order.created_at ?? order.date ?? new Date().toISOString(),
        total: Number(order.total || 0),
        items: itemsByOrderId[order.id] ?? (Array.isArray(order.items) ? order.items : []),
      }))

      setOrders(mappedOrders)
    }

    loadUser()
  }, [navigate])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <section className="space-y-8">
      <div className="border border-[var(--ink)] bg-white px-6 py-8 md:px-10">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--ink)]/65">Profile</p>
        <h1 className="mt-3 text-4xl font-black uppercase leading-none md:text-5xl">Your purchase history</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink)]/75">
          Review your past orders and keep track of your ritual essentials.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {isAdmin && (
            <Link
              to="/admin"
              className="border border-[var(--ink)] px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] transition hover:bg-[var(--ink)] hover:text-white"
            >
              Go to admin dashboard
            </Link>
          )}
          <MotionButton
            onClick={() => setShowSignOut(true)}
            className="border border-[var(--ink)] bg-[var(--ink)] px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-white"
          >
            Sign out
          </MotionButton>
        </div>
      </div>

      <div className="space-y-4">
        {status && (
          <div className="border border-red-400 bg-red-50 p-4 text-sm text-red-700">
            {status}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="border border-[var(--ink)] bg-white p-6 text-sm text-[var(--ink)]/70">
            No purchases yet. Complete a checkout to see your history here.
          </div>
        ) : (
          orders.map((order) => (
            <article key={order.id} className="border border-[var(--ink)] bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ink)] pb-3">
                <p className="text-lg font-black uppercase">Order {order.id.slice(0, 8)}</p>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--ink)]/65">
                  {new Date(order.date).toLocaleDateString()}
                </p>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3">
                    <span className="text-[var(--ink)]/80">{item.name}</span>
                    <span className="text-[var(--ink)]/80">
                      {item.qty} x PHP {Number(item.price || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-between border-t border-[var(--ink)] pt-3 text-sm font-black">
                <span>Total</span>
                <span>PHP {Number(order.total || 0).toFixed(2)}</span>
              </div>
            </article>
          ))
        )}
      </div>

      {showSignOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-6">
          <div className="w-full max-w-md border border-[var(--ink)] bg-white p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--ink)]/65">Confirm</p>
            <h2 className="mt-2 text-2xl font-black uppercase">Sign out?</h2>
            <p className="mt-3 text-sm text-[var(--ink)]/75">
              You can sign back in anytime with your email and password.
            </p>
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
    </section>
  )
}

export default Profile
