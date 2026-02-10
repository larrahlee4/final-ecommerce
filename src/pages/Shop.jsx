import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { addToCart } from '../lib/cart.js'
import MotionButton from '../components/MotionButton.jsx'
import { motion } from 'framer-motion'

function Shop() {
  const [products, setProducts] = useState([])
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('recent')

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('products')
        .select('id,name,slug,category,description,price,image_url,is_featured,created_at')
        .order('created_at', { ascending: false })
      setProducts(data ?? [])
    }
    load()
  }, [])

  const categories = useMemo(() => {
    const unique = new Set(products.map((item) => item.category).filter(Boolean))
    return ['All', ...Array.from(unique)]
  }, [products])

  const visible = useMemo(() => {
    const filtered = category === 'All' ? products : products.filter((item) => item.category === category)
    const sorted = [...filtered]
    if (sort === 'popular') {
      sorted.sort((a, b) => Number(b.is_featured) - Number(a.is_featured))
    } else if (sort === 'price_low') {
      sorted.sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
    } else if (sort === 'price_high') {
      sorted.sort((a, b) => Number(b.price || 0) - Number(a.price || 0))
    } else {
      sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }
    return sorted
  }, [category, products, sort])

  return (
    <section className="space-y-10">
      <div className="space-y-3 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--ink)]/60">
          Product
        </p>
        <h1 className="font-display text-4xl">Curated Veloure essentials</h1>
        <p className="mx-auto max-w-2xl text-sm text-[var(--ink)]/70">
          Filter by skin concern, texture, or ingredient to build your ritual.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3 text-xs uppercase tracking-[0.2em] text-[var(--ink)]/70">
        {categories.map((tag) => (
          <MotionButton
            key={tag}
            onClick={() => setCategory(tag)}
            className={`rounded-full border px-4 py-2 ${
              category === tag
                ? 'border-[var(--brown)] bg-[var(--brown)] text-white'
                : 'border-[var(--ink)]/10 bg-white'
            }`}
          >
            {tag}
          </MotionButton>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-3 text-xs uppercase tracking-[0.2em] text-[var(--ink)]/70">
        {[
          { id: 'recent', label: 'Recently Added' },
          { id: 'popular', label: 'Most Popular' },
          { id: 'price_low', label: 'Price: Low' },
          { id: 'price_high', label: 'Price: High' },
        ].map((item) => (
          <MotionButton
            key={item.id}
            onClick={() => setSort(item.id)}
            className={`rounded-full border px-4 py-2 ${
              sort === item.id
                ? 'border-[var(--brown)] bg-[var(--brown)] text-white'
                : 'border-[var(--ink)]/10 bg-white'
            }`}
          >
            {item.label}
          </MotionButton>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {visible.map((item, index) => (
          <motion.article
            key={item.id}
            className="space-y-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.04 }}
            whileHover={{ y: -6 }}
          >
            <div className="group overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_-40px_rgba(59,51,40,0.6)] transition hover:shadow-[0_30px_70px_-40px_rgba(59,51,40,0.7)]">
              <img
                className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105"
                src={item.image_url}
                alt={item.name}
              />
            </div>
            <p className="font-display text-xl">{item.name}</p>
            <p className="text-sm text-[var(--ink)]/70">{item.description}</p>
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>₱{Number(item.price || 0).toFixed(2)}</span>
              <div className="flex items-center gap-2">
                <MotionButton
                  className="rounded-full border border-[var(--brown)] px-3 py-2 text-xs text-[var(--brown)]"
                  onClick={() => addToCart(item, 1)}
                >
                  Add
                </MotionButton>
                <Link
                  to={`/product/${item.slug}`}
                  className="rounded-full bg-[var(--brown)] px-3 py-2 text-xs text-white transition hover:opacity-90"
                >
                  View
                </Link>
              </div>
            </div>
          </motion.article>
        ))}
        {visible.length === 0 && (
          <div className="md:col-span-2 lg:col-span-4 rounded-3xl border border-[var(--ink)]/10 bg-white/70 p-10 text-center text-sm text-[var(--ink)]/70">
            No products found for this filter.
          </div>
        )}
      </div>
    </section>
  )
}

export default Shop
