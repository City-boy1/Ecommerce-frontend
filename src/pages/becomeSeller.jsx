import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotify } from "../hooks/useNotify";
import { applyAsSeller } from "../services/accountService";
import "../css/tokens.css";
import "../css/becomeSeller.css";

const DRAFT_KEY = "lumora:sellerDraft";
const STEPS = ["Overview", "Your store", "Agreement", "Review"];
const EMPTY = { name: "", description: "", address: "", agreeTerms: false, agreeAccuracy: false, confirm: false };

const COMMITMENTS = [
  "Sell only genuine products that I am legally allowed to sell in Ghana.",
  "Describe products honestly, with accurate photos, prices and stock levels.",
  "Confirm, pack and ship orders promptly, and keep buyers updated.",
  "Handle cancellations and returns fairly, following Lumora's marketplace rules.",
  "Not sell counterfeit, stolen, illegal or prohibited items.",
];

function readDraft() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "{}");
    return {
      ...EMPTY,
      name: typeof saved.name === "string" ? saved.name : "",
      description: typeof saved.description === "string" ? saved.description : "",
      address: typeof saved.address === "string" ? saved.address : "",
    };
  } catch {
    return EMPTY;
  }
}

function validate(step, f) {
  const e = {};
  if (step === 1) {
    if (f.name.trim().length < 3) e.name = "Store name must be at least 3 characters.";
    else if (f.name.trim().length > 60) e.name = "Store name must be 60 characters or fewer.";
    // Description is optional here; it can be added later on the My store page.
    if (f.description.trim().length > 500) e.description = "Keep the description under 500 characters.";
    if (f.address.trim().length < 5) e.address = "Enter the town or area where you operate from.";
  }
  if (step === 2) {
    if (!f.agreeTerms) e.agreeTerms = "You need to accept the seller commitments to continue.";
    if (!f.agreeAccuracy) e.agreeAccuracy = "Please confirm your details are accurate.";
  }
  if (step === 3 && !f.confirm) e.confirm = "Tick the box to confirm you want to open a store.";
  return e;
}

function Stepper({ step }) {
  return (
    <ol className="bs-stepper" aria-label="Progress">
      {STEPS.map((label, i) => (
        <li key={label} className={i === step ? "is-current" : i < step ? "is-done" : ""} aria-current={i === step ? "step" : undefined}>
          <span className="bs-dot">{i < step ? "✓" : i + 1}</span>
          <span className="bs-step-label">{label}</span>
        </li>
      ))}
    </ol>
  );
}

