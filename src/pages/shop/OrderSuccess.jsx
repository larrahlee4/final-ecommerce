import { Link, useLocation } from 'react-router-dom'
import MotionButton from '../../components/MotionButton.jsx'

const formatAddress = (address) => {
  if (!address || typeof address !== 'object') return []
  return [
    address.fullName,
    address.phone,
    [address.line1, address.line2].filter(Boolean).join(', '),
    [address.city, address.state, address.postalCode].filter(Boolean).join(', '),
    address.country,
  ].filter(Boolean)
}

function OrderSuccess() {
  const location = useLocation()
  const orderId = location.state?.orderId
  const total = location.state?.total
  const subtotal = location.state?.subtotal
  const shippingFee = location.state?.shippingFee
  const itemCount = location.state?.itemCount
  const billing = location.state?.billing
  const notes = location.state?.notes
  const items = Array.isArray(location.state?.items) ? location.state.items : []
  const addressLines = formatAddress(location.state?.address)

  return (
    <section className="space-y-8">
      <div className="border border-[var(--ink)] bg-white px-6 py-8 md:px-10">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--ink)]/65">Order received</p>
        <h1 className="mt-3 text-4xl font-black uppercase leading-none md:text-5xl">Your order is pending confirmation</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink)]/75">
          We received your order and an admin will confirm it before shipment.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.16fr_0.84fr]">
        <div className="space-y-6 border border-[var(--ink)] bg-white p-6 md:p-7">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--ink)]/70">Confirmation details</p>
            <div className="mt-4 space-y-2 text-sm">
              <p>
                Order number:{' '}
                <span className="font-black">{orderId ? `#${orderId}` : 'Available in your profile history'}</span>
              </p>
              <p>
                Items:{' '}
                <span className="font-black">{itemCount ?? '--'}</span>
              </p>
              <p>
                Billing option:{' '}
                <span className="font-black">{billing ?? 'standard'}</span>
              </p>
            </div>
          </div>

          <div className="border-t border-[var(--ink)] pt-4">
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--ink)]/70">Delivery address</p>
            <div className="mt-3 space-y-1 text-sm text-[var(--ink)]/85">
              {addressLines.length > 0 ? (
                addressLines.map((line) => <p key={line}>{line}</p>)
              ) : (
                <p>Address available in your profile order history.</p>
              )}
              {notes && <p className="pt-1 text-[var(--ink)]/70">Notes: {notes}</p>}
            </div>
          </div>

          <div className="border-t border-[var(--ink)] pt-4">
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--ink)]/70">Items ordered</p>
            <div className="mt-3 space-y-2 text-sm">
              {items.length > 0 ? (
                items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2">
                    <span className="text-[var(--ink)]/85">{item.name} x{item.qty}</span>
                    <span className="font-black">PHP {(item.price * item.qty).toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <p>Ordered items are available in your profile order history.</p>
              )}
            </div>
          </div>
        </div>

        <aside className="border border-[var(--ink)] bg-white p-6 md:p-7">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--ink)]/65">Order summary</p>
          <div className="mt-5 space-y-3 border-t border-[var(--ink)] pt-4 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{typeof subtotal === 'number' ? `PHP ${subtotal.toFixed(2)}` : '--'}</span>
            </div>
            <div className="flex justify-between">
              <span>Billing fee</span>
              <span>{typeof shippingFee === 'number' ? `PHP ${shippingFee.toFixed(2)}` : '--'}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--ink)] pt-3 text-base font-black">
              <span>Total</span>
              <span>{typeof total === 'number' ? `PHP ${total.toFixed(2)}` : 'Shown in profile'}</span>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <Link to="/profile">
              <MotionButton className="w-full border border-[var(--ink)] bg-[var(--ink)] px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-white">
                View profile orders
              </MotionButton>
            </Link>
            <Link
              to="/products"
              className="block w-full border border-[var(--ink)] px-6 py-3 text-center text-sm font-black uppercase tracking-[0.12em]"
            >
              Continue shopping
            </Link>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default OrderSuccess
