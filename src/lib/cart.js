const storageKey = 'veloure_cart'

export const getCart = () => {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(storageKey)
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export const saveCart = (items) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(storageKey, JSON.stringify(items))
  window.dispatchEvent(new Event('cartChanged'))
}

export const addToCart = (product, qty = 1) => {
  const items = getCart()
  const existing = items.find((item) => item.id === product.id)
  if (existing) {
    existing.qty += qty
  } else {
    items.push({ ...product, qty })
  }
  saveCart(items)
  return items
}

export const updateQty = (id, qty) => {
  const items = getCart().map((item) =>
    item.id === id ? { ...item, qty } : item
  )
  saveCart(items)
  return items
}

export const removeFromCart = (id) => {
  const items = getCart().filter((item) => item.id !== id)
  saveCart(items)
  return items
}
