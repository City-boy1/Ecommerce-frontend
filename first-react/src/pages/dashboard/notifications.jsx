import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../context/notificationContext";
import { PageHeader, Tabs, EmptyState, RowSkeleton } from "../../components/dashboard/ui";
import { timeAgo } from "../../utils/dateHelpers";
import "../../css/tokens.css";
import "../../css/shop.css";
import "../../css/dashboardUi.css";

export default function Notifications() {
  const { items, loading, unread, markRead, markAllRead } = useNotifications();
  const [tab, setTab] = useState("all");
  const navigate = useNavigate();

  const shown = tab === "unread" ? items.filter((n) => !n.read) : items;

  const open = (n) => {
    if (!n.read) markRead(n._id);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="lm-d">
      <PageHeader
        title="Notifications"
        subtitle={unread ? `${unread} unread` : "You're all caught up."}
        actions={unread > 0 && <button className="lm-btn lm-btn--ghost lm-btn--sm" onClick={markAllRead}>Mark all as read</button>}
      />

      <Tabs
        label="Filter notifications"
        value={tab}
        onChange={setTab}
        tabs={[{ value: "all", label: "All", count: items.length }, { value: "unread", label: "Unread", count: unread }]}
      />

      {loading && items.length === 0 && <RowSkeleton rows={4} height={64} />}

      {!loading && shown.length === 0 && (
        <EmptyState
          title={tab === "unread" ? "No unread notifications" : "No notifications yet"}
          text="Order updates, reviews and product decisions will show up here."
        />
      )}

      {shown.length > 0 && (
        <section className="lm-d-card">
          {shown.map((n) => (
            <button key={n._id} className={`lm-note ${n.read ? "" : "is-unread"}`} onClick={() => open(n)}>
              <span className="lm-note__dot" aria-label={n.read ? "Read" : "Unread"} />
              <span>
                <strong>{n.title}</strong>
                {n.message && <span>{n.message}</span>}
              </span>
              <time dateTime={n.createdAt}>{timeAgo(n.createdAt)}</time>
            </button>
          ))}
        </section>
      )}
    </div>
  );
}