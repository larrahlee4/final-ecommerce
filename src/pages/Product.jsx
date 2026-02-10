import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { addToCart } from '../lib/cart.js'
import MotionButton from '../components/MotionButton.jsx'

function Product() {
  const { slug } = useParams()
  const [product, setProduct] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [reviews, setReviews] = useState([])
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [checkedAuth, setCheckedAuth] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData?.session?.user) {
        setSignedIn(false)
        setCheckedAuth(true)
        return
      }
      setSignedIn(true)
      const { data } = await supabase
        .from('products')
        .select('id,name,category,description,price,image_url,stock')
        .eq('slug', slug)
        .maybeSingle()
      setProduct(data ?? null)
      if (data?.category) {
        const { data: recs } = await supabase
          .from('products')
          .select('id,name,slug,price,image_url')
          .eq('category', data.category)
          .neq('id', data.id)
          .limit(3)
        setRecommendations(recs ?? [])
      }
      setCheckedAuth(true)
    }
    if (slug) {
      load()
    }
  }, [slug, navigate])

  useEffect(() => {
    if (!product?.id) return
    const key = `veloure_reviews_${product.id}`
    const raw = window.localStorage.getItem(key)
    if (!raw) {
      setReviews([])
      return
    }
    try {
      setReviews(JSON.parse(raw))
    } catch {
      setReviews([])
    }
  }, [product?.id])

  if (!checkedAuth) {
    return null
  }

  if (!signedIn) {
    return (
      <section className="space-y-4">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--gold)]">Sign in required</p>
        <h1 className="font-display text-4xl">Please sign in to view product details</h1>
        <p className="text-sm text-[var(--ink)]/70">
          Create an account or sign in to access full product information and purchase options.
        </p>
        <Link to="/login" className="text-sm font-semibold text-[var(--gold)]">
          Go to sign in
        </Link>
      </section>
    )
  }

  if (!product) {
    return (
      <section className="space-y-4">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--taupe)]">Product</p>
        <h1 className="font-display text-4xl">Product not found</h1>
        <Link to="/shop" className="text-sm font-semibold text-[var(--taupe)]">
          Back to shop
        </Link>
      </section>
    )
  }

  return (
    <div className="space-y-16">
      <section className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div className="rounded-[2rem] bg-[var(--sand)] p-10">
          <img className="h-80 w-full rounded-3xl object-cover" src={product.image_url} alt={product.name} />
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-full border border-white/80 px-4 py-1 text-xs uppercase tracking-[0.2em]">
              {product.category}
            </span>
            <span className="rounded-full border border-white/80 px-4 py-1 text-xs uppercase tracking-[0.2em]">
              Stock {product.stock ?? 0}
            </span>
          </div>
        </div>
        <div className="space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--gold)]">
            Product detail
          </p>
          <h1 className="font-display text-4xl capitalize">{product.name}</h1>
          <p className="text-sm text-[color:var(--ink)]/70">
            {product.description}
          </p>
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <p className="font-display text-2xl">₱{Number(product.price || 0).toFixed(2)}</p>
              <p className="text-[color:var(--ink)]/70">100ml</p>
            </div>
            <div>
              <p className="font-display text-2xl">{product.stock ?? 0}</p>
              <p className="text-[color:var(--ink)]/70">Units available</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <MotionButton
              className="rounded-full bg-[var(--brown)] px-6 py-3 text-sm font-semibold text-white"
              onClick={() => addToCart(product, 1)}
            >
              Add to bag
            </MotionButton>
            <MotionButton
              className="rounded-full border border-[var(--brown)] px-6 py-3 text-sm font-semibold transition hover:bg-[var(--brown)] hover:text-white"
              onClick={() => {
                addToCart(product, 1)
                navigate('/cart')
              }}
            >
              Buy now
            </MotionButton>
            <Link
              to="/shop"
              className="rounded-full border border-[var(--brown)] px-6 py-3 text-sm font-semibold transition hover:bg-[var(--brown)] hover:text-white"
            >
              Back to shop
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--gold)]">Recommendations</p>
            <h2 className="font-display text-3xl">You may also love</h2>
          </div>
          <Link to="/products" className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">
            View all
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {recommendations.map((item) => (
            <article key={item.id} className="space-y-4">
              <div className="overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_-40px_rgba(59,51,40,0.6)]">
                <img className="h-44 w-full object-cover" src={item.image_url} alt={item.name} />
              </div>
              <p className="font-display text-xl">{item.name}</p>
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>₱{Number(item.price || 0).toFixed(2)}</span>
                <Link
                  to={`/product/${item.slug}`}
                  className="rounded-full bg-[var(--brown)] px-3 py-2 text-xs text-white"
                >
                  View
                </Link>
              </div>
            </article>
          ))}
          {recommendations.length === 0 && (
            <div className="rounded-3xl border border-[var(--ink)]/10 bg-white/70 p-6 text-sm text-[var(--ink)]/70">
              No recommendations available yet.
            </div>
          )}
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--gold)]">Reviews</p>
          <h2 className="font-display text-3xl">Customer reviews</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            {reviews.length === 0 && (
              <div className="rounded-3xl border border-[var(--ink)]/10 bg-white/80 p-6 text-sm text-[var(--ink)]/70">
                No reviews yet. Be the first to share your experience.
              </div>
            )}
            {reviews.map((item) => (
              <div key={item.id} className="rounded-3xl border border-[var(--ink)]/10 bg-white/80 p-6">
                <p className="font-display text-2xl">{item.name}</p>
                <div className="mt-2 flex gap-1 text-[#d5b47a]">
                  {Array.from({ length: item.rating }).map((_, index) => (
                    <span key={index}>*</span>
                  ))}
                </div>
                <p className="mt-4 text-sm text-[var(--ink)]/70">{item.text}</p>
              </div>
            ))}
          </div>
          <form
            className="rounded-3xl border border-[var(--ink)]/10 bg-white/80 p-6"
            onSubmit={(event) => {
              event.preventDefault()
              if (!reviewText.trim()) return
              const entry = {
                id: crypto.randomUUID(),
                name: 'Veloure Client',
                rating,
                text: reviewText.trim(),
                date: new Date().toISOString(),
              }
              const next = [entry, ...reviews]
              setReviews(next)
              const key = `veloure_reviews_${product.id}`
              window.localStorage.setItem(key, JSON.stringify(next))
              setReviewText('')
              setRating(5)
            }}
          >
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--gold)]">Leave a review</p>
            <div className="mt-4 flex gap-2 text-[#d5b47a]">
              {Array.from({ length: 5 }).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setRating(index + 1)}
                  className={`rounded-full border border-[#ead9bf] px-3 py-1 text-sm transition hover:bg-[#f3e2c7] ${
                    rating === index + 1 ? 'bg-[#f3e2c7]' : ''
                  }`}
                >
                  *
                </button>
              ))}
            </div>
            <textarea
              className="mt-4 w-full rounded-2xl border border-[var(--ink)]/10 bg-white px-4 py-3 text-sm outline-none"
              rows="4"
              placeholder="Share your experience..."
              value={reviewText}
              onChange={(event) => setReviewText(event.target.value)}
            />
            <MotionButton className="mt-4 rounded-full bg-[var(--brown)] px-5 py-2 text-xs font-semibold text-white">
              Submit review
            </MotionButton>
          </form>
        </div>
      </section>
    </div>
  )
}

export default Product
