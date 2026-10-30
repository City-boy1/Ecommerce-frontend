import { useMyStore } from "../../context/myStoreContext";
import "../../css/adminOversight.css";

// Shown to a seller on every dashboard page while an admin has suspended their store.
// Reads store.status and store.suspensionReason from GET /stores/mine (Part 3 §6.2).
// Cannot be hidden: the seller must always see why.
export default function SuspendedBanner() {
  const { store } = useMyStore();
  if (!store || store.status !== "suspended") return null;

  return (
    <div className="lm-ao-banner" role="alert">
      <div>
        <strong>Your store is suspended</strong>
        <p>
          Buyers can't see your store or products, and no new orders can be placed.
          {store.suspensionReason ? ` Reason: ${store.suspensionReason}` : ""}
        </p>
        <p>Orders already in progress carry on, so please keep fulfilling them. Contact support if you think this is a mistake.</p>
      </div>
    </div>
  );
}