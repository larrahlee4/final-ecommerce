import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCart, saveCart } from '../../lib/cart.js'
import { supabase } from '../../lib/supabase.js'
import MotionButton from '../../components/MotionButton.jsx'

const emptyAddress = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'Philippines',
}

const normalizeAddress = (address) => ({
  fullName: String(address?.fullName ?? '').trim(),
  phone: String(address?.phone ?? '').trim(),
  line1: String(address?.line1 ?? '').trim(),
  line2: String(address?.line2 ?? '').trim(),
  city: String(address?.city ?? '').trim(),
  state: String(address?.state ?? '').trim(),
  postalCode: String(address?.postalCode ?? '').trim(),
  country: 'Philippines',
})

const hasAddressValues = (address) =>
  Boolean(address.fullName || address.phone || address.line1 || address.city || address.state || address.postalCode || address.country)

const buildAddressText = (address) => {
  const lines = [
    address.fullName,
    address.phone,
    [address.line1, address.line2].filter(Boolean).join(', '),
    [address.city, address.state, address.postalCode].filter(Boolean).join(', '),
    address.country,
  ].filter(Boolean)

  return lines.join(' | ')
}

function Checkout() {
  const [items] = useState(() => getCart())
  const [address, setAddress] = useState(emptyAddress)
  const [notes, setNotes] = useState('')
  const [billing, setBilling] = useState('standard')
  const [status, setStatus] = useState('')
  const [placingOrder, setPlacingOrder] = useState(false)
  const [savedProfileAddress, setSavedProfileAddress] = useState(emptyAddress)
  const [hasSavedProfileAddress, setHasSavedProfileAddress] = useState(false)
  const [saveToProfile, setSaveToProfile] = useState(true)
  const navigate = useNavigate()

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

  useEffect(() => {
    const loadProfileDefaults = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const details = normalizeAddress(user.user_metadata?.profile_details ?? {})
      const preferred = Boolean(user.user_metadata?.checkout_use_profile_defaults ?? true)
      const available = hasAddressValues(details)

      setSavedProfileAddress(details)
      setHasSavedProfileAddress(available)
      setSaveToProfile(preferred)

      if (available && preferred) {
        setAddress(details)
      }
    }

    loadProfileDefaults()
  }, [])

  const onAddressChange = (event) => {
    const { name, value } = event.target
    setAddress((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus('')

    const required = [address.fullName, address.phone, address.line1, address.city, address.state, address.postalCode, address.country]
    if (required.some((value) => !String(value || '').trim())) {
      setStatus('Please complete all required delivery fields.')
      return
    }

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

    const normalizedAddress = normalizeAddress(address)

    const nextMetadata = {
      ...(user.user_metadata ?? {}),
      checkout_use_profile_defaults: saveToProfile,
    }
    if (saveToProfile) {
      nextMetadata.profile_details = normalizedAddress
    }
    await supabase.auth.updateUser({ data: nextMetadata })

    const baseOrderPayload = {
      user_id: user.id,
      total,
      subtotal,
      shipping_fee: selectedFee,
      address: buildAddressText(normalizedAddress),
      notes: notes.trim(),
      billing,
      payment_status: 'confirmed',
      payment_confirmed_at: new Date().toISOString(),
    }

    let { data: orderRow, error: orderError } = await supabase
      .from('orders')
      .insert({
        ...baseOrderPayload,
        address_json: normalizedAddress,
      })
      .select('id')
      .single()

    // Backward compatibility if migration adding address_json is not applied yet.
    if (orderError && /address_json/i.test(String(orderError.message || ''))) {
      const retry = await supabase
        .from('orders')
        .insert(baseOrderPayload)
        .select('id')
        .single()
      orderRow = retry.data
      orderError = retry.error
    }

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
    navigate('/order-success', {
      state: {
        orderId: orderRow.id,
        total,
        subtotal,
        shippingFee: selectedFee,
        billing,
        notes: notes.trim(),
        address: normalizedAddress,
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          qty: Number(item.qty || 0),
          price: Number(item.price || 0),
        })),
        itemCount: items.reduce((sum, item) => sum + Number(item.qty || 0), 0),
      },
    })
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
          {hasSavedProfileAddress && (
            <div className="space-y-2 border border-[var(--ink)] bg-[var(--sand)]/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--ink)]/70">Saved profile details</p>
              <p className="text-xs text-[var(--ink)]/75">
                {savedProfileAddress.fullName || 'No name'}{savedProfileAddress.phone ? ` • ${savedProfileAddress.phone}` : ''}
              </p>
              <MotionButton
                type="button"
                onClick={() => setAddress(savedProfileAddress)}
                className="border border-[var(--ink)] bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.1em]"
              >
                Use saved details
              </MotionButton>
            </div>
          )}

          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--ink)]/70">Delivery details</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-[var(--ink)]/65">
                Full name
                <input
                  name="fullName"
                  value={address.fullName}
                  onChange={onAddressChange}
                  autoComplete="name"
                  className="mt-2 w-full border border-[var(--ink)] bg-white px-4 py-3 text-sm outline-none"
                  placeholder="Juan Dela Cruz"
                  required
                />
              </label>

              <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-[var(--ink)]/65">
                Phone
                <input
                  name="phone"
                  value={address.phone}
                  onChange={onAddressChange}
                  autoComplete="tel"
                  className="mt-2 w-full border border-[var(--ink)] bg-white px-4 py-3 text-sm outline-none"
                  placeholder="0917..."
                  required
                />
              </label>

              <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-[var(--ink)]/65 md:col-span-2">
                Street address
                <input
                  name="line1"
                  value={address.line1}
                  onChange={onAddressChange}
                  autoComplete="address-line1"
                  className="mt-2 w-full border border-[var(--ink)] bg-white px-4 py-3 text-sm outline-none"
                  placeholder="House no., street, subdivision"
                  required
                />
              </label>

              <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-[var(--ink)]/65 md:col-span-2">
                Unit / landmark (optional)
                <input
                  name="line2"
                  value={address.line2}
                  onChange={onAddressChange}
                  autoComplete="address-line2"
                  className="mt-2 w-full border border-[var(--ink)] bg-white px-4 py-3 text-sm outline-none"
                  placeholder="Building, floor, landmark"
                />
              </label>

              <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-[var(--ink)]/65">
                City
                <input
                  name="city"
                  value={address.city}
                  onChange={onAddressChange}
                  autoComplete="address-level2"
                  className="mt-2 w-full border border-[var(--ink)] bg-white px-4 py-3 text-sm outline-none"
                  required
                />
              </label>

              <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-[var(--ink)]/65">
                Province / state
                <input
                  name="state"
                  value={address.state}
                  onChange={onAddressChange}
                  autoComplete="address-level1"
                  className="mt-2 w-full border border-[var(--ink)] bg-white px-4 py-3 text-sm outline-none"
                  required
                />
              </label>

              <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-[var(--ink)]/65">
                Postal code
                <input
                  name="postalCode"
                  value={address.postalCode}
                  onChange={onAddressChange}
                  autoComplete="postal-code"
                  className="mt-2 w-full border border-[var(--ink)] bg-white px-4 py-3 text-sm outline-none"
                  required
                />
              </label>

              <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-[var(--ink)]/65">
                Country
                <input
                  name="country"
                  value="Philippines"
                  readOnly
                  autoComplete="country-name"
                  className="mt-2 w-full border border-[var(--ink)] bg-[var(--sand)]/20 px-4 py-3 text-sm outline-none"
                  required
                />
              </label>
            </div>
          </div>

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

          <label className="flex items-start gap-2 border border-[var(--ink)] bg-[var(--sand)]/20 px-3 py-2 text-xs text-[var(--ink)]/80">
            <input
              type="checkbox"
              checked={saveToProfile}
              onChange={(event) => setSaveToProfile(event.target.checked)}
              className="mt-[2px]"
            />
            <span>Save these delivery details to my profile for future checkout.</span>
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
