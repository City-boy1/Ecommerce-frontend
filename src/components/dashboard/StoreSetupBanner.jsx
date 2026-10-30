import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useMyStore } from "../../context/myStoreContext";
import "../../css/tokens.css";
import "../../css/shop.css";
import "../../css/dashboardUi.css";

// Shown to sellers until their store is 100% complete. Never blocks anything.
// "Hide for now" only hides it for the current visit (plain state, nothing saved),
// so it comes back on the next page load or login until the store is complete.
// It also comes back right after a product is added: dispatch
//   window.dispatchEvent(new Event("lumora:product-added"))
// from Inventory after a successful create.
export default function StoreSetupBanner() {
  const { user } = useAuth();
  const { store, loading, percent, missing } = useMyStore();
  const { pathname } = useLocation();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const comeBack = () => setHidden(false);
    window.addEventListener("lumora:product-added", comeBack);
    return () => window.removeEventListener("lumora:product-added", comeBack);
  }, []);

  if (user?.role !== "seller" || loading || percent === 100 || hidden) return null;
  if (pathname.startsWith("/dashboard/store")) return null;

  const neverSetUp = !store || !String(store.name || "").trim();

  return (
    <section className="lm-d-banner" aria-label="Store setup reminder">
      <div className="lm-d-banner__body">
        <h2>{neverSetUp ? "Set up your store so buyers can trust you" : `Your store is ${percent}% complete`}</h2>
        <p>
          {neverSetUp
            ? "Shoppers see your store name, logo and location next to every product. It takes about two minutes."
            : "A complete store builds trust and helps your products sell."}
        </p>
        <div className="lm-meter" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Store completeness">
          <span style={{ width: `${percent}%` }} />
        </div>
        <div className="lm-chipline" aria-label="Still missing">
          {missing.map((m) => <span key={m.key}>{m.label}</span>)}
        </div>
      </div>
      <div className="lm-d-banner__actions">
        <Link to="/dashboard/store" className="lm-btn lm-btn--sm">{neverSetUp ? "Set up my store" : "Complete my store"}</Link>
        <button type="button" className="lm-linkbtn" onClick={() => setHidden(true)}>Hide for now</button>
      </div>
    </section>
  );
}