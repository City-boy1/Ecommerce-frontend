import { useCallback, useEffect, useRef, useState } from "react";
import { axiosPrivate } from "../../api/axios";
import { useToast } from "../../context/ToastContext";
import "../../css/inventory.css";

export default function Categories() {
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosPrivate.get("/admin/categories");
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setCategories([]);
      toastRef.current?.error?.(err.response?.data?.message || "Could not load categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;

    setAdding(true);
    try {
      await axiosPrivate.post("/admin/categories", { name: name.trim() });
      setName("");
      toastRef.current?.success?.("Category created. Sellers can now choose it.");
      await load();
    } catch (err) {
      toastRef.current?.error?.(err.response?.data?.message || "Could not create category.");
    } finally {
      setAdding(false);
    }
  };

  const saveEdit = async (id) => {
    if (!editName.trim()) return;

    setBusyId(id);
    try {
      await axiosPrivate.put(`/admin/categories/${id}`, { name: editName.trim() });
      setEditingId(null);
      toastRef.current?.success?.("Category updated.");
      await load();
    } catch (err) {
      toastRef.current?.error?.(err.response?.data?.message || "Could not update category.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (category) => {
    if (!window.confirm(`Delete "${category.name}"?`)) return;

    setBusyId(category._id);
    try {
      await axiosPrivate.delete(`/admin/categories/${category._id}`);
      setCategories((list) => list.filter((c) => c._id !== category._id));
      toastRef.current?.success?.("Category deleted.");
    } catch (err) {
      toastRef.current?.error?.(err.response?.data?.message || "Could not delete category.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="seller-inventory">
      <header className="inventory-heading">
        <div>
          <p className="inventory-eyebrow">ADMIN WORKSPACE / CATALOG</p>
          <h1>Categories</h1>
          <p className="inventory-subtitle">Sellers pick from these when they add a product.</p>
        </div>
      </header>

      <section className="inventory-list-panel">
        <form className="inventory-list-header" onSubmit={add}>
          <div className="inventory-field" style={{ flex: 1 }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New category, e.g. Kente & Fabrics"
              maxLength={40}
              aria-label="New category name"
            />
          </div>
          <button type="submit" className="inventory-primary-btn" disabled={adding || !name.trim()}>
            {adding ? "Adding…" : "Add category"}
          </button>
        </form>

        {loading ? (
          <div className="inventory-loading">Loading…</div>
        ) : categories.length === 0 ? (
          <div className="inventory-empty">
            <h3>No categories yet</h3>
            <p>Add one above. Sellers can't publish products until a category exists.</p>
          </div>
        ) : (
          <div className="inventory-table-wrap">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Products</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c._id}>
                    <td>
                      {editingId === c._id ? (
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          maxLength={40}
                          aria-label="Category name"
                          autoFocus
                        />
                      ) : (
                        <strong>{c.name}</strong>
                      )}
                    </td>
                    <td>{c.productCount}</td>
                    <td>
                      {editingId === c._id ? (
                        <>
                          <button type="button" className="inventory-primary-btn" disabled={busyId === c._id} onClick={() => saveEdit(c._id)}>
                            Save
                          </button>{" "}
                          <button type="button" className="inventory-secondary-btn" onClick={() => setEditingId(null)}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="inventory-secondary-btn"
                            onClick={() => {
                              setEditingId(c._id);
                              setEditName(c.name);
                            }}
                          >
                            Rename
                          </button>{" "}
                          <button type="button" className="inventory-secondary-btn" disabled={busyId === c._id} onClick={() => remove(c)}>
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}