import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import MotionButton from '../components/MotionButton.jsx'

const storageKey = 'veloure_orders'

const loadOrders = () => {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(storageKey)
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function Profile() {
  const [orders, setOrders] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [showSignOut, setShowSignOut] = useState(false)
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
      setOrders(loadOrders())
    }
    loadUser()
  }, [navigate])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <section className="space-y-10">
      <div className="rounded-[2.5rem] bg-[var(--sand)] p-10">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--gold)]">Profile</p>
        <h1 className="font-display text-4xl">Your purchase history</h1>
        <p className="mt-3 max-w-2xl text-sm text-[var(--ink)]/70">
          Review your past orders and keep track of your ritual essentials.
        </p>
        {isAdmin && (
          <Link
            to="/admin"
            className="mt-6 inline-block rounded-full border border-[var(--brown)] px-5 py-2 text-xs uppercase tracking-[0.2em] text-[var(--brown)] transition hover:bg-[var(--brown)] hover:text-white"
          >
            Go to Admin Dashboard
          </Link>
        )}
        <div className="mt-6">
          <MotionButton
            onClick={() => setShowSignOut(true)}
            className="rounded-full bg-[var(--brown)] px-5 py-2 text-xs font-semibold text-white"
          >
            Sign out
          </MotionButton>
        </div>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="rounded-3xl border border-[var(--ink)]/10 bg-white/80 p-6 text-sm text-[var(--ink)]/70">
            No purchases yet. Complete a checkout to see your history here.
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="rounded-3xl border border-[var(--ink)]/10 bg-white/80 p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-display text-2xl">Order {order.id.slice(0, 8)}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">
                  {new Date(order.date).toLocaleDateString()}
                </p>
              </div>
              <div className="mt-4 space-y-2 text-sm text-[var(--ink)]/70">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <span>{item.name}</span>
                    <span>
                      {item.qty} x ₱{Number(item.price || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between text-sm font-semibold">
                <span>Total</span>
                <span>₱{Number(order.total || 0).toFixed(2)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {showSignOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_30px_80px_-50px_rgba(59,51,40,0.7)]">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--gold)]">Confirm</p>
            <h2 className="mt-2 font-display text-2xl">Sign out?</h2>
            <p className="mt-3 text-sm text-[var(--ink)]/70">
              You can sign back in anytime with your email and password.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <MotionButton
                onClick={() => setShowSignOut(false)}
                className="rounded-full border border-[var(--brown)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--brown)]"
              >
                Cancel
              </MotionButton>
              <MotionButton
                onClick={handleSignOut}
                className="rounded-full bg-[var(--brown)] px-4 py-2 text-xs font-semibold text-white"
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
