import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCart, removeFromCart, updateQty } from '../lib/cart.js'
import MotionButton from '../components/MotionButton.jsx'

function Cart() {
  const [items, setItems] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    setItems(getCart())
  }, [])

  const handleRemove = (id) => {
    setItems(removeFromCart(id))
  }

  const handleQty = (id, qty) => {
    const nextQty = Math.max(1, Number(qty || 1))
    setItems(updateQty(id, nextQty))
  }

  const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * item.qty, 0)
  const handleCheckout = () => {
    if (items.length === 0) return
    navigate('/checkout-list')
  }

  return (
    <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--taupe)]">
            Your Bag
          </p>
          <h1 className="font-display text-4xl">Ritual selections</h1>
        </div>
        {items.length === 0 ? (
          <div className="rounded-3xl border border-[var(--ink)]/10 bg-white/80 p-6 text-sm text-[var(--ink)]/70">
            Your bag is empty. Add products from the shop to begin your ritual.
          </div>
        ) : (
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
                    <p className="text-sm text-[color:var(--ink)]/70">
                      ₱{Number(item.price || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    className="w-16 rounded-xl border border-[var(--ink)]/10 px-3 py-2 text-sm"
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(event) => handleQty(item.id, event.target.value)}
                  />
                  <MotionButton
                    className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]"
                    onClick={() => handleRemove(item.id)}
                  >
                    Remove
                  </MotionButton>
                </div>
              </div>
            ))}
          </div>
        )}
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
            <span>Shipping</span>
            <span>₱0.00</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>₱{subtotal.toFixed(2)}</span>
          </div>
        </div>
        <MotionButton
          onClick={handleCheckout}
          className="mt-6 w-full rounded-full bg-[var(--brown)] px-6 py-3 text-sm font-semibold text-white"
        >
          Checkout
        </MotionButton>
        <Link
          to="/shop"
          className="mt-4 block text-center text-sm font-semibold text-[var(--taupe)]"
        >
          Continue shopping
        </Link>
      </aside>
    </section>
  )
}

export default Cart
