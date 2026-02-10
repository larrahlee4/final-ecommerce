import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import MotionButton from '../components/MotionButton.jsx'

function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true)
      if (!query.trim()) {
        setResults([])
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('products')
        .select('id,name,slug,description,price,image_url')
        .ilike('name', `%${query.trim()}%`)
        .order('created_at', { ascending: false })
      setResults(data ?? [])
      setLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  return (
    <section className="space-y-10">
      <div className="space-y-3 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--gold)]">Search</p>
        <h1 className="font-display text-4xl">Find your ritual</h1>
        <p className="mx-auto max-w-2xl text-sm text-[var(--ink)]/70">
          Search by product name to quickly find the item you want.
        </p>
      </div>

      <div className="mx-auto flex max-w-2xl items-center gap-3 rounded-full border border-[var(--ink)]/10 bg-white px-5 py-3 shadow-[0_20px_60px_-40px_rgba(59,51,40,0.5)]">
        <input
          className="w-full bg-transparent text-sm outline-none"
          placeholder="Search products..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <MotionButton
          className="rounded-full bg-[var(--brown)] px-4 py-2 text-xs font-semibold text-white"
          onClick={() => setQuery(query.trim())}
        >
          Search
        </MotionButton>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {results.map((item) => (
          <article key={item.id} className="space-y-4">
            <div className="overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_-40px_rgba(59,51,40,0.6)]">
              <img className="h-44 w-full object-cover" src={item.image_url} alt={item.name} />
            </div>
            <p className="font-display text-xl">{item.name}</p>
            <p className="text-sm text-[var(--ink)]/70">{item.description}</p>
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
        {!loading && query && results.length === 0 && (
          <div className="rounded-3xl border border-[var(--ink)]/10 bg-white/70 p-6 text-sm text-[var(--ink)]/70">
            No products found.
          </div>
        )}
      </div>
    </section>
  )
}

export default Search
