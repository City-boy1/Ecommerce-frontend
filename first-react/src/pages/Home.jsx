import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCategories, getProducts } from "../services/shopService";
import { categoryImageUrl } from "../utils/categoryImage";
import ProductCard from "../components/shop/ProductCard";
import { useNotify } from "../hooks/useNotify";
import "../css/tokens.css";
import "../css/shop.css"; // ProductCard + skeleton styles
import "../css/HomePage.css";

const BENEFITS = [
  {
    title: "Delivery across Ghana",
    text: "From sellers in Accra to Tamale",
    icon: <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a1.6 1.6 0 1 0 0-.01M17 19a1.6 1.6 0 1 0 0-.01" />,
  },
  {
    title: "Pay your way",
    text: "Mobile money and cards",
    icon: <path d="M3 6h18v12H3zM3 10h18M7 15h3" />,
  },
  {
    title: "Verified sellers",
    text: "Independent shops you can trust",
    icon: <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6zM9 12l2 2 4-4" />,
  },
];

function BenefitIcon({ children }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

function CategoryCard({ category, index }) {
  const [broken, setBroken] = useState(false);
  const src = categoryImageUrl(category.image || category.imageUrl);
  const showImage = src && !broken;
  const to = `/shop?category=${encodeURIComponent(category.slug || category._id)}`;

  return (
    <Link to={to} className={`home-category-card ${showImage ? "" : "is-plain"}`}>
      {showImage && <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} />}
      <span className="home-category-number">{String(index + 1).padStart(2, "0")}</span>
      <div className="home-category-overlay">
        <div>
          <h3>{category.name}</h3>
          {category.description && <p>{category.description}</p>}
        </div>
        <span className="home-category-arrow" aria-hidden="true">↗</span>
      </div>
    </Link>
  );
}

