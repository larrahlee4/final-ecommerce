import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import MotionButton from '../components/MotionButton.jsx'
import { addToCart } from '../lib/cart.js'

function Home() {
  const [featured, setFeatured] = useState([])
  const [smallList, setSmallList] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('products')
        .select('id,name,slug,category,description,price,image_url,is_featured')
        .order('created_at', { ascending: false })
      const items = data ?? []
      setFeatured(items.filter((item) => item.is_featured).slice(0, 3))
      setSmallList(items.slice(0, 3))
    }
    load()
  }, [])

  return (
    <div className="space-y-20">
      <section className="rounded-[2.5rem] bg-[var(--sand)] p-6 md:p-10">
        <div className="relative overflow-hidden rounded-[2rem]">
          <img
            className="h-[520px] w-full object-cover md:h-[640px]"
            src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1600&auto=format&fit=crop"
            alt="Beauty closeup"
          />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-xl space-y-5 px-6 py-10 text-white md:px-10">
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">
                Most popular products
              </p>
              <h1 className="font-display text-4xl leading-tight md:text-5xl">
                Glow <span className="italic">Naturally</span> Feel Beautiful Every Day
              </h1>
              <p className="text-sm text-white/80">
                Discover dermatologist-approved skincare formulated with clean,
                science-backed ingredients to support your healthiest glow.
              </p>
              <MotionButton
                className="rounded-full bg-[var(--gold)] px-6 py-3 text-sm font-semibold text-white"
                onClick={() => navigate('/products')}
              >
                Shop Now
              </MotionButton>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-10">
        <div className="grid gap-6 lg:grid-cols-3">
          {featured.map((item) => (
            <article key={item.name} className="space-y-4">
              <div className="relative overflow-hidden rounded-3xl bg-[#f5efe6] soft-shadow">
                {item.is_featured && (
                  <span className="absolute left-4 top-4 rounded-full bg-[#f3e2b6] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--ink)]/70">
                    Best Seller
                  </span>
                )}
                <img className="h-72 w-full object-cover" src={item.image_url} alt={item.name} />
              </div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink)]/50">
                {item.category}
              </p>
              <h3 className="font-display text-2xl">{item.name}</h3>
              <p className="text-sm text-[var(--ink)]/70">{item.description}</p>
              <MotionButton
                className="rounded-full bg-[var(--brown)] px-5 py-2 text-xs font-semibold text-white"
                onClick={() => addToCart(item, 1)}
              >
                Add to Cart
              </MotionButton>
            </article>
          ))}
          {featured.length === 0 && (
            <div className="lg:col-span-3 rounded-3xl border border-[var(--ink)]/10 bg-white/70 p-10 text-center text-sm text-[var(--ink)]/70">
              No featured products yet. Add featured items in the admin dashboard.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-10 rounded-[2.5rem] bg-[var(--sand)]/70 px-10 py-12 lg:grid-cols-3">
        {smallList.map((item) => (
          <div key={item.name} className="space-y-3">
            <h4 className="font-display text-xl">{item.name}</h4>
            <p className="text-xs text-[var(--ink)]/60">
              Long-lasting color with a luxurious velvet finish.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <span>₱{Number(item.price || 0).toFixed(2)}</span>
              <MotionButton
                className="rounded-full bg-[var(--brown)] px-4 py-2 text-xs font-semibold text-white"
                onClick={() => addToCart(item, 1)}
              >
                Add to Cart
              </MotionButton>
            </div>
          </div>
        ))}
        {smallList.length === 0 && (
          <div className="lg:col-span-3 rounded-3xl border border-[var(--ink)]/10 bg-white/70 p-10 text-center text-sm text-[var(--ink)]/70">
            Add products to showcase them here.
          </div>
        )}
      </section>

      <section className="rounded-[2.5rem] bg-[var(--sand)] px-10 py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--ink)]/60">/Reviews</p>
        <div className="mx-auto mt-6 max-w-2xl rounded-3xl bg-white/70 p-10">
          <p className="font-display text-xl text-[var(--taupe)]">Samantha Rider</p>
          <div className="mt-2 flex gap-1 text-[#e5c77a]">
            {Array.from({ length: 5 }).map((_, index) => (
              <span key={index}>*</span>
            ))}
          </div>
          <p className="mt-4 text-sm text-[var(--ink)]/70">
            "At the heart of Veloure Beauty is a blend of nature's quiet heroes -
            calming chamomile, balancing green tea, and healing niacinamide - chosen
            not just for what they do, but how they make you feel."
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-[var(--ink)]/60">
            <span>Product Mention: Hydrating Velvet Body Elixir</span>
            <span>5/5</span>
            <span>100k Sold</span>
          </div>
          <div className="mt-6 flex gap-3">
            <MotionButton className="rounded-xl border border-[var(--ink)]/10 px-3 py-2">{'<'}</MotionButton>
            <MotionButton className="rounded-xl border border-[var(--ink)]/10 bg-[#f3e2b6] px-3 py-2">{'>'}</MotionButton>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
