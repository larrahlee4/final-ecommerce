import { supabase } from "./supabase.js";

const storageKey = "veloure_cart";
const maxStockRetries = 3;

const stockWriteBlocked = (message = "") =>
  /permission|not allowed|row-level security|rls|jwt|auth|policy/i.test(
    String(message),
  );

export const getCart = () => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      ...item,
      qty: toPositiveInt(item?.qty, 1),
    }));
  } catch {
    return [];
  }
};

export const saveCart = (items) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(items));
  window.dispatchEvent(new Event("cartChanged"));
};

const toPositiveInt = (value, fallback = 1) => {
  const next = Number.parseInt(value, 10);
  if (!Number.isFinite(next) || next < 1) return fallback;
  return next;
};

const reserveStock = async (productId, wantedQty) => {
  let attempts = 0;
  const wanted = toPositiveInt(wantedQty, 1);

  while (attempts < maxStockRetries) {
    attempts += 1;
    const { data: row, error } = await supabase
      .from("products")
      .select("stock")
      .eq("id", productId)
      .maybeSingle();

    if (error || !row) {
      return {
        reserved: 0,
        stock: 0,
        error: error?.message ?? "Product not found.",
      };
    }

    const currentStock = Math.max(0, Number(row.stock || 0));
    const reserveQty = Math.min(currentStock, wanted);
    if (reserveQty <= 0) {
      return { reserved: 0, stock: currentStock, error: "" };
    }

    const nextStock = currentStock - reserveQty;
    const { data: updatedRow, error: updateError } = await supabase
      .from("products")
      .update({ stock: nextStock })
      .eq("id", productId)
      .eq("stock", currentStock)
      .select("stock")
      .maybeSingle();

    if (!updateError && updatedRow) {
      return {
        reserved: reserveQty,
        stock: Math.max(0, Number(updatedRow.stock || 0)),
        error: "",
      };
    }
  }

  return {
    reserved: 0,
    stock: 0,
    error: "Stock update conflict. Please try again.",
  };
};

const releaseStock = async (productId, releaseQty) => {
  let attempts = 0;
  const qty = toPositiveInt(releaseQty, 1);
  if (qty <= 0) return { stock: 0, error: "" };

  while (attempts < maxStockRetries) {
    attempts += 1;
    const { data: row, error } = await supabase
      .from("products")
      .select("stock")
      .eq("id", productId)
      .maybeSingle();

    if (error || !row) {
      return { stock: 0, error: error?.message ?? "Product not found." };
    }

    const currentStock = Math.max(0, Number(row.stock || 0));
    const nextStock = currentStock + qty;
    const { data: updatedRow, error: updateError } = await supabase
      .from("products")
      .update({ stock: nextStock })
      .eq("id", productId)
      .eq("stock", currentStock)
      .select("stock")
      .maybeSingle();

    if (!updateError && updatedRow) {
      return { stock: Math.max(0, Number(updatedRow.stock || 0)), error: "" };
    }
  }

  return { stock: 0, error: "Stock update conflict. Please try again." };
};

