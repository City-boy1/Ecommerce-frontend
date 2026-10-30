import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { axiosPrivate } from "../../api/axios";
import { useToast } from "../../context/ToastContext";
import { getImageUrl } from "../../utils/productHelpers";
import { formatPrice } from "../../utils/format";
import "../../css/inventory.css";

const emptyVariant = () => ({ color: "", size: "", price: "", stock: "" });

const emptyForm = () => ({
  title: "",
  description: "",
  image: null,
  category: "",
  hasVariants: "no",
  price: "",
  stock: "",
  variants: [emptyVariant()],
});

const REVIEW = {
  pending: { label: "Pending approval", cls: "is-low" },
  approved: { label: "Live on shop", cls: "is-in" },
  rejected: { label: "Rejected", cls: "is-out" },
};

function Icon({ name, size = 18, strokeWidth = 1.8 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    box: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 8 9 5 9-5" /><path d="M3 8v9l9 5 9-5V8" /><path d="M12 13v9" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,
    close: <><path d="m18 6-12 12" /><path d="m6 6 12 12" /></>,
    upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M4 20h16" /></>,
    package: <><path d="M3 7.5 12 12l9-4.5" /><path d="M12 22V12" /><path d="m3 7.5 9-4.5 9 4.5v9L12 22l-9-5.5v-9Z" /></>,
    alert: <><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 16 9 5 9-5" /></>,
  };

  return <svg {...common}>{paths[name] || paths.box}</svg>;
}

function getArray(response) {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.categories)) return data.categories;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

const getStock = (product) =>
  (product?.variants || []).reduce((sum, v) => sum + Number(v.stock || 0), 0);

const getPrice = (product) =>
  product?.variants?.length
    ? Math.min(...product.variants.map((v) => Number(v.price || 0)))
    : 0;

const MAX_IMAGE_SIZE = 3 * 1024 * 1024;

