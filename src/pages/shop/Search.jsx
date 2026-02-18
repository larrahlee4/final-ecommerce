import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'

function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const suggestedTerms = [
    'Collections',
    'About',
    'Store locations',
    'Products',
    'Help & FAQ',
    'Shipping & delivery',
  ]

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
        .select('id,name,variant,slug,description,price,image_url')
        .eq('is_archived', false)
        .ilike('name', `%${query.trim()}%`)
        .order('created_at', { ascending: false })

      setResults(data ?? [])
      setLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  return (
    <section className="space-y-7">
      <div className="border border-[var(--ink)] bg-white p-5 md:p-8">
        <div className="flex items-center border border-[var(--ink)]/25 bg-[#f7f7f7] px-4 py-3">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="text-[var(--ink)]/75"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            className="ml-3 w-full bg-transparent text-sm outline-none placeholder:text-[var(--ink)]/45"
            placeholder="Search products, categories..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            type="button"
            aria-label="Clear search"
            className="ml-3 text-2xl leading-none text-[var(--ink)]/70 transition hover:text-[var(--ink)]"
            onClick={() => setQuery('')}
          >
            ×
          </button>
        </div>
      </div>

      <div className="border border-[var(--ink)] bg-white px-5 py-4 md:px-8 md:py-5">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--ink)]/55">
          Suggested search terms
        </p>
        <div className="mt-3 border-t border-[var(--ink)]/35 pt-4">
          <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
            {suggestedTerms.map((term) => (
              <button
                key={term}
                type="button"
                className="text-sm text-left text-[var(--ink)]/85 transition hover:text-[var(--ink)]"
                onClick={() => setQuery(term)}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {results.map((item) => (
          <article key={item.id} className="border border-[var(--ink)] bg-white p-4">
            <img className="aspect-square w-full border border-[var(--ink)] object-cover" src={item.image_url} alt={item.name} />
            <p className="mt-4 text-xl font-black uppercase leading-tight">{item.name}</p>
            <p className="mt-2 min-h-[44px] text-sm leading-5 text-[var(--ink)]/75">{item.description}</p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-base font-black">PHP {Number(item.price || 0).toFixed(2)}</span>
              <Link
                to={`/product/${item.slug}`}
                className="border border-[var(--ink)] px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] transition hover:bg-[var(--ink)] hover:text-white"
              >
                View
              </Link>
            </div>
          </article>
        ))}

        {!loading && query && results.length === 0 && (
          <div className="border border-[var(--ink)] bg-white p-6 text-sm text-[var(--ink)]/70">
            No products found.
          </div>
        )}
      </div>

      {!query && (
        <div className="border border-[var(--ink)] bg-white p-6 text-sm text-[var(--ink)]/70">
          Start typing to search for products.
        </div>
      )}
    </section>
  )
}

export default Search
