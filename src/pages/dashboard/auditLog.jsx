import { useState } from "react";
import useAdminFetch from "../../hooks/useAdminFetch";
import { getAuditLog } from "../../services/adminService";
import { PageHeader, Tabs, EmptyState, RowSkeleton, ErrorState } from "../../components/dashboard/ui";
import "../../css/tokens.css";
import "../../css/shop.css";
import "../../css/dashboardUi.css";
import "../../css/adminOversight.css";

const ACTION_LABEL = {
  seller_suspended: "Suspended a seller",
  seller_reinstated: "Reinstated a seller",
  dispute_resolved: "Resolved a dispute",
  order_cancelled_by_admin: "Cancelled an order",
  product_approved: "Approved a product",
  product_rejected: "Rejected a product",
  category_created: "Created a category",
  category_updated: "Renamed a category",
  category_deleted: "Deleted a category",
    deletion_approved: "Closed an account",
  deletion_declined: "Declined an account deletion",
};

const OUTCOME_LABEL = {
  resolved_refund: "Refunded",
  resolved_no_action: "No action",
  closed: "Closed",
};

const when = (d) => new Date(d).toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short" });

export default function AuditLog() {
  const [area, setArea] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAdminFetch(
    () => getAuditLog({ area, page }),
    [area, page]
  );

  const entries = data?.entries || [];
  const pages = data?.pages || 1;

  const changeArea = (v) => {
    setArea(v);
    setPage(1);
  };

  return (
    <div className="lm-d">
      <PageHeader title="Audit log" subtitle="Every admin decision, with who made it and why. Entries can't be edited or deleted." />

      <Tabs
        label="Filter by area"
        value={area}
        onChange={changeArea}
        tabs={[
          { value: "", label: "All" },
          { value: "sellers", label: "Sellers" },
          { value: "disputes", label: "Disputes" },
          { value: "orders", label: "Orders" },
          { value: "products", label: "Products" },
          { value: "categories", label: "Categories" },
                    { value: "accounts", label: "Accounts" },
        ]}
      />

      {loading && !data && <RowSkeleton rows={5} height={64} />}
      {!loading && error && !data && <ErrorState onRetry={reload} />}
      {!loading && data && entries.length === 0 && (
        <EmptyState title="Nothing recorded yet" text="Admin actions will appear here as they happen." />
      )}

      {entries.length > 0 && (
        <section className="lm-d-card">
          {entries.map((e) => (
            <div className="lm-ao-audit" key={e._id}>
              <div>
                <strong>{ACTION_LABEL[e.action] || e.action}</strong>
                {e.targetLabel && <> · {e.targetLabel}</>}
                {e.meta?.outcome && <> · {OUTCOME_LABEL[e.meta.outcome] || e.meta.outcome}</>}
                {e.reason && <p className="lm-ao-audit__reason">{e.reason}</p>}
              </div>
              <div className="lm-ao-audit__who">
                {e.actor?.name}
                <small>{when(e.createdAt)}</small>
              </div>
            </div>
          ))}
        </section>
      )}

      {pages > 1 && (
        <div className="lm-ao-pager">
          <button className="lm-btn lm-btn--ghost lm-btn--sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span>Page {page} of {pages}</span>
          <button className="lm-btn lm-btn--ghost lm-btn--sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}