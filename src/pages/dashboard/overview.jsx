import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useFetch } from "../../hooks/useFetch";
import { getSummary } from "../../services/dashboardService";
import { PageHeader, StatCard, StatusBadge, RowSkeleton, ErrorState } from "../../components/dashboard/ui";
import { ChartCard, TrendChart, BarsChart } from "../../components/dashboard/charts";
import { deriveOrderStatus, STATUS_LABEL } from "../../utils/orderStatus";
import { formatDate, greeting } from "../../utils/dateHelpers";
import { formatPrice } from "../../utils/productHelpers";
import "../../css/tokens.css";
import "../../css/shop.css";
import "../../css/dashboardUi.css";

const n = (v) => Number(v) || 0;
const shortDay = (d) => new Date(d).toLocaleDateString("en-GH", { day: "numeric", month: "short" });
const compactMoney = (v) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : String(v));

// Chart data arrives from the server as plain rows; labels are prepared here.
const byDay = (rows = [], key) => rows.map((r) => ({ ...r, day: shortDay(r.date), [key]: n(r[key]) }));
const byStatus = (rows = []) => rows.map((r) => ({ label: STATUS_LABEL[r.status] || r.status, count: n(r.count) }));

function BuyerView({ data }) {
  const { count: cartCount } = useCart();
  const { count: wishCount } = useWishlist();
  const s = data.stats || {};
  const recent = data.recentOrders || [];
  const active = data.activeDeliveries || [];
  return (
    <>
      <div className="lm-d-stats">
        <StatCard label="Active orders" value={n(s.activeOrders)} to="/dashboard/orders" tone={n(s.activeOrders) ? "alert" : ""} hint="On their way to you" />
        <StatCard label="Delivered" value={n(s.delivered)} to="/dashboard/orders" />
        <StatCard label="Wishlist" value={wishCount} to="/wishlist" hint="Saved for later" />
        <StatCard label="In your cart" value={cartCount ?? 0} to="/cart" />
      </div>

      <ChartCard
        title="Spending"
        subtitle="Last 6 months"
        data={data.spendingByMonth}
        xKey="month"
        yKey="total"
        xLabel="Month"
        yLabel="Spent"
        valueFormat={formatPrice}
        empty="Your spending will appear here after your first order."
      >
        <BarsChart data={data.spendingByMonth} xKey="month" yKey="total" valueFormat={formatPrice} yTickFormat={compactMoney} />
      </ChartCard>

      <div className="lm-d-grid2">
        <section className="lm-d-card">
          <div className="lm-d-card__head"><h2>Active deliveries</h2><Link to="/dashboard/orders">Track all</Link></div>
          {active.length === 0 ? <p className="lm-d-muted">Nothing on the way right now.</p> : active.map((a, i) => (
            <Link key={i} to="/dashboard/orders" className="lm-d-row">
              <span>{a.store || "Seller"}<small>{a.orderNumber}</small></span>
              <StatusBadge status={a.status} />
            </Link>
          ))}
        </section>
        <section className="lm-d-card">
          <div className="lm-d-card__head"><h2>Recent orders</h2><Link to="/dashboard/orders">View all</Link></div>
          {recent.length === 0 ? (
            <p className="lm-d-muted">You haven't placed an order yet. <Link to="/shop">Start shopping</Link></p>
          ) : recent.map((o) => (
            <Link key={o._id} to="/dashboard/orders" className="lm-d-row">
              <span>{o.orderNumber}<small>{formatDate(o.createdAt)} · {formatPrice(o.grandTotal)}</small></span>
              <StatusBadge status={o.status || deriveOrderStatus(o.subOrders)} />
            </Link>
          ))}
        </section>
      </div>
    </>
  );
}

