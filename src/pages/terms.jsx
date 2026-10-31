import { Link } from "react-router-dom";
import LegalPage from "../components/LegalPage";

// TODO before launch: replace the contact email, add your business name, and have a lawyer review this page.
const CONTACT_EMAIL = "support@your-domain.com";
const UPDATED = "31 October 2026";

export default function Terms() {
  return (
    <LegalPage eyebrow="Legal" title="Terms of use" updated={UPDATED}>
      <p className="lm-legal__note">
        These terms explain how Lumora works for buyers and sellers. By creating an account or placing an order you
        agree to them. Please read them, and our <Link to="/privacy">Privacy policy</Link>.
      </p>

      <h2>1. Your account</h2>
      <ul>
        <li>You must give accurate details and keep your password private. You are responsible for what happens on your account.</li>
        <li>One person, one account. You can ask us to close your account any time from Settings. We review requests, and we can only close an account once its open orders and problem reports are finished.</li>
        <li>We can suspend or close accounts that break these terms.</li>
      </ul>

      <h2>2. Buying</h2>
      <ul>
        <li>Prices are shown in Ghana cedis (GH₵). The price and stock we check when you place your order are the ones that count.</li>
        <li>An order with items from several sellers is split into one order per seller. Each seller prepares, ships and updates their own part.</li>
        <li>You can't buy your own products.</li>
        <li>Delivery fees, where they apply, are confirmed on your order.</li>
      </ul>

      <h2>3. Payments</h2>
      <p>
        Payment is currently in <strong>test mode</strong>: no real money is charged or refunded. We will tell you
        clearly before real payments begin, and these terms will be updated at that point.
      </p>

      <h2>4. Cancelling an order</h2>
      <ul>
        <li><strong>Before the seller confirms:</strong> you can cancel straight away.</li>
        <li><strong>After the seller confirms:</strong> you can send a cancellation request. The seller can approve or refuse it. If they don't answer within 24 hours, the request is approved automatically.</li>
        <li><strong>Once an order is packed or shipped:</strong> it can't be cancelled. After delivery, use "Report a problem".</li>
        <li>If a seller doesn't confirm your order within 48 hours, it is cancelled automatically and you are refunded.</li>
        <li>Sellers can also cancel an order. A seller who cancels after confirming it is recorded against their account.</li>
      </ul>

      <h2>5. Problems with a delivery</h2>
      <ul>
        <li>After the seller marks an order as delivered, you have <strong>7 days</strong> to tell us everything is fine, or to report a problem (wrong item, damaged, not received, or other).</li>
        <li>For wrong or damaged items, please attach at least one photo as proof.</li>
        <li>The seller can reply once. Our team reviews both sides and decides whether to refund or take no action. Our decision is final within Lumora.</li>
      </ul>

      <h2>6. Selling</h2>
      <ul>
        <li>Anyone can open a store. Every product, and every change to a product, is reviewed before shoppers can see it. We may reject a product and will tell you why.</li>
        <li>You must describe products honestly, use your own photos or photos you have the right to use, keep stock and prices accurate, and ship orders promptly.</li>
        <li>Confirm new orders within 48 hours. Orders left unconfirmed are cancelled automatically.</li>
        <li>We may suspend a store that cancels often, ignores orders, or receives repeated valid complaints. Suspension hides your store from buyers and stops new orders. Orders already in progress continue so buyers aren't left stranded.</li>
      </ul>

      <h2>7. What you can't do</h2>
      <ul>
        <li>Sell illegal, counterfeit, stolen or dangerous items, or anything we have told sellers not to list.</li>
        <li>Post fake reviews, or reviews of products you didn't receive.</li>
        <li>Misuse the site: scraping, attacking, or trying to access other people's accounts.</li>
      </ul>

      <h2>8. Reviews</h2>
      <p>
        Only buyers whose order has been delivered can review that product, and each buyer can review a product once.
        Reviews should be honest and respectful.
      </p>

      <h2>9. Our responsibility</h2>
      <p>
        Lumora is a marketplace: sellers, not Lumora, are responsible for the products they sell. We do our best to
        keep the service available and accurate, but we can't promise it will always be uninterrupted or error-free.
        Nothing in these terms limits rights you have under Ghanaian consumer law.
      </p>

      <h2>10. Changes to these terms</h2>
      <p>
        We may update these terms. When we do, we will change the date at the top. If you keep using Lumora after an
        update, you accept the new version.
      </p>

      <h2>11. Contact</h2>
      <p>Questions about these terms: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
    </LegalPage>
  );
}