function Field({ id, label, hint, error, children }) {
  return (
    <div className={`bs-field ${error ? "has-error" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error && <small>{hint}</small>}
      {error && <small className="bs-error" role="alert">{error}</small>}
    </div>
  );
}

function Check({ id, checked, onChange, error, children }) {
  return (
    <div className={`bs-check ${error ? "has-error" : ""}`}>
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <label htmlFor={id}>{children}</label>
      {error && <small className="bs-error" role="alert">{error}</small>}
    </div>
  );
}

export default function BecomeSeller() {
  const { user } = useAuth();
  const notify = useNotify();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(readDraft);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");
  const [result, setResult] = useState(null); // set when the store was created

  // Keep the draft (without the confirmation ticks) so a refresh doesn't lose their work.
  useEffect(() => {
    if (result) return;
    try {
      const { agreeTerms, agreeAccuracy, confirm, ...rest } = form;
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(rest));
    } catch {
      /* storage unavailable: fine */
    }
  }, [form, result]);

  useEffect(() => {
    window.scrollTo?.({ top: 0 });
  }, [step]);

  // Existing sellers already have a store. Admins can't sell. (Not while showing the success screen.)
  if (!result && user?.role === "seller") return <Navigate to="/dashboard/store" replace />;
  if (user?.role === "admin") return <Navigate to="/dashboard" replace />;

  const set = (key) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  function next() {
    const e = validate(step, form);
    setErrors(e);
    if (Object.keys(e).length === 0) setStep((s) => s + 1);
  }

  async function submit() {
    const e = validate(3, form);
    setErrors(e);
    if (Object.keys(e).length) return;

    setBusy(true);
    setServerError("");
    try {
      const data = await applyAsSeller({
        name: form.name.trim(),
        description: form.description.trim(),
        address: form.address.trim(),
        acceptedTerms: true,
      });
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      setResult(data);
      notify.success("Your store is open.");
    } catch (err) {
      const msg = err?.response?.data?.message || "We couldn't open your store. Please try again.";
      setServerError(msg);
      notify.error(msg);
    } finally {
      setBusy(false);
    }
  }

  /* ---------- Success ---------- */
  if (result) {
    const storeName = result.store?.name || form.name;
    return (
      <main className="bs-page">
        <div className="bs-wrap bs-done">
          <span className="bs-tick" aria-hidden="true">✓</span>
          <span className="bs-eyebrow">WELCOME, SELLER</span>
          <h1>{storeName} is open.</h1>
          <p className="bs-lead">
            Your account is now a seller account. You'll find your store tools in your dashboard, and you
            can still shop with the same login.
          </p>

          <ol className="bs-next">
            <li><strong>Finish your store</strong><span>Add a logo and a description so buyers recognise and trust you.</span></li>
            <li><strong>Add your first product</strong><span>Upload photos, set a price and stock. We review it before it goes live.</span></li>
            <li><strong>Watch for orders</strong><span>New orders appear under Incoming orders, and we'll notify you.</span></li>
          </ol>

          {/* Full page load so the app picks up the new role and token. */}
          <div className="bs-actions">
            <button type="button" className="bs-btn" onClick={() => window.location.assign("/dashboard/store")}>
              Finish my store
            </button>
            <button type="button" className="bs-btn bs-btn-ghost" onClick={() => window.location.assign("/dashboard/inventory")}>
              Add my first product
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* ---------- Wizard ---------- */
  return (
    <main className="bs-page">
      <div className="bs-wrap">
        <span className="bs-eyebrow">SELL ON LUMORA</span>
        <Stepper step={step} />

        {step === 0 && (
          <section>
            <h1>Open your store on Lumora</h1>
            <p className="bs-lead">
              This takes about two minutes. Nothing changes on your account until you confirm on the last step.
            </p>

            <h2 className="bs-h2">What you'll need</h2>
            <ul className="bs-list">
              <li>A store name</li>
              <li>The town or area you operate from</li>
              <li>A few minutes to read the seller commitments</li>
            </ul>

            <h2 className="bs-h2">How it works</h2>
            <ul className="bs-list">
              <li>You keep your buyer account: shop, save favourites and track your own orders.</li>
              <li>You finish your store (logo and description) from your dashboard whenever you like.</li>
              <li>Every product you list is reviewed before it goes live.</li>
              <li>You confirm, pack and ship orders from your dashboard.</li>
            </ul>

            <div className="bs-actions">
              <button type="button" className="bs-btn" onClick={next}>Start my application</button>
              <Link to="/" className="bs-link">Not now</Link>
            </div>
          </section>
        )}

        {step === 1 && (
          <section>
            <h1>Tell us about your store</h1>
            <p className="bs-lead">Buyers will see this on your public store page. You can change it later.</p>

            <Field id="bs-name" label="Store name" error={errors.name} hint="Example: Adwoa's Kente House">
              <input id="bs-name" value={form.name} onChange={set("name")} maxLength={60} autoComplete="organization" />
            </Field>

            <Field id="bs-addr" label="Where are you based?" error={errors.address} hint="Town or area, for example: Osu, Accra">
              <input id="bs-addr" value={form.address} onChange={set("address")} autoComplete="street-address" />
            </Field>

            <Field
              id="bs-desc"
              label="Describe your store (optional)"
              error={errors.description}
              hint={`${form.description.trim().length}/500 characters. You can add this later from My store.`}
            >
              <textarea id="bs-desc" rows={4} value={form.description} onChange={set("description")} maxLength={500} />
            </Field>

            <div className="bs-actions">
              <button type="button" className="bs-btn" onClick={next}>Continue</button>
              <button type="button" className="bs-link" onClick={() => setStep(0)}>Back</button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <h1>Seller commitments</h1>
            <p className="bs-lead">Lumora only works when buyers can trust sellers. As a seller, you agree to:</p>

            <ul className="bs-commit">
              {COMMITMENTS.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>

            <Check id="bs-terms" checked={form.agreeTerms} onChange={set("agreeTerms")} error={errors.agreeTerms}>
              I have read and agree to these seller commitments.
            </Check>
            <Check id="bs-acc" checked={form.agreeAccuracy} onChange={set("agreeAccuracy")} error={errors.agreeAccuracy}>
              The information I gave about my store is accurate.
            </Check>

            <div className="bs-actions">
              <button type="button" className="bs-btn" onClick={next}>Continue</button>
              <button type="button" className="bs-link" onClick={() => setStep(1)}>Back</button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section>
            <h1>Review and confirm</h1>
            <p className="bs-lead">Check your details. Opening a store upgrades your account to a seller account.</p>

            <dl className="bs-review">
              <div><dt>Store name</dt><dd>{form.name}</dd><button type="button" onClick={() => setStep(1)}>Edit</button></div>
              <div><dt>Based in</dt><dd>{form.address}</dd><button type="button" onClick={() => setStep(1)}>Edit</button></div>
              <div><dt>Description</dt><dd>{form.description.trim() || "Not added yet"}</dd><button type="button" onClick={() => setStep(1)}>Edit</button></div>
              <div><dt>Seller commitments</dt><dd>Accepted</dd><button type="button" onClick={() => setStep(2)}>View</button></div>
            </dl>

            <Check id="bs-confirm" checked={form.confirm} onChange={set("confirm")} error={errors.confirm}>
              I understand that this will upgrade my account to a seller account and open my store.
            </Check>

            {serverError && <p className="bs-server-error" role="alert">{serverError}</p>}

            <div className="bs-actions">
              <button type="button" className="bs-btn" onClick={submit} disabled={busy}>
                {busy ? "Opening your store…" : "Open my store"}
              </button>
              <button type="button" className="bs-link" onClick={() => setStep(2)} disabled={busy}>Back</button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}