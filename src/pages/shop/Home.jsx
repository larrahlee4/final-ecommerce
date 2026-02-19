import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase.js";
import MotionButton from "../../components/MotionButton.jsx";
import { addToCart } from "../../lib/cart.js";

function Home() {
  const [smallList, setSmallList] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
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
        .select(
          "id,name,variant,slug,category,description,price,image_url,is_featured,stock",
        )
        .eq("is_archived", false)
        .order("created_at", { ascending: false });
      setSmallList(data ?? []);
    };

    load();
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const role = data?.session?.user?.user_metadata?.role ?? "customer";
      setIsAdmin(role === "admin");
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const role = session?.user?.user_metadata?.role ?? "customer";
      setIsAdmin(role === "admin");
    });

    init();
    return () => {
      sub?.subscription?.unsubscribe();
    };
  }, []);

  const isFeaturedProduct = (value) =>
    value === true || value === 1 || value === "1" || value === "true";

  const normalizeCategory = (value) =>
    String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, "");

  const skincareKeywords = [
    "serum",
    "cleanser",
    "toner",
    "moisturizer",
    "lotion",
    "essence",
    "sunscreen",
    "mask",
  ];

  const cosmeticsKeywords = [
    "cosmetic",
    "makeup",
    "eyeshadow",
    "lipstick",
    "lipliner",
    "eyebrow",
    "mascara",
    "foundation",
    "blush",
    "concealer",
    "powder",
  ];

  const detectBestsellerGroup = (item) => {
    const normalizedName = normalizeCategory(item?.name);
    const normalizedCategory = normalizeCategory(item?.category);
    const normalizedDescription = normalizeCategory(item?.description);
    const textBlob = `${normalizedName} ${normalizedCategory} ${normalizedDescription}`;

    const isSkincare = skincareKeywords.some((keyword) =>
      textBlob.includes(normalizeCategory(keyword)),
    );
    const isCosmetics = cosmeticsKeywords.some((keyword) =>
      textBlob.includes(normalizeCategory(keyword)),
    );

    if (isSkincare && !isCosmetics) return "skincare";
    if (isCosmetics && !isSkincare) return "cosmetics";
    if (isSkincare) return "skincare";
    if (isCosmetics) return "cosmetics";
    return null;
  };

  const featuredProducts = smallList.filter((item) =>
    isFeaturedProduct(item.is_featured),
  );

  const skincareList = featuredProducts.filter(
    (item) => detectBestsellerGroup(item) === "skincare",
  );

  const cosmeticsList = featuredProducts.filter(
    (item) => detectBestsellerGroup(item) === "cosmetics",
  );

  const assignedIds = new Set([
    ...skincareList.map((item) => item.id),
    ...cosmeticsList.map((item) => item.id),
  ]);
  const unassignedFeatured = featuredProducts.filter(
    (item) => !assignedIds.has(item.id),
  );
  const fallbackMid = Math.ceil(unassignedFeatured.length / 2);
  const skincareBestsellers = [...skincareList, ...unassignedFeatured.slice(0, fallbackMid)];
  const cosmeticsBestsellers = [...cosmeticsList, ...unassignedFeatured.slice(fallbackMid)];

  const reviewPage = companyReviews.slice(
    currentReviewIndex,
    currentReviewIndex + 3,
  );

  const handleAddToCart = async (item, qty = 1) => {
    const result = await addToCart(item, qty);
    if (!result.error) {
      setSmallList((prev) =>
        prev.map((product) =>
          product.id === item.id
            ? { ...product, stock: result.remainingStock }
            : product,
        ),
      );
    }
    if (result.addedQty <= 0) return;
  };

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
        <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {items.slice(0, 8).map((item) => {
            const hasStockValue =
              item.stock !== null && item.stock !== undefined;
            const stockValue = hasStockValue
              ? Math.max(0, Number(item.stock || 0))
              : null;
            const isSoldOut = hasStockValue && stockValue <= 0;
            return (
              <article
                key={item.id}
                className="group flex h-full flex-col border border-black/10 bg-white p-3 shadow-[0_16px_40px_-24px_rgba(0,0,0,0.45)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_40px_-24px_rgba(0,0,0,0.5)]"
              >
                <button
                  type="button"
                  className="block w-full text-left"
                  onClick={() => navigate(`/product/${item.slug}`)}
                >
                  <div className="relative overflow-hidden bg-[#f2f2f2]">
                    <span className="absolute left-3 top-3 z-10 bg-black px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                      Bestseller
                    </span>
                    {isSoldOut && (
                      <span className="absolute right-3 top-3 z-10 border border-white bg-black/85 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                        Sold out
                      </span>
                    )}
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-64 w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                </button>

                <div className="mt-4 flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-lg font-black uppercase leading-[1.05] text-black">
                      {item.name}
                    </h4>
                    <span className="text-base font-black text-black">
                      P{Number(item.price || 0).toFixed(2)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-5 text-black/70">
                    {item.description ||
                      "Clean formula with high-performance results."}
                  </p>
                  <p className="mt-2 text-[11px] font-black uppercase tracking-[0.16em] text-black/60">
                    Stock:{" "}
                    {isSoldOut
                      ? "Sold out"
                      : hasStockValue
                        ? stockValue
                        : "Available"}
                  </p>
                  {!isAdmin && (
                    <MotionButton
                      className="mt-auto w-full rounded-md border border-black bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:border-[#b7b7b7] disabled:bg-[#d9d9d9] disabled:text-[#666] disabled:hover:bg-[#d9d9d9] disabled:hover:text-[#666]"
                      onClick={() => handleAddToCart(item, 1)}
                      disabled={isSoldOut}
                    >
                      {isSoldOut ? "Sold out" : "Add to Cart"}
                    </MotionButton>
                  )}
                </div>
              </article>
            );
          })}
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
        {renderBestsellerRow("Skincare Bestseller", skincareBestsellers)}
        {renderBestsellerRow("Cosmetics Bestseller", cosmeticsBestsellers)}
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
                <p className="mt-4 text-sm leading-6 text-black/75">
                  {review.text}
                </p>
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

      <section className="-mt-4 px-6 md:-mt-6 md:px-14">
        <p className="mx-auto max-w-4xl text-center text-3xl font-black leading-[1.1] text-black md:text-5xl">
          When beauty feels easy, self-expression becomes unstoppable.
        </p>
      </section>
    </div>
  );
}

export default Home;
