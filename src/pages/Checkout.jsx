import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCart, saveCart } from '../lib/cart.js'
import { supabase } from '../lib/supabase.js'
import MotionButton from '../components/MotionButton.jsx'

function Checkout() {
  const [items, setItems] = useState([])
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [billing, setBilling] = useState('standard')
  const [status, setStatus] = useState('')
  const [placingOrder, setPlacingOrder] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setItems(getCart())
  }, [])

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price || 0) * item.qty, 0),
    [items]
  )

  const billingOptions = useMemo(() => {
    if (subtotal >= 150) {
      return [
        { id: 'standard', label: 'Standard (Free)', fee: 0 },
        { id: 'express', label: 'Express (PHP 250)', fee: 250 },
        { id: 'white_glove', label: 'White Glove (PHP 450)', fee: 450 },
      ]
    }
    if (subtotal >= 80) {
      return [
        { id: 'standard', label: 'Standard (PHP 150)', fee: 150 },
        { id: 'express', label: 'Express (PHP 250)', fee: 250 },
      ]
    }
    return [{ id: 'standard', label: 'Standard (PHP 150)', fee: 150 }]
  }, [subtotal])

  const selectedFee = billingOptions.find((option) => option.id === billing)?.fee ?? 0
  const total = subtotal + selectedFee

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus('')
    if (!address.trim()) return
    if (items.length === 0) {
      setStatus('Your cart is empty.')
      return
    }

    setPlacingOrder(true)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setPlacingOrder(false)
      setStatus('Please sign in before placing an order.')
      navigate('/login')
      return
    }

    const { data: orderRow, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        total,
        subtotal,
        shipping_fee: selectedFee,
        address: address.trim(),
        notes: notes.trim(),
        billing,
      })
      .select('id')
      .single()

    if (orderError || !orderRow) {
      setPlacingOrder(false)
      setStatus(orderError?.message ?? 'Failed to place order.')
      return
    }

    const orderItemsPayload = items.map((item) => ({
      order_id: orderRow.id,
      product_id: item.id,
      product_name: item.name,
      image_url: item.image_url,
      price: Number(item.price || 0),
      qty: item.qty,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsPayload)

    if (itemsError) {
      setPlacingOrder(false)
      setStatus(itemsError.message)
      return
    }

    saveCart([])
    setPlacingOrder(false)
    navigate('/profile')
  }

  return (
    <section className="space-y-8">
      <div className="border border-[var(--ink)] bg-white px-6 py-8 md:px-10">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--ink)]/65">Checkout</p>
        <h1 className="mt-3 text-4xl font-black uppercase leading-none md:text-5xl">Delivery and billing</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink)]/75">
          Complete your shipping details, pick a billing option, and place your order.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1.16fr_0.84fr]">
        <div className="space-y-6 border border-[var(--ink)] bg-white p-6 md:p-7">
          <label className="block text-[11px] font-black uppercase tracking-[0.25em] text-[var(--ink)]/70">
            Home address
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className="mt-2 w-full border border-[var(--ink)] bg-white px-4 py-3 text-sm outline-none"
              placeholder="Street, city, province"
              required
            />
          </label>

          <label className="block text-[11px] font-black uppercase tracking-[0.25em] text-[var(--ink)]/70">
            Notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="mt-2 w-full border border-[var(--ink)] bg-white px-4 py-3 text-sm outline-none"
              rows="4"
              placeholder="Landmark or delivery instructions"
            />
          </label>

          <div className="space-y-3">
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--ink)]/70">Billing option</p>
            <div className="grid gap-3">
              {billingOptions.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-center justify-between border px-4 py-3 text-sm ${
                    billing === option.id
                      ? 'border-[var(--ink)] bg-[var(--sand)]/30'
                      : 'border-[var(--ink)] bg-white'
                  }`}
                >
                  <span>{option.label}</span>
                  <input
                    type="radio"
                    name="billing"
                    value={option.id}
                    checked={billing === option.id}
                    onChange={() => setBilling(option.id)}
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        <aside className="border border-[var(--ink)] bg-white p-6 md:p-7">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--ink)]/65">Order total</p>
          <div className="mt-5 space-y-3 border-t border-[var(--ink)] pt-4 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>PHP {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Billing fee</span>
              <span>PHP {selectedFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--ink)] pt-3 text-base font-black">
              <span>Total</span>
              <span>PHP {total.toFixed(2)}</span>
            </div>
          </div>

          <MotionButton
            className="mt-6 w-full border border-[var(--ink)] bg-[var(--ink)] px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-white disabled:opacity-60"
            disabled={placingOrder}
          >
            {placingOrder ? 'Placing order...' : 'Place order'}
          </MotionButton>
          {status && <p className="mt-3 text-xs text-red-600">{status}</p>}
        </aside>
      </form>
    </section>
  )
}

export default Checkout
