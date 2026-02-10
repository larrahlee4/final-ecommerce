import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCart } from '../lib/cart.js'
import MotionButton from '../components/MotionButton.jsx'

function CheckoutList() {
  const [items, setItems] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    setItems(getCart())
  }, [])

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price || 0) * item.qty, 0),
    [items]
  )

  return (
    <section className="space-y-10">
      <div className="rounded-[2.5rem] bg-[var(--sand)] p-10">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--gold)]">Checkout</p>
        <h1 className="font-display text-4xl">Review your items</h1>
        <p className="mt-3 text-sm text-[var(--ink)]/70">
          Confirm your ritual essentials before continuing to checkout.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-[var(--ink)]/10 bg-white/80 p-6 text-sm text-[var(--ink)]/70">
          Your cart is empty.
          <Link to="/products" className="ml-2 text-[var(--gold)]">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[var(--ink)]/10 bg-white/80 p-5"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="h-16 w-16 rounded-2xl object-cover"
                  />
                  <div>
                    <p className="font-display text-xl">{item.name}</p>
                    <p className="text-sm text-[var(--ink)]/70">
                      {item.qty} x ₱{Number(item.price || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-semibold">
                  ₱{(Number(item.price || 0) * item.qty).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <aside className="rounded-[2rem] bg-[var(--sand)] p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--gold)]">
              Summary
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated tax</span>
                <span>₱{(subtotal * 0.08).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>₱{(subtotal * 1.08).toFixed(2)}</span>
              </div>
            </div>
            <MotionButton
              onClick={() => navigate('/checkout')}
              className="mt-6 w-full rounded-full bg-[var(--brown)] px-6 py-3 text-sm font-semibold text-white"
            >
              Continue to checkout
            </MotionButton>
          </aside>
        </div>
      )}
    </section>
  )
}

export default CheckoutList
