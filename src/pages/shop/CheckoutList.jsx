import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCart } from '../../lib/cart.js'
import MotionButton from '../../components/MotionButton.jsx'

function CheckoutList() {
  const [items] = useState(() => getCart())
  const navigate = useNavigate()

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price || 0) * item.qty, 0),
    [items]
  )

  return (
    <section className="space-y-8">
      <div className="border border-[var(--ink)] bg-white px-6 py-8 md:px-10">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--ink)]/65">Checkout</p>
        <h1 className="mt-3 text-4xl font-black uppercase leading-none md:text-5xl">Review your items</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink)]/75">
          Confirm your ritual essentials before continuing to checkout.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="border border-[var(--ink)] bg-white p-6 text-sm text-[var(--ink)]/70">
          Your cart is empty.
          <Link to="/products" className="ml-2 font-semibold text-[var(--ink)] underline underline-offset-4">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.16fr_0.84fr]">
          <div className="space-y-4 border border-[var(--ink)] bg-white p-6 md:p-7">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-4 border border-[var(--ink)] bg-white p-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="h-16 w-16 border border-[var(--ink)] object-cover"
                  />
                  <div>
                    <p className="text-lg font-black uppercase tracking-[0.08em] text-[var(--ink)]">{item.name}</p>
                    <p className="text-sm text-[var(--ink)]/70">
                      {item.qty} x ₱{Number(item.price || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-black text-[var(--ink)]">
                  ₱{(Number(item.price || 0) * item.qty).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <aside className="border border-[var(--ink)] bg-white p-6 md:p-7">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--ink)]/65">Summary</p>
            <div className="mt-5 space-y-3 border-t border-[var(--ink)] pt-4 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated tax</span>
                <span>₱{(subtotal * 0.08).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-[var(--ink)] pt-3 text-base font-black">
                <span>Total</span>
                <span>₱{(subtotal * 1.08).toFixed(2)}</span>
              </div>
            </div>
            <MotionButton
              onClick={() => navigate('/checkout')}
              className="mt-6 w-full border border-[var(--ink)] bg-[var(--ink)] px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-white"
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
