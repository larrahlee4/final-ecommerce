import { Outlet, NavLink, Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase.js'
import '../App.css'

const linkClass = ({ isActive }) =>
  isActive
    ? 'text-[var(--gold)]'
    : 'text-[var(--ink)]/80 hover:text-[var(--gold)] transition'

function SiteLayout() {
  const [signedIn, setSignedIn] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      setSignedIn(!!data?.session?.user)
    }
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session?.user)
    })
    init()
    return () => {
      sub?.subscription?.unsubscribe()
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-[var(--cream)] text-[var(--ink)]">
      <header className="border-b border-[var(--ink)]/10 bg-[var(--cream)]/95 px-6 py-6 backdrop-blur md:px-16">
        <nav className="flex flex-wrap items-center justify-between gap-6">
          <Link to="/" className="font-display text-xl tracking-wide">
            Velouré Beauty
          </Link>
          <div className="flex flex-wrap items-center gap-8 text-sm">
            <NavLink className={linkClass} to="/">Home</NavLink>
            <NavLink className={linkClass} to="/about">About</NavLink>
            <NavLink className={linkClass} to="/products">Product</NavLink>
            <NavLink className={linkClass} to="/community">Community</NavLink>
          </div>
          <div className="flex items-center gap-4 text-[var(--ink)]/70">
            {!signedIn && (
              <NavLink
                to="/login"
                className="rounded-full border border-[var(--ink)]/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--ink)]/70 transition hover:text-[var(--gold)]"
              >
                Sign in
              </NavLink>
            )}
            <Link
              to="/search"
              className="rounded-full border border-[var(--ink)]/10 p-2 transition hover:text-[var(--gold)]"
              aria-label="Search"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </Link>
            {signedIn && (
              <Link
                to="/profile"
                className="rounded-full border border-[var(--ink)]/10 p-2 transition hover:text-[var(--gold)]"
                aria-label="Account"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c1.8-3.5 5-5 8-5s6.2 1.5 8 5" />
                </svg>
              </Link>
            )}
            <NavLink
              to="/cart"
              className="rounded-full border border-[var(--ink)]/10 p-2 transition hover:text-[var(--gold)]"
              aria-label="Cart"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M6 6h15l-2 9H8L6 6Z" />
                <path d="M6 6 5 3H2" />
              </svg>
            </NavLink>
          </div>
        </nav>
      </header>

      <main className="flex-1 px-6 pb-20 pt-10 md:px-16">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.div>
      </main>

      <footer className="border-t border-[var(--ink)]/10 px-6 py-10 text-sm md:px-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-display text-lg">Velouré Beauty</p>
            <p className="text-[color:var(--ink)]/70">Clean beauty, crafted daily.</p>
          </div>
          <div className="flex flex-wrap gap-6 text-xs uppercase tracking-[0.2em] text-[var(--taupe)]">
            <span className="cursor-pointer transition hover:text-[var(--gold)]">Care</span>
            <span className="cursor-pointer transition hover:text-[var(--gold)]">Community</span>
            <span className="cursor-pointer transition hover:text-[var(--gold)]">Support</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default SiteLayout
