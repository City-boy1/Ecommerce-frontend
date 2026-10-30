import { axiosPublic } from "../api/axios";

// Turns saved product ids into live products (current price, stock, store).
// Server omits products that were deleted or are no longer approved.
export async function resolveWishlist(ids) {
  const { data } = await axiosPublic.post("/wishlist/resolve", { ids });
  return Array.isArray(data) ? data : data.products || [];
}