export const addToCart = async (product, qty = 1, options = {}) => {
  const wantedQty = toPositiveInt(qty, 1);
  const hasProductStock =
    product?.stock !== null && product?.stock !== undefined;
  const productStock = hasProductStock
    ? Math.max(0, Number(product?.stock || 0))
    : wantedQty;
  const addLocally = (remaining, addQty, error = "") => {
    const items = getCart();
    const existing = items.find((item) => item.id === product.id);
    const normalizedRemaining = hasProductStock
      ? Math.max(0, Number(remaining || 0))
      : null;
    if (existing) {
      existing.qty = toPositiveInt(existing.qty, 1) + toPositiveInt(addQty, 1);
      existing.stock = normalizedRemaining;
    } else {
      items.push({
        ...product,
        qty: addQty,
        stock: normalizedRemaining,
      });
    }

    saveCart(items);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("cartAdded", {
          detail: {
            id: product.id,
            name: product.name,
            qty: addQty,
            source: options.source ?? "",
          },
        }),
      );
    }

    return {
      items,
      addedQty: addQty,
      remainingStock: normalizedRemaining,
      error,
    };
  };

  // If stock is not tracked for this product, allow local cart additions.
  if (!hasProductStock) {
    return addLocally(0, wantedQty, "");
  }

  const reserve = await reserveStock(product.id, wantedQty);
  if (reserve.error || reserve.reserved <= 0) {
    if (reserve.error) {
      // Fallback for clients that can read products but cannot update stock rows.
      const items = getCart();
      const existing = items.find((item) => item.id === product.id);
      const localRemaining = existing
        ? Math.max(0, Number(existing.stock ?? productStock))
        : productStock;
      const localAddQty = Math.min(localRemaining, wantedQty);

      if (localAddQty <= 0) {
        return {
          items,
          addedQty: 0,
          remainingStock: localRemaining,
          error: stockWriteBlocked(reserve.error) ? "" : reserve.error,
        };
      }

      return addLocally(
        Math.max(0, localRemaining - localAddQty),
        localAddQty,
        "",
      );
    }

    const safeRemainingStock =
      reserve.error && reserve.stock === 0
        ? productStock
        : Math.max(0, Number(reserve.stock || 0));
    return {
      items: getCart(),
      addedQty: 0,
      remainingStock: safeRemainingStock,
      error: reserve.error,
    };
  }

  const items = getCart();
  const existing = items.find((item) => item.id === product.id);
  if (existing) {
    existing.qty =
      toPositiveInt(existing.qty, 1) + toPositiveInt(reserve.reserved, 1);
    existing.stock = reserve.stock;
  } else {
    items.push({
      ...product,
      qty: reserve.reserved,
      stock: reserve.stock,
    });
  }
  saveCart(items);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("cartAdded", {
        detail: {
          id: product.id,
          name: product.name,
          qty: reserve.reserved,
          source: options.source ?? "",
        },
      }),
    );
  }
  return {
    items,
    addedQty: reserve.reserved,
    remainingStock: reserve.stock,
    error: "",
  };
};

export const updateQty = async (id, qty) => {
  const wantedQty = toPositiveInt(qty, 1);
  const items = getCart();
  const idx = items.findIndex((item) => item.id === id);
  if (idx < 0) return items;

  const currentItem = items[idx];
  const hasTrackedStock =
    currentItem?.stock !== null && currentItem?.stock !== undefined;
  if (!hasTrackedStock) {
    items[idx] = {
      ...currentItem,
      qty: wantedQty,
    };
    saveCart(items);
    return items;
  }

  const currentQty = toPositiveInt(currentItem.qty, 1);
  const diff = wantedQty - currentQty;

  if (diff > 0) {
    const reserve = await reserveStock(id, diff);
    if (reserve.reserved > 0) {
      items[idx] = {
        ...currentItem,
        qty: currentQty + reserve.reserved,
        stock: reserve.stock,
      };
    } else if (reserve.error && stockWriteBlocked(reserve.error)) {
      // Fallback for clients that cannot write stock rows due to policies.
      const localRemaining = Math.max(0, Number(currentItem.stock || 0));
      const localAddQty = Math.min(localRemaining, diff);
      items[idx] = {
        ...currentItem,
        qty: currentQty + localAddQty,
        stock: Math.max(0, localRemaining - localAddQty),
      };
    }
  } else if (diff < 0) {
    const release = await releaseStock(id, Math.abs(diff));
    items[idx] = {
      ...currentItem,
      qty: wantedQty,
      stock: Math.max(0, Number(release.stock || currentItem.stock || 0)),
    };
  }

  saveCart(items);
  return items;
};

export const removeFromCart = async (id) => {
  const cart = getCart();
  const existing = cart.find((item) => item.id === id);
  if (!existing) return cart;

  const hasTrackedStock =
    existing?.stock !== null && existing?.stock !== undefined;
  if (hasTrackedStock) {
    const qty = toPositiveInt(existing.qty, 1);
    await releaseStock(id, qty);
  }
  const items = cart.filter((item) => item.id !== id);
  saveCart(items);
  return items;
};
