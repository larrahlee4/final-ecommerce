import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { supabase } from "../../lib/supabase.js";
import { addToCart } from "../../lib/cart.js";
import MotionButton from "../../components/MotionButton.jsx";

function Product() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [qty, setQty] = useState(1);
  const [openSection, setOpenSection] = useState("how");
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [addedModalOpen, setAddedModalOpen] = useState(false);
  const [lastAddedQty, setLastAddedQty] = useState(1);
  const navigate = useNavigate();
  const hasStockValue = product?.stock !== null && product?.stock !== undefined;
  const stockValue = hasStockValue
    ? Math.max(0, Number(product?.stock || 0))
    : null;
  const isSoldOut = hasStockValue && stockValue <= 0;

  const loadStoredReviews = (productId) => {
    const key = `veloure_reviews_${productId}`;
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  };

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user) {
        setSignedIn(false);
        setIsAdmin(false);
        setCheckedAuth(true);
        return;
      }
      setSignedIn(true);
      const role = sessionData.session.user.user_metadata?.role ?? "customer";
      setIsAdmin(role === "admin");
      const { data } = await supabase
        .from("products")
        .select("id,name,variant,category,description,price,image_url,stock")
        .eq("slug", slug)
        .eq("is_archived", false)
        .maybeSingle();
      setProduct(data ?? null);
      setReviews(data?.id ? loadStoredReviews(data.id) : []);
      if (data?.category) {
        const { data: recs } = await supabase
          .from("products")
          .select("id,name,variant,slug,price,image_url,stock")
          .eq("category", data.category)
          .eq("is_archived", false)
          .neq("id", data.id)
          .limit(3);
        setRecommendations(recs ?? []);
      }
      setCheckedAuth(true);
    };
    if (slug) {
      load();
    }
  }, [slug]);

  useEffect(() => {
    const onEsc = (event) => {
      if (event.key === "Escape") setIsZoomOpen(false);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  const sections = useMemo(
    () => [
      {
        id: "how",
        title: "How to use",
        body: "Apply to clean lips and blend outward for a soft-focus finish. Layer for stronger payoff.",
      },
      {
        id: "what",
        title: "What it does",
        body: "Provides buildable color with a lightweight feel and a smooth matte blur.",
      },
      {
        id: "special",
        title: "What makes it special",
        body: "Comfort-first texture, long-wear color, and a finish designed for everyday wear.",
      },
      {
        id: "ingredients",
        title: "Ingredients",
        body: "See product packaging for the complete ingredient list and allergen guidance.",
      },
    ],
    [],
  );

  const handleAddCurrentProduct = async (goToCart = false) => {
    if (!product || isSoldOut) return;
    const result = await addToCart(product, qty, { source: "product-detail" });
    if (!result.error) {
      setProduct((prev) =>
        prev ? { ...prev, stock: result.remainingStock } : prev,
      );
    }
    if (result.addedQty <= 0) return;
    setLastAddedQty(result.addedQty);
    setQty(1);

    if (goToCart) {
      navigate("/cart");
      return;
    }
    setAddedModalOpen(true);
  };

  const handleAddRecommendation = async (item) => {
    const result = await addToCart(item, 1);
    if (!result.error) {
      setRecommendations((prev) =>
        prev.map((entry) =>
          entry.id === item.id
            ? { ...entry, stock: result.remainingStock }
            : entry,
        ),
      );
    }
    if (result.addedQty <= 0) return;
  };

  if (!checkedAuth) {
    return null;
  }

  if (!signedIn) {
    return (
      <section className="space-y-4">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--ink)]/65">
          Sign in required
        </p>
        <h1 className="text-4xl font-black uppercase">
          Please sign in to view product details
        </h1>
        <p className="text-sm text-[var(--ink)]/70">
          Create an account or sign in to access full product information and
          purchase options.
        </p>
        <Link
          to="/login"
          className="text-sm font-black uppercase tracking-[0.14em] text-[var(--ink)]"
        >
          Go to sign in
        </Link>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="space-y-4">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--ink)]/65">
          Product
        </p>
        <h1 className="text-4xl font-black uppercase">Product not found</h1>
        <Link
          to="/shop"
          className="text-sm font-black uppercase tracking-[0.14em] text-[var(--ink)]/70"
        >
          Back to shop
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-12">
      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="bg-[#f2f2f2] p-4">
          <button
            type="button"
            onClick={() => setIsZoomOpen(true)}
            className="group relative block w-full overflow-hidden"
            aria-label="Zoom product photo"
          >
            <img
              className="aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.02]"
              src={product.image_url}
              alt={product.name}
            />
            {isSoldOut && (
              <span className="absolute left-3 top-3 border border-white bg-black/85 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">
                Sold out
              </span>
            )}
            <span className="absolute bottom-3 right-3 border border-[var(--ink)] bg-white/95 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--ink)]">
              Zoom
            </span>
          </button>
        </div>

        <div className="space-y-5 border border-[var(--ink)] bg-white p-6 md:p-7">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--ink)]/65">
            Product detail
          </p>
          <h1 className="text-4xl font-black uppercase leading-[0.95]">
            {product.name}
          </h1>
          <p className="text-sm leading-6 text-[var(--ink)]/75">
            {product.description}
          </p>

          <div className="grid grid-cols-2 gap-4 border-y border-[var(--ink)] py-4 text-sm">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--ink)]/60">
                Price
              </p>
              <p className="mt-1 text-2xl font-black">
                PHP {Number(product.price || 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--ink)]/60">
                Stock
              </p>
              <p className="mt-1 text-2xl font-black">
                {isSoldOut
                  ? "Sold out"
                  : hasStockValue
                    ? stockValue
                    : "Available"}
              </p>
            </div>
          </div>

          {!isAdmin && (
            <>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--ink)]/70">
                  Quantity
                </p>
                <div className="mt-2 inline-flex items-center border border-[var(--ink)]">
                  <button
                    type="button"
                    onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                    className="h-10 w-11 text-lg disabled:opacity-40"
                    disabled={isSoldOut}
                  >
                    -
                  </button>
                  <span className="flex h-10 w-14 items-center justify-center border-x border-[var(--ink)] text-lg font-black">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQty((prev) =>
                        hasStockValue
                          ? Math.min(stockValue, prev + 1)
                          : prev + 1,
                      )
                    }
                    className="h-10 w-11 text-lg disabled:opacity-40"
                    disabled={isSoldOut || (hasStockValue && qty >= stockValue)}
                  >
                    +
                  </button>
                </div>
              </div>

              <MotionButton
                className="w-full border border-[var(--ink)] bg-white px-6 py-3 text-xl font-black uppercase tracking-[0.06em] disabled:cursor-not-allowed disabled:border-[#b7b7b7] disabled:bg-[#d9d9d9] disabled:text-[#666] disabled:hover:bg-[#d9d9d9]"
                onClick={() => handleAddCurrentProduct(false)}
                disabled={isSoldOut}
              >
                {isSoldOut ? "Sold out" : "Add to bag"}
              </MotionButton>

              <div className="grid gap-3 sm:grid-cols-2">
                <MotionButton
                  className="border border-[var(--ink)] bg-[var(--ink)] px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-white disabled:cursor-not-allowed disabled:border-[#b7b7b7] disabled:bg-[#d9d9d9] disabled:text-[#666] disabled:hover:bg-[#d9d9d9]"
                  onClick={() => handleAddCurrentProduct(true)}
                  disabled={isSoldOut}
                >
                  {isSoldOut ? "Sold out" : "Buy now"}
                </MotionButton>
                <Link
                  to="/products"
                  className="flex items-center justify-center border border-[var(--ink)] px-6 py-3 text-sm font-black uppercase tracking-[0.12em]"
                >
                  Back to products
                </Link>
              </div>
            </>
          )}
          {isAdmin && (
            <Link
              to="/products"
              className="flex items-center justify-center border border-[var(--ink)] px-6 py-3 text-sm font-black uppercase tracking-[0.12em]"
            >
              Back to products
            </Link>
          )}

          <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
            <p>Preservative-safe</p>
            <p>Vegan</p>
            <p>Cruelty-free</p>
          </div>

          <div className="border-t border-[var(--ink)]">
            {sections.map((section) => (
              <div
                key={section.id}
                className="border-b border-[var(--ink)] py-3"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between text-left text-[11px] font-black uppercase tracking-[0.22em]"
                  onClick={() =>
                    setOpenSection((prev) =>
                      prev === section.id ? "" : section.id,
                    )
                  }
                >
                  <span>{section.title}</span>
                  <span>{openSection === section.id ? "-" : "+"}</span>
                </button>
                {openSection === section.id && (
                  <p className="pt-3 text-sm leading-6 text-[var(--ink)]/75">
                    {section.body}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {isZoomOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close zoom view"
            onClick={() => setIsZoomOpen(false)}
          />
          <div className="relative z-10 max-h-[92vh] w-full max-w-5xl border border-white bg-black">
            <button
              type="button"
              onClick={() => setIsZoomOpen(false)}
              className="absolute right-3 top-3 z-20 border border-white/70 bg-black/70 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white"
              aria-label="Close zoom view"
            >
              x
            </button>
            <img
              src={product.image_url}
              alt={product.name}
              className="max-h-[92vh] w-full object-contain"
            />
          </div>
        </div>
      )}

      <AnimatePresence>
        {addedModalOpen && (
          <Motion.div
            className="fixed inset-0 z-[96] flex items-center justify-center bg-black/35 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Motion.div
              className="w-full max-w-sm border border-[var(--ink)] bg-white px-6 py-6 text-center shadow-2xl"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Motion.div
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--ink)] bg-[var(--sand)]/25"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.22 }}
              >
                <svg
                  width="34"
                  height="34"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--ink)"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <Motion.path
                    d="m5 13 4 4L19 7"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  />
                </svg>
              </Motion.div>
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--ink)]/65">
                Added to bag
              </p>
              <p className="mt-2 text-sm text-[var(--ink)]/80">
                {product.name} x{lastAddedQty}
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  className="border border-[var(--ink)] px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em]"
                  onClick={() => setAddedModalOpen(false)}
                >
                  Continue
                </button>
                <button
                  type="button"
                  className="border border-[var(--ink)] bg-[var(--ink)] px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-white"
                  onClick={() => {
                    setAddedModalOpen(false);
                    navigate("/cart");
                  }}
                >
                  View cart
                </button>
              </div>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>

      <section className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--ink)]/65">
              Recommendations
            </p>
            <h2 className="mt-2 text-3xl font-black uppercase">
              You may also love
            </h2>
          </div>
          <Link
            to="/products"
            className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--ink)]/70"
          >
            View all
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {recommendations.map((item) => {
            const hasRecommendationStock =
              item.stock !== null && item.stock !== undefined;
            const recommendationStockValue = hasRecommendationStock
              ? Math.max(0, Number(item.stock || 0))
              : null;
            const isRecommendationSoldOut =
              hasRecommendationStock && recommendationStockValue <= 0;
            return (
              <article
                key={item.id}
                className="flex h-full flex-col border border-[var(--ink)] bg-white p-4"
              >
                <Link to={`/product/${item.slug}`} className="block">
                  <div className="relative">
                    <img
                      className="aspect-square w-full object-cover"
                      src={item.image_url}
                      alt={item.name}
                    />
                    {isRecommendationSoldOut && (
                      <span className="absolute left-3 top-3 border border-white bg-black/85 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">
                        Sold out
                      </span>
                    )}
                  </div>
                  <p className="mt-3 min-h-[3.5rem] text-lg font-black uppercase leading-tight">
                    {item.name}
                  </p>
                </Link>
                <p className="mt-1 text-sm">
                  PHP {Number(item.price || 0).toFixed(2)}
                </p>
                <p className="mt-1 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--ink)]/60">
                  Stock:{" "}
                  {isRecommendationSoldOut
                    ? "Sold out"
                    : hasRecommendationStock
                      ? recommendationStockValue
                      : "Available"}
                </p>
                <Link
                  to={`/product/${item.slug}`}
                  className="mt-3 inline-block text-[11px] font-black uppercase tracking-[0.16em] text-[var(--ink)]/75"
                >
                  See more details
                </Link>
                {!isAdmin && (
                  <MotionButton
                    className="mt-auto w-full border border-[var(--ink)] bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] transition hover:bg-[var(--ink)] hover:text-white disabled:cursor-not-allowed disabled:border-[#b7b7b7] disabled:bg-[#d9d9d9] disabled:text-[#666] disabled:hover:bg-[#d9d9d9] disabled:hover:text-[#666]"
                    onClick={() => handleAddRecommendation(item)}
                    disabled={isRecommendationSoldOut}
                  >
                    {isRecommendationSoldOut ? "Sold out" : "Add to bag"}
                  </MotionButton>
                )}
              </article>
            );
          })}
          {recommendations.length === 0 && (
            <div className="border border-[var(--ink)] bg-white p-6 text-sm text-[var(--ink)]/70">
              No recommendations available yet.
            </div>
          )}
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--ink)]/65">
            Reviews
          </p>
          <h2 className="mt-2 text-3xl font-black uppercase">
            Customer reviews
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            {reviews.length === 0 && (
              <div className="border border-[var(--ink)] bg-white p-6 text-sm text-[var(--ink)]/70">
                No reviews yet. Be the first to share your experience.
              </div>
            )}
            {reviews.map((item) => (
              <div
                key={item.id}
                className="border border-[var(--ink)] bg-white p-6"
              >
                <p className="text-lg font-black uppercase">{item.name}</p>
                <div className="mt-2 flex gap-1">
                  {Array.from({ length: item.rating }).map((_, index) => (
                    <span key={index}>*</span>
                  ))}
                </div>
                <p className="mt-3 text-sm text-[var(--ink)]/75">{item.text}</p>
              </div>
            ))}
          </div>

          <form
            className="border border-[var(--ink)] bg-white p-6"
            onSubmit={(event) => {
              event.preventDefault();
              if (!reviewText.trim()) return;
              const entry = {
                id: crypto.randomUUID(),
                name: "Veloure Client",
                rating,
                text: reviewText.trim(),
                date: new Date().toISOString(),
              };
              const next = [entry, ...reviews];
              setReviews(next);
              const key = `veloure_reviews_${product.id}`;
              window.localStorage.setItem(key, JSON.stringify(next));
              setReviewText("");
              setRating(5);
            }}
          >
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--ink)]/65">
              Leave a review
            </p>
            <div className="mt-4 flex gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setRating(index + 1)}
                  className={`border border-[var(--ink)] px-3 py-1 text-sm ${rating === index + 1 ? "bg-[var(--sand)]/30" : ""}`}
                >
                  *
                </button>
              ))}
            </div>
            <textarea
              className="mt-4 w-full border border-[var(--ink)] bg-white px-4 py-3 text-sm outline-none"
              rows="4"
              placeholder="Share your experience..."
              value={reviewText}
              onChange={(event) => setReviewText(event.target.value)}
            />
            <MotionButton className="mt-4 border border-[var(--ink)] bg-[var(--ink)] px-5 py-2 text-xs font-black uppercase tracking-[0.12em] text-white">
              Submit review
            </MotionButton>
          </form>
        </div>
      </section>
    </div>
  );
}

export default Product;
