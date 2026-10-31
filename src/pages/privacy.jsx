import { Link } from "react-router-dom";
import LegalPage from "../components/LegalPage";

// TODO before launch: replace the contact email, add your business name, and have a lawyer review this page.
const CONTACT_EMAIL = "privacy@your-domain.com";
const UPDATED = "31 October 2026";

export default function Privacy() {
  return (
    <LegalPage eyebrow="Legal" title="Privacy policy" updated={UPDATED}>
      <p className="lm-legal__note">
        This page explains what personal information Lumora collects, why, who can see it, and the choices you have.
        It goes with our <Link to="/terms">Terms of use</Link>.
      </p>

      <h2>1. What we collect</h2>
      <ul>
        <li><strong>Account details:</strong> your name, email address and password. We never store your password itself, only a protected version of it.</li>
        <li><strong>Profile details you choose to add:</strong> phone number, address, delivery instructions, short bio and profile photo.</li>
        <li><strong>Orders:</strong> what you bought, from whom, the delivery name, address and phone number you gave at checkout, and the status of each order.</li>
        <li><strong>Payment details:</strong> for Mobile Money we keep only the network and the last 4 digits of your number. We don't store card numbers. Payment is currently in test mode.</li>
        <li><strong>If you sell:</strong> your store name, description, logo, address, and the products you list.</li>
        <li><strong>Problem reports and reviews:</strong> your messages and any photos you upload as proof.</li>
        <li><strong>Settings and activity:</strong> notification preferences, and the notifications we send you.</li>
      </ul>

      <h2>2. Why we use it</h2>
      <ul>
        <li>To run your account, process and deliver orders, and show you order updates.</li>
        <li>To let sellers fulfil orders, and to let our team review products, stores and problem reports.</li>
        <li>To send you messages about your account, such as password resets and order updates.</li>
        <li>To keep the marketplace safe, for example by spotting abuse and suspending bad actors.</li>
      </ul>

      <h2>3. Who can see it</h2>
      <ul>
        <li><strong>Sellers</strong> see the name, phone number and delivery address on the orders they must fulfil, and nothing from your other orders.</li>
        <li><strong>Other shoppers</strong> see your first name and last initial on reviews you write. Your email and phone are never shown.</li>
        <li><strong>Lumora's team</strong> can see account, order and report details when needed to review products, handle problem reports and keep the site safe. Admin actions are recorded.</li>
        <li><strong>Service providers</strong> help us run the site, for example the email service that delivers our messages. They only receive what they need to do that.</li>
        <li>We don't sell your personal information.</li>
      </ul>

      <h2>4. Cookies and browser storage</h2>
      <ul>
        <li>A secure sign-in cookie keeps you logged in. It isn't readable by scripts on the page.</li>
        <li>Your cart (when signed out) and your wishlist are kept in your browser's storage on your device.</li>
        <li>We don't use advertising cookies.</li>
      </ul>

      <h2>5. How long we keep it</h2>
      <p>
        We keep your information while your account is open. If your account is closed, your name, email, phone,
        address and photo are removed from your profile. We keep order and problem-report records, without your
        profile details, because sellers, refunds and our own records need them. Delivery details you typed at
        checkout stay on those order records.
      </p>

      <h2>6. Your choices</h2>
      <ul>
        <li>Update your name, phone, address and photo any time on your <Link to="/dashboard/profile">Profile</Link>.</li>
        <li>Choose which notifications you get, and change your password, in <Link to="/dashboard/settings">Settings</Link>.</li>
        <li>Ask us to close your account in Settings. We review each request.</li>
        <li>To ask what we hold about you, or to ask for a correction, email us.</li>
      </ul>

      <h2>7. Keeping your information safe</h2>
      <p>
        We protect accounts with hashed passwords, short-lived sign-in tokens, limits on repeated attempts, and
        checks on every request. No online service is perfectly secure, so please use a strong password you don't
        use anywhere else, and tell us straight away if you think your account was accessed by someone else.
      </p>

      <h2>8. Changes</h2>
      <p>We may update this policy. When we do, we will change the date at the top.</p>

      <h2>9. Contact</h2>
      <p>Privacy questions: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
    </LegalPage>
  );
}