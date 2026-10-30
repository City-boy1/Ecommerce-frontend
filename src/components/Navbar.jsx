import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useNotifications } from "../context/notificationContext";
import { getImageUrl } from "../utils/productHelpers";
import { getCategories } from "../services/shopService";
import "../css/Navbar.css";
import "../css/NavbarExtras.css";

// Reusable SVG icons: no icon library required.
function Icon({ name, size = 21 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    menu: (
      <>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </>
    ),
    close: (
      <>
        <path d="m18 6-12 12" />
        <path d="m6 6 12 12" />
      </>
    ),
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 4.5 4.5" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </>
    ),
    heart: (
      <path d="M20.8 8.8c0 5.2-8.8 10.1-8.8 10.1S3.2 14 3.2 8.8A4.7 4.7 0 0 1 12 6.3a4.7 4.7 0 0 1 8.8 2.5Z" />
    ),
    cart: (
      <>
        <path d="M3 4h2l2.2 11.1a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 1.9-1.5L21 8H6" />
        <circle cx="10" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    chevron: <path d="m7 10 5 5 5-5" />,
    logout: (
      <>
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
      </>
    ),
  };

  return <svg {...common}>{paths[name] || paths.search}</svg>;
}

const badge = (n) => (n > 99 ? "99+" : n);

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count: cartItems } = useCart() || {};
  const { count: wishCount } = useWishlist();
  const { unread } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState([]);
  const [catOpen, setCatOpen] = useState(false);
  const [mobileCatOpen, setMobileCatOpen] = useState(false);
  const catRef = useRef(null);
  const accountRef = useRef(null);

  const cartCount = Number(cartItems) || 0;
  const role = user?.role;
  const isSeller = role === "seller";
  const isBuyer = role === "buyer";
  const canBuy = role !== "admin"; // admins don't have purchases
  const dashboardPath = "/dashboard"; // every role lands on its own Overview

  const displayName = user?.name || user?.email || "";
  const initials = displayName
    ? displayName.trim().charAt(0).toUpperCase()
    : "";

  // Close open menus after navigation.
  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
    setSearchOpen(false);
    setCatOpen(false);
    setMobileCatOpen(false);
  }, [location.pathname, location.search]);

  // Categories for the dropdown. If this fails the link still goes to /shop.
  useEffect(() => {
    let off = false;
    getCategories()
      .then((list) => !off && setCategories(list))
      .catch(() => {});
    return () => {
      off = true;
    };
  }, []);

  // Close dropdowns on outside click or Escape.
  useEffect(() => {
    if (!catOpen && !accountOpen) return undefined;

    const onDown = (event) => {
      if (catOpen && catRef.current && !catRef.current.contains(event.target)) {
        setCatOpen(false);
      }
      if (
        accountOpen &&
        accountRef.current &&
        !accountRef.current.contains(event.target)
      ) {
        setAccountOpen(false);
      }
    };
    const onKey = (event) => {
      if (event.key === "Escape") {
        setCatOpen(false);
        setAccountOpen(false);
      }
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [catOpen, accountOpen]);

  function handleSearch(event) {
    event.preventDefault();

    const query = searchTerm.trim();
    if (!query) return;

    navigate(`/shop?search=${encodeURIComponent(query)}`);
    setSearchTerm("");
    setSearchOpen(false);
    setMenuOpen(false);
  }

  async function handleLogout() {
    setAccountOpen(false);
    setMenuOpen(false);

    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  // Active state looks at the query string too, so only ONE link is highlighted.
  const query = new URLSearchParams(location.search);
  const onShop = location.pathname === "/shop";
  const hasCategory = onShop && query.has("category");
  const isNewest = onShop && !hasCategory && query.get("sort") === "newest";
  const active = {
    home: location.pathname === "/",
    shop: onShop && !hasCategory && !isNewest,
    categories: hasCategory,
    new: isNewest,
  };
  const currentCategory = hasCategory ? query.get("category") : "";

  const navLinks = [
    { key: "home", label: "Home", to: "/" },
    { key: "shop", label: "Shop", to: "/shop" },
    { key: "categories", label: "Categories", menu: true },
    { key: "new", label: "New Arrivals", to: "/shop?sort=newest" },
  ];

  const catTo = (category) =>
    `/shop?category=${encodeURIComponent(category.slug || category._id)}`;
  const isCurrentCat = (category) =>
    currentCategory && currentCategory === (category.slug || category._id);

  return (
    <header className="site-header">
      <nav className="navbar" aria-label="Main navigation">
        <Link
          to="/"
          className="navbar-brand"
          aria-label="Lumora home"
          onClick={() => setMenuOpen(false)}
        >
          LUMORA<span>.</span>
        </Link>

        {/* Desktop links */}
        <div className="navbar-links">
          {navLinks.map((item) =>
            item.menu ? (
              <div className="nav-cat" key={item.key} ref={catRef}>
                <button
                  type="button"
                  className={`navbar-link nav-cat-trigger ${
                    active[item.key] ? "navbar-link-active" : ""
                  }`}
                  aria-haspopup="true"
                  aria-expanded={catOpen}
                  onClick={() => setCatOpen((open) => !open)}
                >
                  {item.label}
                  <Icon name="chevron" size={15} />
                </button>

                {catOpen && (
                  <div className="nav-cat-menu">
                    <Link to="/shop">All products</Link>
                    {categories.map((category) => (
                      <Link
                        key={category._id || category.slug}
                        to={catTo(category)}
                        className={isCurrentCat(category) ? "is-current" : ""}
                      >
                        {category.name}
                      </Link>
                    ))}
                    {categories.length === 0 && (
                      <div className="nav-cat-empty">No categories yet</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.key}
                to={item.to}
                aria-current={active[item.key] ? "page" : undefined}
                className={`navbar-link ${
                  active[item.key] ? "navbar-link-active" : ""
                }`}
              >
                {item.label}
              </Link>
            )
          )}
        </div>

        {/* Desktop search */}
        <form className="navbar-search" onSubmit={handleSearch}>
          <Icon name="search" size={19} />
          <input
            type="search"
            placeholder="Search products..."
            aria-label="Search products"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </form>

        {/* Right-side actions */}
        <div className="navbar-actions">
          <button
            className="navbar-icon-button mobile-search-toggle"
            type="button"
            aria-label="Open search"
            aria-expanded={searchOpen}
            onClick={() => {
              setSearchOpen((open) => !open);
              setMenuOpen(false);
            }}
          >
            <Icon name="search" />
          </button>

          {user && (
            <Link
              to="/dashboard/notifications"
              className="navbar-icon-button nav-badge-host nav-bell"
              aria-label={
                unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
              }
            >
              <Icon name="bell" />
              {unread > 0 && <span className="cart-count">{badge(unread)}</span>}
            </Link>
          )}

          <Link
            to="/wishlist"
            className="navbar-icon-button nav-badge-host"
            aria-label={
              wishCount > 0 ? `Wishlist, ${wishCount} saved` : "Wishlist"
            }
          >
            <Icon name="heart" />
            {wishCount > 0 && <span className="cart-count">{badge(wishCount)}</span>}
          </Link>

          <Link
            to="/cart"
            className="navbar-icon-button cart-button nav-badge-host"
            aria-label={`Shopping cart, ${cartCount} items`}
          >
            <Icon name="cart" />
            {cartCount > 0 && (
              <span className="cart-count">{badge(cartCount)}</span>
            )}
          </Link>

          {/* Account dropdown */}
          {user ? (
            <div className="account-wrapper" ref={accountRef}>
              <button
                type="button"
                className="account-trigger"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen((open) => !open)}
              >
                <span className="account-avatar">
                  {user?.avatar ? (
                    <img
                      src={getImageUrl(user.avatar)}
                      alt=""
                      style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                    />
                  ) : (
                    initials || <Icon name="user" size={19} />
                  )}
                </span>
                <span className="account-name">
                  {displayName || "My account"}
                </span>
                <Icon name="chevron" size={16} />
              </button>

              {accountOpen && (
                <div className="account-dropdown">
                  <Link to={dashboardPath}>Dashboard</Link>
                  <Link to="/dashboard/profile">My profile</Link>
                  {isSeller && <Link to="/dashboard/sales">Incoming orders</Link>}
                  {isSeller && <Link to="/dashboard/store">My store</Link>}
                  {canBuy && (
                    <Link to="/dashboard/orders">
                      {isSeller ? "My purchases" : "My orders"}
                    </Link>
                  )}
                  <Link to="/wishlist">Wishlist</Link>
                  {isBuyer && <Link to="/become-seller">Sell on Lumora</Link>}
                  <button type="button" onClick={handleLogout}>
                    <Icon name="logout" size={17} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="navbar-auth">
              <Link to="/auth/login" className="login-link" state={{ from: location }}>
                Log in
              </Link>
              <Link to="/auth/signup" className="signup-button" state={{ from: location }}>
                Sign up
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="navbar-icon-button menu-toggle"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => {
              setMenuOpen((open) => !open);
              setSearchOpen(false);
              setAccountOpen(false);
            }}
          >
            <Icon name={menuOpen ? "close" : "menu"} size={24} />
          </button>
        </div>
      </nav>

      {/* Compact mobile search */}
      {searchOpen && (
        <form className="mobile-search" onSubmit={handleSearch}>
          <Icon name="search" size={19} />
          <input
            type="search"
            placeholder="Search products..."
            aria-label="Search products"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            autoFocus
          />
          <button type="submit">Search</button>
        </form>
      )}

      {/* Mobile navigation */}
      <div className={`mobile-menu ${menuOpen ? "mobile-menu-open" : ""}`}>
        <div className="mobile-menu-links">
          {navLinks.map((item) =>
            item.menu ? (
              <div key={item.key}>
                <button
                  type="button"
                  className={`mobile-menu-link nav-cat-mobile-trigger ${
                    active[item.key] ? "mobile-menu-link-active" : ""
                  }`}
                  aria-expanded={mobileCatOpen}
                  onClick={() => setMobileCatOpen((open) => !open)}
                >
                  {item.label}
                  <Icon name="chevron" size={16} />
                </button>

                {mobileCatOpen && (
                  <div>
                    <Link
                      to="/shop"
                      className="mobile-menu-link nav-cat-sub"
                      onClick={() => setMenuOpen(false)}
                    >
                      All products
                    </Link>
                    {categories.map((category) => (
                      <Link
                        key={category._id || category.slug}
                        to={catTo(category)}
                        className={`mobile-menu-link nav-cat-sub ${
                          isCurrentCat(category) ? "mobile-menu-link-active" : ""
                        }`}
                        onClick={() => setMenuOpen(false)}
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.key}
                to={item.to}
                className={`mobile-menu-link ${
                  active[item.key] ? "mobile-menu-link-active" : ""
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            )
          )}

          {/* The About page doesn't exist yet: this link shows "not found" until it does. */}
          <Link
            to="/about"
            className="mobile-menu-link"
            onClick={() => setMenuOpen(false)}
          >
            About us
          </Link>

          {user ? (
            <>
              <Link
                to={dashboardPath}
                className="mobile-menu-link"
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/dashboard/notifications"
                className="mobile-menu-link"
                onClick={() => setMenuOpen(false)}
              >
                Notifications
                {unread > 0 && <span className="nav-mobile-count">{badge(unread)}</span>}
              </Link>
              <Link
                to="/dashboard/profile"
                className="mobile-menu-link"
                onClick={() => setMenuOpen(false)}
              >
                My profile
              </Link>
              {isSeller && (
                <>
                  <Link
                    to="/dashboard/sales"
                    className="mobile-menu-link"
                    onClick={() => setMenuOpen(false)}
                  >
                    Incoming orders
                  </Link>
                  <Link
                    to="/dashboard/store"
                    className="mobile-menu-link"
                    onClick={() => setMenuOpen(false)}
                  >
                    My store
                  </Link>
                </>
              )}
              {canBuy && (
                <Link
                  to="/dashboard/orders"
                  className="mobile-menu-link"
                  onClick={() => setMenuOpen(false)}
                >
                  {isSeller ? "My purchases" : "My orders"}
                </Link>
              )}
              {isBuyer && (
                <Link
                  to="/become-seller"
                  className="mobile-menu-link"
                  onClick={() => setMenuOpen(false)}
                >
                  Sell on Lumora
                </Link>
              )}
              <button
                type="button"
                className="mobile-logout"
                onClick={handleLogout}
              >
                Sign out
              </button>
            </>
          ) : (
            <div className="mobile-auth-actions">
              <Link
                to="/auth/login"
                className="mobile-login-button"
                state={{ from: location }}
                onClick={() => setMenuOpen(false)}
              >
                Log in
              </Link>
              <Link
                to="/auth/signup"
                className="mobile-signup-button"
                state={{ from: location }}
                onClick={() => setMenuOpen(false)}
              >
                Create account
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}