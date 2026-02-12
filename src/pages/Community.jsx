function Community() {
  const blocks = [
    { title: 'Glow sessions', text: 'Weekly live routines and Q&A with estheticians.' },
    { title: 'Ingredient lab', text: 'Deep dives into active ingredients and benefits.' },
    { title: 'Creator collective', text: 'Share routines, earn credits, and feature your look.' },
    { title: 'Member stories', text: 'Real transformations from the Veloure community.' },
  ]

  return (
    <section className="space-y-8">
      <div className="border border-[var(--ink)] bg-white px-6 py-8 md:px-10">
        <p className="text-[11px] font-black uppercase tracking-[0.32em] text-[var(--ink)]/65">Community</p>
        <h1 className="mt-3 text-4xl font-black uppercase leading-[0.95] md:text-6xl">
          Join the ritual-minded beauty circle.
        </h1>
        <p className="mt-5 max-w-3xl text-sm leading-6 text-[var(--ink)]/75">
          Connect with clients, creators, and experts who care about intentional beauty.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {blocks.map((item) => (
          <article
            key={item.title}
            className="border border-[var(--ink)] bg-white p-6 transition hover:bg-[var(--sand)]/20"
          >
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--ink)]/65">Program</p>
            <h2 className="mt-3 text-2xl font-black uppercase leading-tight">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--ink)]/75">{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default Community
