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
    <section className="space-y-8">
      <div className="border border-[var(--ink)] bg-white px-6 py-8 md:px-10">
        <p className="text-[11px] font-black uppercase tracking-[0.32em] text-[var(--ink)]/65">Product</p>
        <h1 className="mt-3 text-4xl font-black uppercase leading-[0.95] md:text-6xl">
          Curated Veloure essentials
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-6 text-[var(--ink)]/75">
          Filter by category and sort to find the right item for your routine.
        </p>
      </div>

      <div className="space-y-4 border border-[var(--ink)] bg-white p-5 md:p-6">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--ink)]/65">Category</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {categories.map((tag) => (
              <MotionButton
                key={tag}
                onClick={() => setCategory(tag)}
                className={`border px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] ${
                  category === tag
                    ? 'border-[var(--ink)] bg-[var(--ink)] text-white'
                    : 'border-[var(--ink)] bg-white text-[var(--ink)]/80'
                }`}
              >
                {tag}
              </MotionButton>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--ink)]/65">Sort</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {[
              { id: 'recent', label: 'Recently added' },
              { id: 'popular', label: 'Most popular' },
              { id: 'price_low', label: 'Price: low' },
              { id: 'price_high', label: 'Price: high' },
            ].map((item) => (
              <MotionButton
                key={item.id}
                onClick={() => setSort(item.id)}
                className={`border px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] ${
                  sort === item.id
                    ? 'border-[var(--ink)] bg-[var(--ink)] text-white'
                    : 'border-[var(--ink)] bg-white text-[var(--ink)]/80'
                }`}
              >
                {item.label}
              </MotionButton>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {visible.map((item, index) => (
          <motion.article
            key={item.id}
            className="border border-[var(--ink)] bg-white p-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.04 }}
            whileHover={{ y: -4 }}
          >
            <Link to={`/product/${item.slug}`} className="group block">
              <img
                className="aspect-square w-full border border-[var(--ink)] object-cover transition duration-300 group-hover:scale-[1.02]"
                src={item.image_url}
                alt={item.name}
              />
            </Link>
            <p className="mt-4 text-xl font-black uppercase leading-tight">{item.name}</p>
            <p className="mt-2 min-h-[44px] text-sm leading-5 text-[var(--ink)]/75">
              {item.description || 'Clean formula with high-performance results.'}
            </p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-base font-black">PHP {Number(item.price || 0).toFixed(2)}</span>
              <MotionButton
                className="border border-[var(--ink)] bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] transition hover:bg-[var(--ink)] hover:text-white"
                onClick={() => addToCart(item, 1)}
              >
                Add to bag
              </MotionButton>
            </div>
          </motion.article>
        ))}

        {visible.length === 0 && (
          <div className="md:col-span-2 lg:col-span-4 border border-[var(--ink)] bg-white p-10 text-center text-sm text-[var(--ink)]/70">
            No products found for this filter.
          </div>
        )}
      </div>
    </section>
  )
}

export default Shop

