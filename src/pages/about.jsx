import { Link } from "react-router-dom";
import LegalPage from "../components/LegalPage";
import "../css/shop.css";

export default function About() {
  return (
    <LegalPage eyebrow="About us" title="A marketplace made for Ghana">
      <p>
        Lumora brings buyers and independent sellers together in one place. Shoppers find products from many
        small stores, pay in cedis (GH₵), and follow each parcel from the seller to their door.
      </p>

      <h2>How it works</h2>
      <ul>
        <li><strong>Anyone can browse.</strong> You don't need an account to look around the shop, stores and product pages.</li>
        <li><strong>Every product is reviewed.</strong> Sellers open a store straight away, but each product is checked by our team before shoppers can see it.</li>
        <li><strong>Each seller ships their own items.</strong> If your cart has items from three stores, you get three parcels, each with its own tracking steps.</li>
        <li><strong>You're protected after delivery.</strong> Confirm that everything arrived, or report a problem with photos within 7 days. Our team looks at every report.</li>
      </ul>

      <h2>For sellers</h2>
      <p>
        Opening a store is free and takes a few minutes. You add your products, we review them, and you manage
        incoming orders from your dashboard. Stores that repeatedly cancel orders or leave them unanswered can be
        suspended, which keeps the marketplace reliable for everyone.
      </p>

      <h2>Get in touch</h2>
      <p>Questions or feedback? Reach us through the contact details on our <Link to="/terms">Terms</Link> page.</p>

      <div className="lm-legal__actions">
        <Link to="/shop" className="lm-btn">Start shopping</Link>
        <Link to="/become-seller" className="lm-btn lm-btn--ghost">Open a store</Link>
      </div>
    </LegalPage>
  );
}