import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { startSignup, verifySignup, resendSignupCode } from "../services/signupService";

export default function Auth() {
  const { mode } = useParams();
  const isSignup = mode === "signup";
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const { login, setError } = useAuth();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Signup has two steps: the form, then the code from the email.
  const [step, setStep] = useState("form"); // "form" | "code"
  const [pendingSignup, setPendingSignup] = useState(null); // { email, password }: kept in memory only
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // Switching between login and signup always goes back to the form
  useEffect(() => {
    setStep("form");
    setPendingSignup(null);
    setCode("");
    setCodeError("");
  }, [mode]);

  // Countdown for "Resend code"
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const onSubmit = async (data) => {
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      if (isSignup) {
        const email = data.email.trim().toLowerCase();
        const res = await startSignup(data.name.trim(), email, data.password);
        setPendingSignup({ email, password: data.password });
        setCode("");
        setCodeError("");
        setCooldown(60);
        setStep("code");
        if (res.emailSent === false) {
          toast.error("We couldn't send the code right now. Wait a minute, then tap Resend code.");
        }
        return;
      }

      await login(data.email.trim().toLowerCase(), data.password);
      navigate(from, { replace: true });
      toast.success("Welcome back! You are logged in.");
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Something went wrong. Please try again.";
      console.error(err, err.response?.status, err.response?.data);
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitCode = async (event) => {
    event.preventDefault();
    if (isSubmitting || !pendingSignup) return;

    const clean = code.replace(/\s/g, "");
    if (!/^\d{6}$/.test(clean)) return setCodeError("Enter the 6-digit code from your email.");

    setCodeError("");
    setIsSubmitting(true);

    try {
      await verifySignup(pendingSignup.email, clean); // creates the account
    } catch (err) {
      setCodeError(err.response?.data?.message || "Something went wrong. Please try again.");
      setIsSubmitting(false);
      return;
    }

    try {
      await login(pendingSignup.email, pendingSignup.password);
      setPendingSignup(null);
      toast.success("Your email is verified and your account is ready!");
      navigate(from, { replace: true });
    } catch (err) {
      // The account exists now; only the automatic login failed
      toast.success("Your email is verified. Please log in to continue.");
      navigate("/auth/login", { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendCode = async () => {
    if (cooldown > 0 || !pendingSignup) return;
    try {
      await resendSignupCode(pendingSignup.email);
      setCooldown(60);
      setCodeError("");
      toast.success("A new code is on its way. Check your inbox and spam folder.");
    } catch (err) {
      toast.error(err.response?.data?.message || "We couldn't send a new code. Please try again.");
    }
  };

  const inCodeStep = isSignup && step === "code" && pendingSignup;

  return (
    <div className="page auth-page">

      <div className="container auth-container">
        <div className="auth-layout">
          <section className="auth-contain">
            <Link to="/" className="auth-brand">
              <span className="auth-brand-mark">L</span>
              <span>Lumora</span>
            </Link>

            <div className="auth-heading">
              <p className="auth-eyebrow">
                {inCodeStep ? "ALMOST THERE" : isSignup ? "JOIN OUR COMMUNITY" : "WELCOME BACK"}
              </p>

              <h1 className="page-title">
                {inCodeStep
                  ? "Check your email"
                  : isSignup
                  ? "Create your account"
                  : "Sign in to your account"}
              </h1>

              <p className="auth-subtitle">
                {inCodeStep
                  ? `We sent a 6-digit code to ${pendingSignup.email}. It expires in 15 minutes.`
                  : isSignup
                  ? "Discover great products and bring your creative ideas to life."
                  : "Your next great find is just a few clicks away."}
              </p>
            </div>

            {inCodeStep ? (
              <form className="auth-form" onSubmit={submitCode} noValidate>
                <div className="form-group">
                  <label className="form-label" htmlFor="code">
                    Verification code
                  </label>

                  <input
                    className={`form-input ${codeError ? "input-invalid" : ""}`}
                    id="code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={7}
                    autoFocus
                    placeholder="123456"
                    style={{ letterSpacing: "0.4em", fontSize: 22, textAlign: "center" }}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^\d\s]/g, ""))}
                    aria-invalid={!!codeError}
                    aria-describedby={codeError ? "code-error" : undefined}
                  />

                  {codeError && (
                    <span className="form-error" id="code-error">
                      {codeError}
                    </span>
                  )}
                </div>

                <button type="submit" className="btn btn-primary auth-submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="btn-spinner" aria-hidden="true" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify and continue
                      <span aria-hidden="true">→</span>
                    </>
                  )}
                </button>

                <div className="auth-form-options">
                  <button
                    type="button"
                    className="auth-inline-link"
                    onClick={resendCode}
                    disabled={cooldown > 0}
                    style={{ background: "none", border: 0, padding: 0, cursor: cooldown > 0 ? "default" : "pointer" }}
                  >
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                  </button>

                  <button
                    type="button"
                    className="auth-inline-link"
                    onClick={() => {
                      setStep("form");
                      setCodeError("");
                    }}
                    style={{ background: "none", border: 0, padding: 0, cursor: "pointer" }}
                  >
                    Wrong email? Go back
                  </button>
                </div>

                <p className="auth-terms">Nothing arrived? Check your spam folder.</p>
              </form>
            ) : (
              <>
                <form
                  className="auth-form"
                  onSubmit={handleSubmit(onSubmit)}
                  noValidate
                >
                  {isSignup && (
                    <div className="form-group">
                      <label className="form-label" htmlFor="name">
                        Full name
                      </label>

                      <input
                        className={`form-input ${errors.name ? "input-invalid" : ""}`}
                        type="text"
                        id="name"
                        autoComplete="name"
                        placeholder="e.g. Alex Chezel"
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? "name-error" : undefined}
                        {...register("name", {
                          required: "Please enter your name.",
                          minLength: {
                            value: 4,
                            message: "Name must be at least 4 characters.",
                          },
                          maxLength: {
                            value: 50,
                            message: "Name cannot exceed 50 characters.",
                          },
                        })}
                      />

                      {errors.name && (
                        <span className="form-error" id="name-error">
                          {errors.name.message}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label" htmlFor="email">
                      Email address
                    </label>

                    <input
                      className={`form-input ${errors.email ? "input-invalid" : ""}`}
                      type="email"
                      id="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? "email-error" : undefined}
                      {...register("email", {
                        required: "Please enter your email address.",
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: "Please enter a valid email address.",
                        },
                      })}
                    />

                    {errors.email && (
                      <span className="form-error" id="email-error">
                        {errors.email.message}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="password">
                      Password
                    </label>

                    <div className="password-wrapper">
                      <input
                        className={`form-input ${errors.password ? "input-invalid" : ""}`}
                        type={showPassword ? "text" : "password"}
                        id="password"
                        autoComplete={
                          isSignup ? "new-password" : "current-password"
                        }
                        placeholder={
                          isSignup ? "Create a password" : "Enter your password"
                        }
                        aria-invalid={!!errors.password}
                        aria-describedby={
                          errors.password ? "password-error" : undefined
                        }
                        {...register("password", {
                          required: "Please enter your password.",
                          minLength: isSignup
                            ? {
                                value: 8,
                                message: "Password must be at least 8 characters.",
                              }
                            : undefined,
                        })}
                      />

                      <button
                        className="password-toggle"
                        type="button"
                        onClick={() => setShowPassword((previous) => !previous)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>

                    {errors.password && (
                      <span className="form-error" id="password-error">
                        {errors.password.message}
                      </span>
                    )}
                  </div>

                  {!isSignup && (
                    <div className="auth-form-options">
                      <span className="auth-secure-note">
                        <span aria-hidden="true">🔒</span> Your account is secure
                      </span>

                      <Link to="/forgot-password" className="auth-inline-link">
                        Forgot password?
                      </Link>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary auth-submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="btn-spinner" aria-hidden="true" />
                        {isSignup ? "Sending your code..." : "Signing in..."}
                      </>
                    ) : (
                      <>
                        {isSignup ? "Continue" : "Sign in"}
                        <span aria-hidden="true">→</span>
                      </>
                    )}
                  </button>

                  <p className="auth-terms">
                    {isSignup
                      ? "By creating an account, you agree to our "
                      : "By continuing, you agree to our "}
                    <Link to="/terms">Terms</Link> and{" "}
                    <Link to="/privacy">Privacy Policy</Link>.
                  </p>
                </form>

                <div className="auth-switch">
                  {isSignup ? (
                    <p>
                      Already have an account?{" "}
                      <Link to="/auth/login">Sign in</Link>
                    </p>
                  ) : (
                    <p>
                      New here?{" "}
                      <Link to="/auth/signup">Create an account</Link>
                    </p>
                  )}
                </div>
              </>
            )}
          </section>

          <aside className="auth-image">
            <img
              src="/images/auth-shopping.jpg"
              alt="A curated collection of products in a stylish shopping space"
            />

            <div className="auth-image-overlay">
              <span className="auth-image-tag">MADE FOR YOUR NEXT FIND</span>

              <h2>Good finds.<br />Great possibilities.</h2>

              <p>
                Explore products you'll love, discover new creators, and find
                something that feels just right.
              </p>

              <div className="auth-image-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}