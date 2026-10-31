import { useCallback, useEffect, useRef, useState } from "react";
import { axiosPrivate } from "../../api/axios";
import { useToast } from "../../context/ToastContext";
import { getImageUrl, formatPrice } from "../../utils/productHelpers";
import "../../css/inventory.css";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export default function Products() {
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const [status, setStatus] = useState("pending");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosPrivate.get("/admin/products", { params: { status } });
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setProducts([]);
      toastRef.current?.error?.(err.response?.data?.message || "Could not load products.");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (id) => {
    setBusyId(id);
    try {
      await axiosPrivate.patch(`/admin/products/${id}/approve`);
      setProducts((list) => list.filter((p) => p._id !== id));
      toastRef.current?.success?.("Product approved and now live in the shop.");
    } catch (err) {
      toastRef.current?.error?.(err.response?.data?.message || "Could not approve product.");
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id) => {
    const reason = window.prompt("Why is this product being rejected? The seller will see this.");
    if (reason === null) return;
    if (!reason.trim()) {
      toastRef.current?.error?.("A reason is required.");
      return;
    }

    setBusyId(id);
    try {
      await axiosPrivate.patch(`/admin/products/${id}/reject`, { reason: reason.trim() });
      setProducts((list) => list.filter((p) => p._id !== id));
      toastRef.current?.success?.("Product rejected. The seller can see your reason.");
    } catch (err) {
      toastRef.current?.error?.(err.response?.data?.message || "Could not reject product.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="seller-inventory">
      <header className="inventory-heading">
        <div>
          <p className="inventory-eyebrow">ADMIN WORKSPACE / CATALOG</p>
          <h1>Product approvals</h1>
          <p className="inventory-subtitle">Review seller submissions before they appear in the shop.</p>
        </div>
      </header>

      <section className="inventory-list-panel">
        <div className="inventory-list-header">
          <div>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={tab.key === status ? "inventory-primary-btn" : "inventory-secondary-btn"}
                onClick={() => setStatus(tab.key)}
                style={{ marginRight: 8 }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="inventory-loading">Loading…</div>
        ) : products.length === 0 ? (
          <div className="inventory-empty">
            <h3>Nothing here</h3>
            <p>No {status} products right now.</p>
          </div>
        ) : (
          <div className="inventory-table-wrap">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Seller</th>
                  <th>Category</th>
                  <th>Variants</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const img = getImageUrl(p);
                  return (
                    <tr key={p._id}>
                      <td>
                        <div className="inventory-product-cell">
                          {img && <img src={img} alt="" className="inventory-product-thumb" />}
                          <div className="inventory-product-copy">
                            <strong>{p.title}</strong>
                            <span>{p.description?.slice(0, 80)}</span>
                            {p.rejectionReason && <span>Reason: {p.rejectionReason}</span>}
                          </div>
                        </div>
                      </td>
                      <td>{p.createdBy?.name || p.createdBy?.email || "Unknown"}</td>
                      <td>{p.category?.name || "Uncategorized"}</td>
                      <td>
                        {(p.variants || []).map((v, i) => (
                          <div key={i}>{v.color} / {v.size}: {formatPrice(v.price)} ({v.stock})</div>
                        ))}
                      </td>
                      <td>
                        {status !== "approved" && (
                          <button type="button" className="inventory-primary-btn" disabled={busyId === p._id} onClick={() => approve(p._id)}>
                            Approve
                          </button>
                        )}{" "}
                        {status !== "rejected" && (
                          <button type="button" className="inventory-secondary-btn" disabled={busyId === p._id} onClick={() => reject(p._id)}>
                            Reject
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}