function ProductRow({ eyebrow, title, description, to, linkLabel, products, loading }) {
  if (!loading && products.length === 0) return null; // hide empty sections

  return (
    <section className="home-section">
      <div className="home-section-heading">
        <div>
          <span className="home-eyebrow">{eyebrow}</span>
          <h2>{title}<span>.</span></h2>
          {description && <p className="home-section-description">{description}</p>}
        </div>
        <Link to={to} className="home-underlined-link">
          {linkLabel} <span aria-hidden="true">↗</span>
        </Link>
      </div>

      <div className="lm-grid">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="lm-skel" style={{ aspectRatio: "3/4" }} />)
          : products.map((p) => <ProductCard key={p._id || p.id} product={p} />)}
      </div>
    </section>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const notify = useNotify();
  const [categories, setCategories] = useState([]);
  const [newest, setNewest] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [loading, setLoading] = useState(true);

  const role = user?.role;
  const isGuest = !user;
  const isSeller = role === "seller";
  const canBecomeSeller = isGuest || role === "buyer";

  useEffect(() => {
    let cancelled = false;

    // Each request fails on its own, so one bad call never blanks the page.
    Promise.all([
      getCategories().catch(() => []),
      getProducts({ sort: "newest", limit: 8, inStock: true }).catch(() => ({ products: [] })),
      getProducts({ sort: "rating", minRating: 3, limit: 4, inStock: true }).catch(() => ({ products: [] })),
    ]).then(([cats, fresh, rated]) => {
      if (cancelled) return;
      // Featured categories first when any exist, then by `order` from the server.
      const featured = cats.filter((c) => c.featured);
      setCategories((featured.length ? featured : cats).slice(0, 8));
      setNewest(fresh.products);
      setTopRated(rated.products);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  function handleNewsletterSubmit(event) {
    event.preventDefault();
    notify.success("Newsletter signup will be available soon.");
  }

  // Guests sign up first and land on the upgrade page; buyers go straight to it.
  const sellerLinkProps = isSeller
    ? { to: "/dashboard/store" }
    : isGuest
      ? { to: "/auth/signup", state: { from: { pathname: "/become-seller" } } }
      : { to: "/become-seller" };

  return (
    <main className="home-page">
      {/* HERO */}
      <section className="home-hero">
        <div className="home-hero-content">
          <span className="home-eyebrow">MADE BY INDEPENDENT SELLERS</span>

          <h1>
            Shop local.
            <br />
            <em>Find what feels like you.</em>
          </h1>

          <p>
            Fashion, home and everyday finds from independent sellers across
            Ghana, all in one place.
          </p>

          <div className="home-hero-actions">
            <Link to="/shop" className="home-button home-button-dark">
              Shop now <span aria-hidden="true">↗</span>
            </Link>

            {canBecomeSeller || isSeller ? (
              <Link {...sellerLinkProps} className="home-text-link">
                {isSeller ? "Manage your store" : "Become a seller"}
              </Link>
            ) : (
              <Link to="/shop?sort=newest" className="home-text-link">
                See what's new
              </Link>
            )}
          </div>

          <div className="home-hero-note">
            <span className="home-note-line" />
            Every purchase supports a small business.
          </div>
        </div>

        <div className="home-hero-visual">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=90"
            alt="A carefully arranged retail collection"
            className="home-hero-image"
          />

          <div className="home-hero-caption">
            <span>CURATED FOR YOU</span>
            <span>01 / THE COLLECTION</span>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="home-benefits" aria-label="Shopping benefits">
        {BENEFITS.map((b) => (
          <div className="home-benefit" key={b.title}>
            <span className="home-benefit-icon">
              <BenefitIcon>{b.icon}</BenefitIcon>
            </span>
            <div>
              <strong>{b.title}</strong>
              <span>{b.text}</span>
            </div>
          </div>
        ))}
      </section>

      {/* CATEGORIES (hidden when there are none) */}
      {categories.length > 0 && (
        <section className="home-section">
          <div className="home-section-heading">
            <div>
              <span className="home-eyebrow">FIND YOUR SOMETHING</span>
              <h2>Explore by category<span>.</span></h2>
            </div>
            <Link to="/shop" className="home-underlined-link">
              View everything <span aria-hidden="true">↗</span>
            </Link>
          </div>

          <div className="home-category-grid">
            {categories.map((category, index) => (
              <CategoryCard key={category._id || category.slug} category={category} index={index} />
            ))}
          </div>
        </section>
      )}

      <ProductRow
        eyebrow="JUST IN"
        title="New arrivals"
        description="Fresh from our sellers this week."
        to="/shop?sort=newest"
        linkLabel="Shop new arrivals"
        products={newest}
        loading={loading}
      />

      <ProductRow
        eyebrow="LOVED BY BUYERS"
        title="Top rated"
        to="/shop?sort=rating"
        linkLabel="See top rated"
        products={topRated}
        loading={false}
      />

      {/* SELLER CALL TO ACTION: guests and buyers */}
      {canBecomeSeller && (
        <section className="home-editorial">
          <div className="home-editorial-image">
            <img
              src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85"
              alt=""
              loading="lazy"
            />
          </div>

          <div className="home-editorial-content">
            <span className="home-eyebrow">SELL ON LUMORA</span>
            <h2>
              Turn what you make
              <br />
              <em>into a business.</em>
            </h2>
            <p>
              Open your store in minutes, list your products and reach buyers
              across Ghana. We handle the checkout, you run the shop.
            </p>
            <Link {...sellerLinkProps} className="home-button home-button-dark">
              Start selling <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </section>
      )}

      {/* NEWSLETTER */}
      <section className="home-newsletter">
        <div className="home-newsletter-copy">
          <span className="home-eyebrow">A NOTE FROM US</span>
          <h2>Good things, occasionally.</h2>
          <p>New arrivals and standout sellers, with no unnecessary noise.</p>
        </div>

        <form className="home-newsletter-form" onSubmit={handleNewsletterSubmit}>
          <label className="home-visually-hidden" htmlFor="home-newsletter-email">
            Email address
          </label>
          <input id="home-newsletter-email" type="email" placeholder="Your email address" required />
          <button type="submit" aria-label="Subscribe to newsletter">
            Join us <span aria-hidden="true">↗</span>
          </button>
          <p>By subscribing, you agree to receive occasional store updates.</p>
        </form>
      </section>
    </main>
  );
}