function SellerView({ data }) {
  const s = data.stats || {};
  const low = data.lowStock || [];
  const sales = data.recentSales || [];
  const salesByDay = byDay(data.salesByDay, "revenue");
  const statuses = byStatus(data.ordersByStatus);
  const top = (data.topProducts || []).map((p) => ({ label: p.title, units: n(p.units) }));
  return (
    <>
      <div className="lm-d-stats">
        <StatCard label="New orders" value={n(s.newOrders)} to="/dashboard/sales" tone={n(s.newOrders) ? "alert" : ""} hint="Waiting for you to confirm" />
        <StatCard label="To ship" value={n(s.toShip)} to="/dashboard/sales" hint="Confirmed or packed" />
        <StatCard label="Low stock" value={n(s.lowStock)} to="/dashboard/inventory" tone={n(s.lowStock) ? "danger" : ""} />
        <StatCard label="Awaiting review" value={n(s.pendingReview)} to="/dashboard/inventory" hint="Products with the admin" />
        <StatCard label="Sales this month" value={formatPrice(s.revenueMonth)} />
      </div>

      {n(s.rejected) > 0 && (
        <div className="lm-d-alert lm-d-alert--warn" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <span>{s.rejected} {s.rejected === 1 ? "product was" : "products were"} rejected. Fix and resubmit to get {s.rejected === 1 ? "it" : "them"} listed.</span>
          <Link to="/dashboard/inventory" className="lm-btn lm-btn--ghost lm-btn--sm">See reasons</Link>
        </div>
      )}

      <ChartCard
        title="Sales"
        subtitle="Last 14 days"
        data={salesByDay}
        xKey="day"
        yKey="revenue"
        xLabel="Day"
        yLabel="Sales"
        valueFormat={formatPrice}
        empty="Sales will appear here as soon as you get your first order."
      >
        <TrendChart data={salesByDay} xKey="day" yKey="revenue" valueFormat={formatPrice} yTickFormat={compactMoney} />
      </ChartCard>

      <div className="lm-d-grid2">
        <ChartCard title="Orders by status" subtitle="All time" data={statuses} xKey="label" yKey="count" xLabel="Status" yLabel="Orders" valueLabel="orders" empty="No orders yet.">
          <BarsChart data={statuses} xKey="label" yKey="count" horizontal valueLabel="orders" />
        </ChartCard>
        <ChartCard title="Best sellers" subtitle="Units sold, last 30 days" data={top} xKey="label" yKey="units" xLabel="Product" yLabel="Units" valueLabel="sold" empty="Your best sellers will show here.">
          <BarsChart data={top} xKey="label" yKey="units" horizontal valueLabel="sold" />
        </ChartCard>
      </div>

      <div className="lm-d-grid2">
        <section className="lm-d-card">
          <div className="lm-d-card__head"><h2>Recent sales</h2><Link to="/dashboard/sales">All orders</Link></div>
          {sales.length === 0 ? <p className="lm-d-muted">No orders yet. They'll appear here as soon as someone buys.</p> : sales.map((o) => (
            <Link key={o._id} to="/dashboard/sales" className="lm-d-row">
              <span>{o.orderNumber}<small>{o.buyerName || "Buyer"} · {formatPrice(o.subtotal)}</small></span>
              <StatusBadge status={o.status} />
            </Link>
          ))}
        </section>
        <section className="lm-d-card">
          <div className="lm-d-card__head"><h2>Running low</h2><Link to="/dashboard/inventory">Inventory</Link></div>
          {low.length === 0 ? <p className="lm-d-muted">All your products are well stocked.</p> : low.map((p, i) => (
            <Link key={`${p._id}-${i}`} to="/dashboard/inventory" className="lm-d-row">
              <span>{p.title}<small>{[p.color, p.size].filter(Boolean).join(" · ") || "Standard"}</small></span>
              <span className="lm-d-badge lm-d-badge--cancelled">{p.stock} left</span>
            </Link>
          ))}
        </section>
      </div>
    </>
  );
}

function AdminView({ data }) {
  const s = data.stats || {};
  const pending = data.pending || [];
  const ordersByDay = byDay(data.ordersByDay, "orders");
  const products = byStatus(data.productsByStatus);
  return (
    <>
      <div className="lm-d-stats">
        <StatCard label="Awaiting approval" value={n(s.pendingProducts)} to="/dashboard/products" tone={n(s.pendingProducts) ? "alert" : ""} hint="Products to review" />
        <StatCard label="Live products" value={n(s.totalProducts)} />
        <StatCard label="New users (7 days)" value={n(s.newUsers7d)} />
        <StatCard label="Orders" value={n(s.totalOrders)} />
      </div>

      <div className="lm-d-grid2">
        <ChartCard title="Orders" subtitle="Last 14 days" data={ordersByDay} xKey="day" yKey="orders" xLabel="Day" yLabel="Orders" valueLabel="orders" empty="No orders in the last 14 days.">
          <BarsChart data={ordersByDay} xKey="day" yKey="orders" valueLabel="orders" />
        </ChartCard>
        <ChartCard title="Products by review status" data={products} xKey="label" yKey="count" xLabel="Status" yLabel="Products" valueLabel="products" empty="No products yet.">
          <BarsChart data={products} xKey="label" yKey="count" horizontal valueLabel="products" />
        </ChartCard>
      </div>

      <section className="lm-d-card">
        <div className="lm-d-card__head"><h2>Waiting for review</h2><Link to="/dashboard/products">Open approvals</Link></div>
        {pending.length === 0 ? <p className="lm-d-muted">Nothing to review. You're all caught up.</p> : pending.map((p) => (
          <Link key={p._id} to="/dashboard/products" className="lm-d-row">
            <span>{p.title}<small>{p.seller ? `by ${p.seller} · ` : ""}{formatDate(p.createdAt)}</small></span>
            <StatusBadge status="pending" />
          </Link>
        ))}
      </section>
    </>
  );
}

export default function Overview() {
  const { user } = useAuth();
  const role = user?.role;
  const { data, loading, error, reload } = useFetch(getSummary, [role], { interval: 60000 });
  const name = user?.name || user?.firstName || user?.username || "";

  const subtitle = { buyer: "Here's what's happening with your orders.", seller: "Here's how your store is doing today.", admin: "Here's what needs your attention." }[role] || "";

  return (
    <div className="lm-d">
      <PageHeader title={`${greeting()}${name ? `, ${name}` : ""}`} subtitle={subtitle} />
      {loading && <RowSkeleton rows={3} height={110} />}
      {!loading && error && <ErrorState onRetry={reload} />}
      {!loading && !error && data && (role === "seller" ? <SellerView data={data} /> : role === "admin" ? <AdminView data={data} /> : <BuyerView data={data} />)}
    </div>
  );
}