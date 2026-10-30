import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNotify } from "../../hooks/useNotify";
import { getMyReview, createReview, updateMyReview, deleteMyReview } from "../../services/reviewService";
import StarRating from "./StarRating";
import "../../css/tokens.css";
import "../../css/shop.css";
import "../../css/reviewForm.css";

const MAX_COMMENT = 1000;
const WORDS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

export default function ReviewForm({ productId, onChanged }) {
  const { user } = useAuth();
  const notify = useNotify();
  const userId = user?._id || user?.id || null;

  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [mine, setMine] = useState({ review: null, canReview: false });
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setMine(await getMyReview(productId));
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [productId, userId]);

  useEffect(() => {
    setStatus("loading");
    setEditing(false);
    setConfirming(false);
    load();
  }, [load]);

  if (!userId) return null; // guests: the list of reviews is enough
  if (status === "loading") return null;

  if (status === "error") {
    return (
      <div className="lm-rf">
        <p className="lm-sub" style={{ margin: 0 }}>
          We couldn't check whether you can review this product.{" "}
          <button type="button" className="lm-linkbtn" onClick={() => { setStatus("loading"); load(); }}>Try again</button>
        </p>
      </div>
    );
  }

  const startEdit = () => {
    setRating(mine.review.rating);
    setComment(mine.review.comment || "");
    setError("");
    setEditing(true);
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setError("");
    if (rating < 1) return setError("Choose a rating from 1 to 5 stars.");
    if (comment.length > MAX_COMMENT) return setError(`Your comment can be at most ${MAX_COMMENT} characters.`);

    setSaving(true);
    try {
      const body = { rating, comment: comment.trim() };
      const review = mine.review
        ? await updateMyReview(productId, body)
        : await createReview(productId, body);
      setMine({ review, canReview: false });
      setEditing(false);
      setRating(0);
      setComment("");
      notify.success(mine.review ? "Your review was updated." : "Thanks for your review!");
      onChanged?.();
    } catch (e) {
      const message = e?.response?.data?.message || "We couldn't save your review. Please try again.";
      setError(message);
      if (e?.response?.status === 409) load(); // already reviewed: show it
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await deleteMyReview(productId);
      setConfirming(false);
      notify.success("Your review was deleted.");
      await load();
      onChanged?.();
    } catch (e) {
      notify.error(e?.response?.data?.message || "We couldn't delete your review.");
    } finally {
      setSaving(false);
    }
  };

  // Your existing review
  if (mine.review && !editing) {
    return (
      <div className="lm-rf">
        <div className="lm-rf__head"><strong>Your review</strong></div>
        <StarRating value={mine.review.rating} count={1} showCount={false} />
        {mine.review.comment && <p style={{ margin: "8px 0 0" }}>{mine.review.comment}</p>}
        <div className="lm-rf__actions">
          {confirming ? (
            <>
              <span className="lm-sub">Delete your review?</span>
              <button type="button" className="lm-btn lm-btn--sm" onClick={remove} disabled={saving}>
                {saving ? "Deleting…" : "Yes, delete"}
              </button>
              <button type="button" className="lm-btn lm-btn--ghost lm-btn--sm" onClick={() => setConfirming(false)} disabled={saving}>
                Keep it
              </button>
            </>
          ) : (
            <>
              <button type="button" className="lm-btn lm-btn--ghost lm-btn--sm" onClick={startEdit}>Edit</button>
              <button type="button" className="lm-btn lm-btn--ghost lm-btn--sm" onClick={() => setConfirming(true)}>Delete</button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Not allowed to review yet
  if (!mine.review && !mine.canReview) return null;

  // Write or edit
  return (
    <form className="lm-rf" onSubmit={submit} noValidate>
      <div className="lm-rf__head">
        <strong>{mine.review ? "Edit your review" : "Review this product"}</strong>
        <span className="lm-sub">Your order was delivered. Tell other buyers what you think.</span>
      </div>

      <div className="lm-rf__stars" role="radiogroup" aria-label="Your rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            className={n <= rating ? "is-on" : ""}
            onClick={() => setRating(n)}
          >
            ★
          </button>
        ))}
        <span className="lm-rf__word">{WORDS[rating]}</span>
      </div>

      <div className="lm-field">
        <label htmlFor="review-comment">Comment (optional)</label>
        <textarea
          id="review-comment"
          className="lm-input"
          rows={4}
          value={comment}
          maxLength={MAX_COMMENT}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Quality, fit, delivery… anything that helps other buyers"
        />
        <div className="lm-hint"><span>Shown with your first name and last initial</span><span>{comment.length}/{MAX_COMMENT}</span></div>
      </div>

      {error && <div className="lm-alert lm-alert--danger" role="alert" style={{ marginTop: 10 }}>{error}</div>}

      <div className="lm-rf__actions">
        <button type="submit" className="lm-btn" disabled={saving}>
          {saving ? "Saving…" : mine.review ? "Save changes" : "Post review"}
        </button>
        {mine.review && (
          <button type="button" className="lm-btn lm-btn--ghost" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
        )}
      </div>
    </form>
  );
}