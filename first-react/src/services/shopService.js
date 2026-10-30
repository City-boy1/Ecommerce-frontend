import { axiosPublic } from "../api/axios";

// Normalises server answers to { products, total, pages }.
export async function getProducts(params = {}) {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v != null && v !== false)
  );
  const { data } = await axiosPublic.get("/products", { params: clean });
  if (Array.isArray(data)) return { products: data, total: data.length, pages: 1 };
  return {
    products: data.products || [],
    total: data.total ?? (data.products || []).length,
    pages: data.pages ?? 1,
  };
}

export async function getCategories() {
  const { data } = await axiosPublic.get("/categories");
  return Array.isArray(data) ? data : data.categories || [];
}

export async function getProductDetail(id) {
  const { data } = await axiosPublic.get(`/products/${id}`);
  return {
    product: data.product || data,
    seller: data.seller || null,
    store: data.store || null,
    reviews: data.reviews || [],
    moreFromStore: data.moreFromStore || [],
    related: data.related || [],
  };
}