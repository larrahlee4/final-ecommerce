import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import MotionButton from "../components/MotionButton.jsx";
import { addToCart } from "../lib/cart.js";

function Home() {
  const [smallList, setSmallList] = useState([]);
  const [videoIndex, setVideoIndex] = useState(0);
  const [isVideoFading, setIsVideoFading] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const navigate = useNavigate();

  const heroVideos = [
    "/hero-presentation.mp4",
    "/hero-presentation-2.mp4",
    "/hero-presentation-3.mp4",
    "/hero-presentation-4.mp4",
    "/hero-presentation-5.mp4",
  ];

  const companyReviews = [
    {
      name: "Samantha Rider",
      rating: 5,
      text: "Veloure Beauty has transformed my skincare routine. Amazing products!",
      product: "Hydrating Velvet Body Elixir",
      sold: "100k Sold",
    },
    {
      name: "Liam Torres",
      rating: 5,
      text: "I love shopping at Veloure Beauty. Their delivery is super fast.",
      product: "Radiant Glow Serum",
      sold: "50k Sold",
    },
    {
      name: "Olivia Nguyen",
      rating: 5,
      text: "Veloure Beauty always has the best selections. Highly recommended!",
      product: "Luxury Lip Tint",
      sold: "30k Sold",
    },
    {
      name: "Ethan Lee",
      rating: 4,
      text: "Veloure Beauty skincare products are excellent for sensitive skin.",
      product: "Velvet Hydration Cream",
      sold: "60k Sold",
    },
    {
      name: "Ava Smith",
      rating: 5,
      text: "Beautiful packaging, high quality, and fast shipping. Love it!",
      product: "Calming Night Mask",
      sold: "45k Sold",
    },
    {
      name: "Noah Johnson",
      rating: 5,
      text: "The best e-commerce beauty store I have ever used. Consistent results!",
      product: "Radiance Eye Cream",
      sold: "30k Sold",
    },
  ];

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("products")
        .select("id,name,slug,category,description,price,image_url,is_featured")
        .order("created_at", { ascending: false });
      setSmallList(data ?? []);
    };

    load();
  }, []);

  const skincareList = smallList.filter(
    (item) =>
      (item.category || "").toLowerCase() === "skincare" && item.is_featured,
  );

  const cosmeticsList = smallList.filter(
    (item) =>
      (item.category || "").toLowerCase() === "cosmetics" && item.is_featured,
  );

  const reviewPage = companyReviews.slice(
    currentReviewIndex,
    currentReviewIndex + 3,
  );

  const renderBestsellerRow = (title, items) => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black uppercase tracking-[0.08em] text-black md:text-xl">
          {title}
        </h3>
        <button
          type="button"
          className="text-xs font-bold uppercase tracking-[0.15em] text-black/70 transition hover:text-black"
          onClick={() => navigate("/products")}
        >
          Explore
        </button>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {items.slice(0, 8).map((item) => (
            <article
              key={item.id}
              className="group border border-black/10 bg-white p-3 shadow-[0_16px_40px_-24px_rgba(0,0,0,0.45)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_40px_-24px_rgba(0,0,0,0.5)]"
            >
              <button
                type="button"
                className="block w-full text-left"
                onClick={() => navigate(`/product/${item.slug}`)}
              >
                <div className="relative overflow-hidden  bg-[#f2f2f2]">
                  <span className="absolute left-3 top-3 z-10 bg-black px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                    Bestseller
                  </span>
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="h-64 w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
              </button>

              <div className="mt-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-lg font-black uppercase leading-[1.05] text-black">
                    {item.name}
                  </h4>
                  <span className="text-base font-black text-black">
                    P{Number(item.price || 0).toFixed(2)}
                  </span>
                </div>
                <p className="min-h-[40px] text-sm leading-5 text-black/70">
                  {item.description || "Clean formula with high-performance results."}
                </p>
                <MotionButton
                  className="w-full rounded-md border border-black bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-black transition hover:bg-black hover:text-white"
                  onClick={() => addToCart(item, 1)}
                >
                  Add to Cart
                </MotionButton>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-black/20 bg-white p-8 text-center text-sm text-black/60">
          No best-selling items in {title.toLowerCase()} yet.
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-14 bg-[#efefef] pb-0">
      <section className="relative min-h-screen overflow-hidden">
        <video
          key={heroVideos[videoIndex]}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            isVideoFading ? "opacity-0" : "opacity-100"
          }`}
          autoPlay
          muted
          playsInline
          onEnded={() => {
            setIsVideoFading(true);
            setTimeout(() => {
              setVideoIndex((prev) => (prev + 1) % heroVideos.length);
              setIsVideoFading(false);
            }, 220);
          }}
        >
          <source src={heroVideos[videoIndex]} type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.72)_0%,rgba(0,0,0,0.44)_45%,rgba(0,0,0,0.25)_100%)]" />

        <div className="relative z-10 flex min-h-screen items-center px-6 py-16 md:px-14">
          <div className="max-w-2xl space-y-5">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-white">
              Welcome to Veloure Beauty
            </p>
            <h1 className="max-w-xl text-5xl font-black uppercase leading-[0.95] text-white md:text-7xl">
              Where Nature Meets Luxury
            </h1>
            <p className="max-w-xl text-base leading-7 text-white/95 md:text-lg">
              Our mission is to enhance your natural beauty with clean,
              science-backed ingredients and a touch of luxury. Feel confident,
              radiant, and empowered every day.
            </p>
            <MotionButton
              className="mt-1 rounded-none border border-white bg-transparent px-8 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-white hover:text-black"
              onClick={() => navigate("/products")}
            >
              Explore Products
            </MotionButton>
          </div>
        </div>
      </section>

      <section className="space-y-9 px-6 md:px-14">
        <h2 className="text-4xl font-black uppercase tracking-[0.03em] text-black md:text-5xl">
          Bestsellers
        </h2>
        {renderBestsellerRow("Skincare Bestseller", skincareList)}
        {renderBestsellerRow("Cosmetics Bestseller", cosmeticsList)}
      </section>

      <section className="px-6 pt-4 md:px-14">
        <p className="mx-auto max-w-5xl text-left text-4xl font-black leading-[1.05] text-black md:text-7xl">
          Beauty should not be complicated. It should be bold, personal and all
          yours.
        </p>
      </section>

      <section className="space-y-12 px-6 md:px-14">
        <div className="rounded-3xl border border-black/10 bg-white px-6 py-10 md:px-10">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-black/60">
            Philosophy
          </p>
          <p className="mt-4 max-w-4xl text-3xl font-black leading-[1.06] text-black md:text-5xl">
            At the heart of Veloure Beauty is clean science and luxurious care.
            Every formula is chosen to support real skin, real confidence, and
            everyday radiance.
          </p>
        </div>

        <div>
          <p className="mb-5 text-xs font-black uppercase tracking-[0.2em] text-black/60">
            Reviews
          </p>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {reviewPage.map((review, index) => (
              <article
                key={index}
                className="rounded-2xl border border-black/10 bg-white p-7"
              >
                <p className="text-xl font-black uppercase tracking-[0.04em] text-black">
                  {review.name}
                </p>
                <div className="mt-2 flex gap-1 text-black">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <span key={i}>*</span>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-6 text-black/75">{review.text}</p>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-black/60">
                  Product: {review.product}
                </p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-black/60">
                  {review.sold}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <MotionButton
            className="rounded-md border border-black px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-black hover:bg-black hover:text-white"
            onClick={() =>
              setCurrentReviewIndex((prev) =>
                prev - 3 < 0 ? companyReviews.length - 3 : prev - 3,
              )
            }
          >
            {"<"}
          </MotionButton>
          <MotionButton
            className="rounded-md border border-black bg-black px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-white hover:bg-white hover:text-black"
            onClick={() =>
              setCurrentReviewIndex((prev) =>
                prev + 3 >= companyReviews.length ? 0 : prev + 3,
              )
            }
          >
            {">"}
          </MotionButton>
        </div>
      </section>

      <section className="px-6 md:px-14">
        <p className="mx-auto max-w-5xl text-left text-4xl font-black leading-[1.05] text-black md:text-7xl">
          When beauty feels easy, self-expression becomes unstoppable.
        </p>
      </section>

      <section className="bg-black px-6 py-14 text-white md:px-14 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <div className="space-y-5">
            <p className="text-4xl font-black uppercase leading-none">
              Stay in the know
            </p>
            <div className="flex items-end justify-between border-b border-white/50 pb-3">
              <span className="text-lg text-white/80">Your email</span>
              <button
                type="button"
                className="text-sm font-black uppercase tracking-[0.12em]"
              >
                Sign Up
              </button>
            </div>
            <p className="max-w-xl text-sm leading-6 text-white/80">
              By submitting your email, you agree that Veloure Beauty may send
              promotional e-mail messages with offers, updates, and other
              marketing messages.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm font-bold uppercase tracking-[0.08em]">
            <div className="space-y-3">
              <p>About</p>
              <p>Store Locations</p>
              <p>Products</p>
            </div>
            <div className="space-y-3">
              <p>Account</p>
              <p>Help and FAQ</p>
              <p>Shipping and Delivery</p>
              <p>Returns and Refunds</p>
              <p>Privacy Policy</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
