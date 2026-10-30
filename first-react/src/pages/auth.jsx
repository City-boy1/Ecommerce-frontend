
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

export default function Auth() {
  const { mode } = useParams();
  const isSignup = mode === "signup";
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/'

  const { signup, login, setError,setAuthLoading } = useAuth();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
  if (isSubmitting) return;

  setError(null);
  setIsSubmitting(true);

  try {
    if (isSignup) {
      await signup(
        data.name.trim(),
        data.email.trim().toLowerCase(),
        data.password
      );
      navigate(from,{replace:true})

      toast.success("Your account has been created successfully!");
    } else {
      await login(
        data.email.trim().toLowerCase(),
        data.password
      );
       navigate(from,{replace:true})

      toast.success("Welcome back! You are logged in.");
    }
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
                {isSignup ? "JOIN OUR COMMUNITY" : "WELCOME BACK"}
              </p>

              <h1 className="page-title">
                {isSignup
                  ? "Create your account"
                  : "Sign in to your account"}
              </h1>

              <p className="auth-subtitle">
                {isSignup
                  ? "Discover great products and bring your creative ideas to life."
                  : "Your next great find is just a few clicks away."}
              </p>
            </div>

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
                            message: "Password must be at least 6 characters.",
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

                  {/* Connect this link when your forgot-password page is ready. */}
                  <Link to="/auth/forgot-password" className="auth-inline-link">
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
                    {isSignup ? "Creating account..." : "Signing in..."}
                  </>
                ) : (
                  <>
                    {isSignup ? "Create account" : "Sign in"}
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