export default function Inventory() {
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  // Stable function, so it never retriggers the data-loading effects.
  const notify = useCallback((type, message) => {
    const fn = toastRef.current?.[type];
    if (typeof fn === "function") fn(message);
    else window.alert(message);
  }, []);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // product being edited, or null
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [filePreview, setFilePreview] = useState("");

  const setField = (field, value) => setForm((cur) => ({ ...cur, [field]: value }));

  // Preview for a newly chosen file.
  useEffect(() => {
    if (!form.image) {
      setFilePreview("");
      return;
    }
    const url = URL.createObjectURL(form.image);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [form.image]);

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const response = await axiosPrivate.get("/categories");
      setCategories(getArray(response));
    } catch (error) {
      setCategories([]);
      notify("error", error?.response?.data?.message || "Could not load categories.");
    } finally {
      setCategoriesLoading(false);
    }
  }, [notify]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setPageError("");
    try {
      const response = await axiosPrivate.get("/products/mine");
      setProducts(getArray(response));
    } catch (error) {
      setProducts([]);
      setPageError(error?.response?.data?.message || "We couldn't load your inventory.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, [loadCategories, loadProducts]);

  const categoryName = (product) =>
    typeof product.category === "object"
      ? product.category?.name || "Uncategorized"
      : categories.find((c) => String(c._id || c.id) === String(product.category))?.name ||
        "Uncategorized";

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        (p.title || "").toLowerCase().includes(q) ||
        categoryName(p).toLowerCase().includes(q)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, search, categories]);

  const pendingCount = products.filter((p) => p.reviewStatus === "pending").length;
  const rejectedCount = products.filter((p) => p.reviewStatus === "rejected").length;
  const totalUnits = products.reduce((sum, p) => sum + getStock(p), 0);
  const lowStockCount = products.filter((p) => {
    const s = getStock(p);
    return s > 0 && s <= 5;
  }).length;

  /* ---------- form helpers ---------- */

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (product) => {
    const variants = product.variants || [];
    const isSimple =
      variants.length === 1 &&
      variants[0].color === "Default" &&
      variants[0].size === "One size";

    setEditing(product);
    setForm({
      title: product.title || "",
      description: product.description || "",
      image: null,
      category: String(product.category?._id || product.category || ""),
      hasVariants: isSimple || variants.length === 0 ? "no" : "yes",
      price: isSimple ? String(variants[0].price) : "",
      stock: isSimple ? String(variants[0].stock) : "",
      variants:
        !isSimple && variants.length
          ? variants.map((v) => ({
              color: v.color || "",
              size: v.size || "",
              price: String(v.price ?? ""),
              stock: String(v.stock ?? ""),
            }))
          : [emptyVariant()],
    });
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm());
  };

  const updateVariant = (index, field, value) =>
    setForm((cur) => ({
      ...cur,
      variants: cur.variants.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    }));

  const addVariant = () =>
    setForm((cur) => ({ ...cur, variants: [...cur.variants, emptyVariant()] }));

  const removeVariant = (index) =>
    setForm((cur) => ({ ...cur, variants: cur.variants.filter((_, i) => i !== index) }));

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      notify("error", "Please select a valid image file.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      notify("error", "Image size must not exceed 3 MB.");
      event.target.value = "";
      return;
    }
    setField("image", file);
  };

  /* ---------- submit / delete ---------- */

  const handleSubmit = async (event) => {
    event.preventDefault();

    const title = form.title.trim();
    const description = form.description.trim();
    const needsImage = !editing || !editing.imgUrl;

    if (!title || !description) {
      notify("error", "Complete the title and description.");
      return;
    }
    if (needsImage && !form.image) {
      notify("error", "Choose a product image.");
      return;
    }
    if (!form.category) {
      notify("error", "Choose a category.");
      return;
    }

    let variants;

    if (form.hasVariants === "yes") {
      const invalid = form.variants.some(
        (v) =>
          !v.color.trim() ||
          !v.size.trim() ||
          v.price === "" ||
          Number(v.price) < 0 ||
          v.stock === "" ||
          !Number.isInteger(Number(v.stock)) ||
          Number(v.stock) < 0
      );
      if (!form.variants.length || invalid) {
        notify("error", "Complete the color, size, price, and stock for every variant.");
        return;
      }
      variants = form.variants.map((v) => ({
        color: v.color.trim(),
        size: v.size.trim(),
        price: Number(v.price),
        stock: Number(v.stock),
      }));
    } else {
      if (form.price === "" || Number(form.price) < 0) {
        notify("error", "Enter a valid price.");
        return;
      }
      if (form.stock === "" || !Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) {
        notify("error", "Stock must be a whole number of zero or more.");
        return;
      }
      variants = [
        { color: "Default", size: "One size", price: Number(form.price), stock: Number(form.stock) },
      ];
    }

    const payload = new FormData();
    payload.append("title", title);
    payload.append("description", description);
    payload.append("category", form.category);
    payload.append("variants", JSON.stringify(variants));
    if (form.image) payload.append("image", form.image);

    setSaving(true);
    try {
      if (editing) {
        await axiosPrivate.put(`/products/${editing._id}`, payload);
        notify("success", "Product updated and sent for approval again.");
      } else {
        await axiosPrivate.post("/products", payload);
        notify("success", "Product submitted and is awaiting approval.");
      }
      setSaving(false);
      closeForm();
      await loadProducts();
    } catch (error) {
      notify(
        "error",
        error?.response?.data?.message || "Product could not be saved. Check the form and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.title}"? This cannot be undone.`)) return;
    try {
      await axiosPrivate.delete(`/products/${product._id}`);
      setProducts((list) => list.filter((p) => p._id !== product._id));
      notify("success", "Product deleted.");
    } catch (error) {
      notify("error", error?.response?.data?.message || "Could not delete the product.");
    }
  };

  const previewSrc = filePreview || (editing ? getImageUrl(editing) : "");

  /* ---------- render ---------- */

  return (
    <div className="seller-inventory">
      <header className="inventory-heading">
        <div>
          <p className="inventory-eyebrow">SELLER WORKSPACE / CATALOG</p>
          <h1>Inventory</h1>
          <p className="inventory-subtitle">Manage your products, options, and available stock.</p>
        </div>
        <button className="inventory-primary-btn" type="button" onClick={openCreate}>
          <Icon name="plus" size={17} />
          <span>Add product</span>
        </button>
      </header>

      <section className="inventory-stats" aria-label="Inventory summary">
        <article className="inventory-stat-card">
          <span className="inventory-stat-icon"><Icon name="package" size={19} /></span>
          <div><p>Total products</p><strong>{products.length}</strong></div>
        </article>
        <article className="inventory-stat-card">
          <span className="inventory-stat-icon"><Icon name="layers" size={19} /></span>
          <div><p>Units in stock</p><strong>{totalUnits}</strong></div>
        </article>
        <article className="inventory-stat-card">
          <span className="inventory-stat-icon"><Icon name="alert" size={19} /></span>
          <div><p>Low stock</p><strong>{lowStockCount}</strong></div>
        </article>
      </section>

      <section className="inventory-list-panel">
        <div className="inventory-list-header">
          <div>
            <h2>Your products</h2>
            <p>Products appear in the shop once an admin approves them.</p>
          </div>
          <label className="inventory-search">
            <Icon name="search" size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products"
              aria-label="Search products"
            />
          </label>
        </div>

        {pageError && (
          <div className="inventory-error" role="alert">
            <Icon name="alert" size={18} />
            <span>{pageError}</span>
            <button type="button" onClick={loadProducts}>Retry</button>
          </div>
        )}

        {pendingCount > 0 && (
          <div className="inventory-error" role="status">
            <Icon name="alert" size={18} />
            <span>
              {pendingCount} {pendingCount === 1 ? "product is" : "products are"} awaiting admin
              approval and not visible in the shop yet.
            </span>
          </div>
        )}

        {rejectedCount > 0 && (
          <div className="inventory-error" role="alert">
            <Icon name="alert" size={18} />
            <span>
              {rejectedCount} {rejectedCount === 1 ? "product was" : "products were"} rejected.
              Edit {rejectedCount === 1 ? "it" : "them"} to fix the issue and resubmit.
            </span>
          </div>
        )}

        {loading ? (
          <div className="inventory-loading" aria-live="polite">Loading your products…</div>
        ) : filteredProducts.length === 0 ? (
          <div className="inventory-empty">
            <span className="inventory-empty-icon"><Icon name="box" size={28} /></span>
            <h3>{search ? "No matching products" : "Your inventory is waiting"}</h3>
            <p>
              {search
                ? "Try another product name or category."
                : "Add your first product to start building your catalog."}
            </p>
            {!search && (
              <button className="inventory-secondary-btn" type="button" onClick={openCreate}>
                <Icon name="plus" size={16} /> Add your first product
              </button>
            )}
          </div>
        ) : (
          <div className="inventory-table-wrap">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Category</th>
                  <th scope="col">Price</th>
                  <th scope="col">Stock</th>
                  <th scope="col">Visibility</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const stock = getStock(product);
                  const img = getImageUrl(product);
                  const review = REVIEW[product.reviewStatus] || REVIEW.pending;

                  return (
                    <tr key={product._id}>
                      <td>
                        <div className="inventory-product-cell">
                          {img ? (
                            <img src={img} alt="" className="inventory-product-thumb" />
                          ) : (
                            <span className="inventory-product-thumb inventory-product-thumb-placeholder">
                              <Icon name="image" size={20} />
                            </span>
                          )}
                          <div className="inventory-product-copy">
                            <strong>{product.title}</strong>
                            <span>
                              {product.variants?.length > 1
                                ? `${product.variants.length} variants`
                                : "Standard product"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>{categoryName(product)}</td>
                      <td>{formatPrice(getPrice(product))}</td>
                      <td>
                        {stock}{" "}
                        <span className={`inventory-status ${stock === 0 ? "is-out" : stock <= 5 ? "is-low" : "is-in"}`}>
                          {stock === 0 ? "Out" : stock <= 5 ? "Low" : "In stock"}
                        </span>
                      </td>
                      <td>
                        <span className={`inventory-status ${review.cls}`}>{review.label}</span>
                        {product.reviewStatus === "rejected" && product.rejectionReason && (
                          <small className="inventory-help" style={{ display: "block" }}>
                            Reason: {product.rejectionReason}
                          </small>
                        )}
                      </td>
                      <td>
                        <button type="button" className="inventory-secondary-btn" onClick={() => openEdit(product)}>
                          Edit
                        </button>{" "}
                        <button type="button" className="inventory-secondary-btn" onClick={() => handleDelete(product)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm && (
        <div
          className="inventory-modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeForm();
          }}
        >
          <section className="inventory-modal" role="dialog" aria-modal="true" aria-labelledby="product-form-title">
            <header className="inventory-modal-header">
              <div>
                <p className="inventory-eyebrow">{editing ? "CATALOG / EDIT LISTING" : "CATALOG / NEW LISTING"}</p>
                <h2 id="product-form-title">{editing ? "Edit product" : "Add a product"}</h2>
                <p>
                  {editing
                    ? "Saving sends this product back for admin approval."
                    : "Share the details shoppers need to make a confident choice."}
                </p>
              </div>
              <button className="inventory-icon-btn" type="button" onClick={closeForm} aria-label="Close product form">
                <Icon name="close" size={20} />
              </button>
            </header>

            <form className="inventory-form" onSubmit={handleSubmit}>
              <div className="inventory-form-section">
                <div className="inventory-section-title">
                  <span>01</span>
                  <div><h3>Product details</h3><p>Start with the essentials.</p></div>
                </div>

                <div className="inventory-field">
                  <label htmlFor="product-title">Product title <em>*</em></label>
                  <input id="product-title" value={form.title} onChange={(e) => setField("title", e.target.value)} placeholder="e.g. Everyday linen shirt" maxLength={120} required />
                </div>

                <div className="inventory-field">
                  <label htmlFor="product-description">Description <em>*</em></label>
                  <textarea id="product-description" value={form.description} onChange={(e) => setField("description", e.target.value)} placeholder="Describe the product, its materials, fit, or key features…" rows={4} required />
                  <span className="inventory-help">Keep it clear and helpful for your customers.</span>
                </div>

                <div className="inventory-field">
                  <label htmlFor="product-image">Product image {(!editing || !editing.imgUrl) && <em>*</em>}</label>
                  <label htmlFor="product-image" className="inventory-image-upload">
                    <input id="product-image" type="file" accept="image/*" onChange={handleImageChange} aria-describedby="product-image-help" />
                    {previewSrc ? (
                      <div className="inventory-image-preview">
                        <img src={previewSrc} alt="Product preview" />
                        <span>{form.image?.name || "Current image"}</span>
                      </div>
                    ) : (
                      <div className="inventory-image-placeholder">
                        <Icon name="upload" size={24} />
                        <strong>Choose an image</strong>
                        <span>Click to browse your device</span>
                      </div>
                    )}
                  </label>
                  <span id="product-image-help" className="inventory-help">
                    JPG, PNG, WebP or similar. Maximum 3 MB.
                    {editing?.imgUrl && " Leave empty to keep the current image."}
                  </span>
                  {form.image && (
                    <button
                      type="button"
                      className="inventory-secondary-btn"
                      onClick={() => {
                        setField("image", null);
                        const input = document.getElementById("product-image");
                        if (input) input.value = "";
                      }}
                    >
                      {editing ? "Use current image" : "Remove image"}
                    </button>
                  )}
                </div>

                <div className="inventory-field">
                  <label htmlFor="product-category">Category <em>*</em></label>
                  <select id="product-category" value={form.category} onChange={(e) => setField("category", e.target.value)} required disabled={categoriesLoading || categories.length === 0}>
                    <option value="">
                      {categoriesLoading ? "Loading categories…" : categories.length ? "Choose a category" : "No categories available"}
                    </option>
                    {categories.map((c) => (
                      <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
                    ))}
                  </select>
                  {!categoriesLoading && categories.length === 0 && (
                    <span className="inventory-field-error">Ask an admin to create categories before publishing a product.</span>
                  )}
                </div>
              </div>

              <div className="inventory-form-section">
                <div className="inventory-section-title">
                  <span>02</span>
                  <div><h3>Options & inventory</h3><p>Choose how this product is sold.</p></div>
                </div>

                <fieldset className="inventory-variant-choice">
                  <legend>Does this product have variants?</legend>
                  <label className={`inventory-radio-card ${form.hasVariants === "no" ? "is-selected" : ""}`}>
                    <input type="radio" name="hasVariants" value="no" checked={form.hasVariants === "no"} onChange={(e) => setField("hasVariants", e.target.value)} />
                    <span className="inventory-radio-dot" />
                    <span><strong>No variants</strong><small>One price and stock quantity</small></span>
                  </label>
                  <label className={`inventory-radio-card ${form.hasVariants === "yes" ? "is-selected" : ""}`}>
                    <input type="radio" name="hasVariants" value="yes" checked={form.hasVariants === "yes"} onChange={(e) => setField("hasVariants", e.target.value)} />
                    <span className="inventory-radio-dot" />
                    <span><strong>Yes, variants</strong><small>Different colors, sizes, or options</small></span>
                  </label>
                </fieldset>

                {form.hasVariants === "no" ? (
                  <div className="inventory-two-col">
                    <div className="inventory-field">
                      <label htmlFor="product-price">Price (GH₵) <em>*</em></label>
                      <div className="inventory-price-input">
                        <span>GH₵</span>
                        <input id="product-price" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setField("price", e.target.value)} placeholder="0.00" required />
                      </div>
                    </div>
                    <div className="inventory-field">
                      <label htmlFor="product-stock">Stock quantity <em>*</em></label>
                      <input id="product-stock" type="number" min="0" step="1" value={form.stock} onChange={(e) => setField("stock", e.target.value)} placeholder="e.g. 25" required />
                    </div>
                  </div>
                ) : (
                  <div className="inventory-variants-list">
                    <div className="inventory-variants-heading">
                      <div><strong>Product variants</strong><span>Set a price and stock for each option.</span></div>
                      <span className="inventory-variant-count">
                        {form.variants.length} {form.variants.length === 1 ? "variant" : "variants"}
                      </span>
                    </div>

                    {form.variants.map((variant, index) => (
                      <div className="inventory-variant-card" key={index}>
                        <div className="inventory-variant-card-top">
                          <strong>Variant {String(index + 1).padStart(2, "0")}</strong>
                          {form.variants.length > 1 && (
                            <button type="button" className="inventory-remove-variant" onClick={() => removeVariant(index)}>Remove</button>
                          )}
                        </div>
                        <div className="inventory-variant-grid">
                          <div className="inventory-field">
                            <label htmlFor={`variant-color-${index}`}>Color <em>*</em></label>
                            <input id={`variant-color-${index}`} value={variant.color} onChange={(e) => updateVariant(index, "color", e.target.value)} placeholder="e.g. Sand" required />
                          </div>
                          <div className="inventory-field">
                            <label htmlFor={`variant-size-${index}`}>Size <em>*</em></label>
                            <input id={`variant-size-${index}`} value={variant.size} onChange={(e) => updateVariant(index, "size", e.target.value)} placeholder="e.g. Medium" required />
                          </div>
                          <div className="inventory-field">
                            <label htmlFor={`variant-price-${index}`}>Price (USD) <em>*</em></label>
                            <div className="inventory-price-input">
                              <span>$</span>
                              <input id={`variant-price-${index}`} type="number" min="0" step="0.01" value={variant.price} onChange={(e) => updateVariant(index, "price", e.target.value)} placeholder="0.00" required />
                            </div>
                          </div>
                          <div className="inventory-field">
                            <label htmlFor={`variant-stock-${index}`}>Stock <em>*</em></label>
                            <input id={`variant-stock-${index}`} type="number" min="0" step="1" value={variant.stock} onChange={(e) => updateVariant(index, "stock", e.target.value)} placeholder="e.g. 10" required />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button type="button" className="inventory-add-variant" onClick={addVariant}>
                      <Icon name="plus" size={16} /> Add another variant
                    </button>
                  </div>
                )}
              </div>

              <footer className="inventory-form-footer">
                <p><Icon name="check" size={15} /> New and edited products are reviewed before going live.</p>
                <div>
                  <button type="button" className="inventory-secondary-btn" onClick={closeForm} disabled={saving}>Cancel</button>
                  <button type="submit" className="inventory-primary-btn" disabled={saving || categories.length === 0}>
                    <Icon name="upload" size={16} />
                    {saving ? "Saving…" : editing ? "Save changes" : "Submit for approval"}
                  </button>
                </div>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}