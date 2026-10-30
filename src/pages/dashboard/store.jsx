import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMyStore, STORE_FIELDS } from "../../context/myStoreContext";
import { saveMyStore } from "../../services/dashboardService";
import { useNotify } from "../../hooks/useNotify";
import { PageHeader, RowSkeleton, ErrorState } from "../../components/dashboard/ui";
import { getImageUrl } from "../../utils/productHelpers";
import "../../css/tokens.css";
import "../../css/shop.css";
import "../../css/dashboardUi.css";

const MAX_LOGO = 2 * 1024 * 1024;

export default function StorePage() {
  const { store, loading, error, reload, setStore, percent } = useMyStore();
  const notify = useNotify();
  const [form, setForm] = useState({ name: "", description: "", address: "" });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (store) setForm({ name: store.name || "", description: store.description || "", address: store.address || "" });
  }, [store]);

  const localPreview = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  useEffect(() => () => localPreview && URL.revokeObjectURL(localPreview), [localPreview]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const pickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/^image\/(png|jpe?g|webp)$/i.test(f.type)) return setErrors((x) => ({ ...x, logo: "Use a PNG, JPG or WebP image." }));
    if (f.size > MAX_LOGO) return setErrors((x) => ({ ...x, logo: "Logo must be under 2 MB." }));
    setErrors((x) => ({ ...x, logo: undefined }));
    setFile(f);
  };

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = "Store name must be at least 2 characters.";
    if (form.name.trim().length > 80) e.name = "Store name can be at most 80 characters.";
    if (form.description.length > 500) e.description = "Description can be at most 500 characters.";
    setErrors((x) => ({ logo: x.logo, ...e }));
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("description", form.description.trim());
    fd.append("address", form.address.trim());
    if (file) fd.append("logo", file);
    setSaving(true);
    try {
      const saved = await saveMyStore(fd);
      setStore(saved);
      setFile(null);
      notify.success("Store saved. Buyers can now see these details.");
    } catch (e) {
      notify.error(e?.response?.data?.message || "We couldn't save your store. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="lm-d"><PageHeader title="My store" /><RowSkeleton rows={2} height={200} /></div>;
  if (error) return <div className="lm-d"><PageHeader title="My store" /><ErrorState onRetry={reload} /></div>;

  const logoSrc = localPreview || (store?.logo ? getImageUrl(store.logo) : "");
  const previewName = form.name.trim() || "Your store name";
  const done = (k) => (k === "logo" ? !!(logoSrc) : !!String((k in form ? form[k] : "") || "").trim());

  return (
    <div className="lm-d">
      <PageHeader
        title="My store"
        subtitle="This is what buyers see next to your products. To hide your store for a while, use Settings."
        actions={store?._id && <Link to={`/stores/${store._id}`} className="lm-btn lm-btn--ghost lm-btn--sm">View public page</Link>}
      />

      <div className="lm-d-grid2">
        <form className="lm-d-card" onSubmit={submit} noValidate>
          <div className="lm-d-card__head"><h2>Store details</h2></div>
          <div className="lm-d-card__body lm-d-form">
            <div className="lm-d-field">
              <label>Logo</label>
              <div className="lm-logo-pick">
                <span className="lm-logo">{logoSrc ? <img src={logoSrc} alt="" /> : previewName.slice(0, 1).toUpperCase()}</span>
                <div>
                  <input id="logo" type="file" accept="image/png,image/jpeg,image/webp" onChange={pickFile} />
                  <div className="lm-hint"><span>Square image, PNG, JPG or WebP, up to 2 MB</span></div>
                  {errors.logo && <div className="lm-err" role="alert">{errors.logo}</div>}
                </div>
              </div>
            </div>

            <div className={`lm-d-field ${errors.name ? "has-error" : ""}`}>
              <label htmlFor="name">Store name</label>
              <input id="name" className="lm-input" value={form.name} onChange={set("name")} maxLength={80} />
              {errors.name && <div className="lm-err" role="alert">{errors.name}</div>}
            </div>

            <div className={`lm-d-field ${errors.description ? "has-error" : ""}`}>
              <label htmlFor="description">Description</label>
              <textarea id="description" className="lm-input" rows={4} value={form.description} onChange={set("description")} maxLength={500} placeholder="What do you sell? What makes your store special?" />
              <div className="lm-hint"><span>Shown on your store page</span><span>{form.description.length}/500</span></div>
              {errors.description && <div className="lm-err" role="alert">{errors.description}</div>}
            </div>

            <div className="lm-d-field">
              <label htmlFor="address">Address / location</label>
              <input id="address" className="lm-input" value={form.address} onChange={set("address")} placeholder="e.g. Osu, Accra" />
              <div className="lm-hint"><span>Helps buyers know where items ship from</span></div>
            </div>

            <div><button type="submit" className="lm-btn" disabled={saving}>{saving ? "Saving…" : "Save store"}</button></div>
          </div>
        </form>

        <div style={{ display: "grid", gap: 18 }}>
          <div className="lm-d-card">
            <div className="lm-d-card__head"><h2>Preview</h2></div>
            <div className="lm-d-card__body">
              <div className="lm-seller">
                <div className="lm-seller__logo">{logoSrc ? <img src={logoSrc} alt="" /> : previewName.slice(0, 1).toUpperCase()}</div>
                <div>
                  <div className="lm-seller__name">{previewName}</div>
                  <div className="lm-seller__meta">{form.address.trim() || "Add your location"}</div>
                </div>
              </div>
              {form.description.trim() && <p className="lm-d-sub" style={{ marginTop: 12 }}>{form.description.trim()}</p>}
            </div>
          </div>

          <div className="lm-d-card">
            <div className="lm-d-card__head"><h2>Completeness</h2><strong>{percent}%</strong></div>
            <div className="lm-d-card__body">
              <ul className="lm-check-list">
                {STORE_FIELDS.map((f) => (
                  <li key={f.key} className={done(f.key) ? "is-ok" : ""}><i>{done(f.key) ? "✓" : ""}</i>{f.label}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}