import aboutPhoto from '../assets/picture1.jpg'

function About() {
  const contactItems = [
    {
      title: 'Studio location',
      text: 'SM Megacenter Cabanatuan, General Tinio Street, Cabanatuan City, Nueva Ecija',
      href: 'https://www.google.com/maps/dir//SM+Megacenter+Cabanatuan,+General+Tinio+Street,+Cabanatuan+City,+3100+Nueva+Ecija/@15.4903,120.9682,14z/data=!4m8!4m7!1m0!1m5!1m1!1s0x339729b1de95792d:0x2874e66774b96e64!2m2!1d120.9679142!2d15.4878374?entry=ttu&g_ep=EgoyMDI2MDIwNC4wIKXMDSoASAFQAw%3D%3D',
    },
    {
      title: 'Contact number',
      text: '0956 557 2455',
      href: 'tel:+639565572455',
    },
    {
      title: 'Email us',
      text: 'bveloure@gmail.com',
      href: 'mailto:bveloure@gmail.com',
    },
    {
      title: 'Facebook',
      text: 'Veloure Beauty',
      href: 'https://www.facebook.com/share/1A7JiPfZPG/',
    },
  ]

  return (
    <section className="space-y-8">
      <div className="grid gap-0 border border-[var(--ink)] bg-[#efefef] lg:grid-cols-[1fr_1fr]">
        <div className="border-b border-[var(--ink)] lg:border-b-0 lg:border-r">
          <img
            src={aboutPhoto}
            alt="Model applying complexion product"
            className="aspect-[16/10] w-full object-cover"
          />
        </div>
        <div className="flex items-center px-8 py-10 md:px-12 lg:px-16">
          <div className="max-w-xl space-y-5">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--ink)]/70">
              We are Veloure
            </p>
            <h2 className="text-3xl font-black uppercase leading-[1.05] md:text-4xl">
              Our mission is simple:
              <br />
              to make beauty easy.
            </h2>
            <p className="text-base leading-8 text-[var(--ink)]/80 md:text-[34px] md:leading-[1.45]">
              Founded in 2019, we are a proudly Filipino makeup and beauty
              brand built on the belief that cosmetics should be effortless,
              versatile, and a form of self-expression.
            </p>
          </div>
        </div>
      </div>

      <div className="border border-[var(--ink)] bg-white p-6 md:p-8">
        <p className="text-[11px] font-black uppercase tracking-[0.32em] text-[var(--ink)]/65">
          Contact info
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {contactItems.map((item) => (
            <a
              key={item.title}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="border border-[var(--ink)] bg-white p-6 transition hover:bg-[var(--sand)]/20"
            >
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--ink)]/65">{item.title}</p>
              <p className="mt-3 text-lg font-black uppercase leading-tight">{item.text}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

export default About
