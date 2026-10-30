import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { axiosPrivate } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useMyStore } from "../../context/myStoreContext";
import { useNotify } from "../../hooks/useNotify";
import { getImageUrl } from "../../utils/productHelpers";
import "../../css/profile.css";

// Safely read a value from common user-property names.
function readValue(object, ...keys) {
  for (const key of keys) {
    const value = object?.[key];

    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return "";
}

// Convert an address object or string into form fields.
function getAddress(user) {
  const address =
    user?.address && typeof user.address === "object"
      ? user.address
      : user?.shippingAddress &&
          typeof user.shippingAddress === "object"
        ? user.shippingAddress
        : {};

  return {
    addressLine: readValue(address, "addressLine", "street", "line1"),
    apartment: readValue(address, "apartment", "line2"),
    city: readValue(address, "city", "town"),
    region: readValue(address, "region", "state", "province"),
  };
}

// Personal fields only. Store details live on the My store page.
function buildForm(user) {
  const address = getAddress(user);

  return {
    name: readValue(user, "name", "fullName", "displayName"),
    phone: readValue(user, "phone", "phoneNumber", "mobile"),
    bio: readValue(user, "bio", "about"),

    addressLine: address.addressLine,
    apartment: address.apartment,
    city: address.city,
    region: address.region,

    deliveryInstructions: readValue(
      user,
      "deliveryInstructions",
      "shippingInstructions"
    ),
  };
}

function getInitials(name) {
  return String(name || "User")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

// Reusable text input.
function ProfileField({
  label,
  name,
  form,
  onChange,
  placeholder = "",
  required = false,
  type = "text",
  hint = "",
  autoComplete,
}) {
  return (
    <div className="profile-field">
      <label htmlFor={name}>
        {label}
        {required && <span className="profile-required"> *</span>}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={form[name] ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
      />

      {hint && <small>{hint}</small>}
    </div>
  );
}

// Sellers edit everything about their shop on My store, so Profile just links there.
// Rendered only for sellers, so useMyStore() is never called for other roles.
function StoreLinkCard() {
  const { store, loading, percent } = useMyStore();

  const neverSetUp = !store || !String(store.name || "").trim();

  let status = "Checking your store…";
  if (!loading) {
    status = neverSetUp
      ? "You haven't set up your store yet."
      : `${store.name} is ${percent}% complete.`;
  }

  const buttonLabel = neverSetUp
    ? "Set up my store"
    : percent === 100
      ? "Manage my store"
      : "Complete my store";

  return (
    <section className="profile-card">
      <div className="profile-card-heading">
        <div>
          <h2>Your store</h2>
          <p>
            Your store name, logo, description and address are managed on the My store page.
          </p>
        </div>
      </div>

      <p>{status}</p>

      <Link
        to="/dashboard/store"
        className="profile-button profile-button-dark"
      >
        {buttonLabel}
      </Link>
    </section>
  );
}

export default function Profile() {
  const auth = useAuth();
  const notify = useNotify();

  // Support the common AuthContext user property names.
  const user = auth?.user || auth?.currentUser || null;
  const refreshUser =
    auth?.getMe || auth?.fetchUser || auth?.refreshUser || null;

  const role = String(user?.role || "buyer").toLowerCase();
  const isSeller = role === "seller";
  const isAdmin = role === "admin";
  const isBuyer = !isSeller && !isAdmin;

  const email = readValue(user, "email");

  const [form, setForm] = useState(() => buildForm(user));

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(
    readValue(user, "avatar", "avatarUrl", "profileImage", "profilePicture")
  );
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Refresh displayed values when the authenticated user changes.
  useEffect(() => {
    setForm(buildForm(user));

    setAvatarFile(null);
    setRemoveAvatar(false);
    setAvatarPreview(
      readValue(user, "avatar", "avatarUrl", "profileImage", "profilePicture")
    );
  }, [user]);

  // Create and clean up the local avatar preview URL.
  useEffect(() => {
    if (!avatarFile) return undefined;

    const objectUrl = URL.createObjectURL(avatarFile);
    setAvatarPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [avatarFile]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setSaved(false);
  }

  function handleAvatarChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      notify.error("Please select a valid image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      notify.error("Your image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setAvatarFile(file);
    setRemoveAvatar(false);
    setSaved(false);
  }

  function handleRemoveAvatar() {
    setAvatarFile(null);
    setAvatarPreview("");
    setRemoveAvatar(true);
    setSaved(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      notify.error("Please enter your full name.");
      return;
    }

    setSaving(true);

    try {
      const data = new FormData();

      data.append("name", form.name.trim());
      data.append("phone", form.phone.trim());
      data.append("bio", form.bio.trim());

      data.append(
        "address",
        JSON.stringify({
          addressLine: form.addressLine.trim(),
          apartment: form.apartment.trim(),
          city: form.city.trim(),
          region: form.region.trim(),
        })
      );

      if (isBuyer) {
        data.append(
          "deliveryInstructions",
          form.deliveryInstructions.trim()
        );
      }

      if (avatarFile) {
        data.append("avatar", avatarFile);
      }

      if (removeAvatar) {
        data.append("removeAvatar", "true");
      }

      // The backend must update the currently authenticated account.
      const res = await axiosPrivate.patch("/users/me", data);
const updated = res.data?.user;

if (updated) {
  // Push the saved user into AuthContext so the navbar updates
  if (typeof auth?.setUser === "function") {
    auth.setUser({ ...user, ...updated });
  } else if (typeof refreshUser === "function") {
    await refreshUser.call(auth);
  }
  setAvatarPreview(updated.avatar || "");
}

      setAvatarFile(null);
      setRemoveAvatar(false);
      setSaved(true);

      notify.success("Your profile has been updated.");
    } catch (error) {
      notify.error(
        error?.response?.data?.message ||
          "Unable to save your profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  const displayName =
    form.name || email.split("@")[0] || "Your profile";

  const roleLabel = isAdmin
    ? "Administrator"
    : isSeller
      ? "Seller account"
      : "Buyer account";

  return (
    <main className="seller-profile">
      <header className="profile-page-header">
        <div>
          <span className="profile-eyebrow">ACCOUNT</span>
          <h1>My profile</h1>
          <p>
            Manage your personal information and how you appear
            on the marketplace.
          </p>
        </div>

        <span className="profile-role">{roleLabel}</span>
      </header>

      <form className="profile-form" onSubmit={handleSubmit}>
        {/* PROFILE PHOTO */}
        <section className="profile-card profile-identity-card">
          <div className="profile-card-heading">
            <div>
              <h2>Profile photo</h2>
              <p>Choose a photo people can recognize.</p>
            </div>
          </div>

          <div className="profile-avatar-row">
            <div className="profile-avatar">
              {avatarPreview ? (
                <img src={avatarPreview.startsWith("blob:") ? avatarPreview : getImageUrl(avatarPreview)} alt="Profile preview" />
              ) : (
                <span>{getInitials(displayName)}</span>
              )}
            </div>

            <div className="profile-avatar-actions">
              <label className="profile-button profile-button-dark profile-upload-button">
                Upload photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </label>

              {avatarPreview && (
                <button
                  type="button"
                  className="profile-button profile-button-light"
                  onClick={handleRemoveAvatar}
                >
                  Remove photo
                </button>
              )}

              <p>Choose an image from your device. Maximum size: 5 MB.</p>
            </div>
          </div>
        </section>

        {/* PERSONAL INFORMATION */}
        <section className="profile-card">
          <div className="profile-card-heading">
            <div>
              <h2>Personal information</h2>
              <p>Keep your account details up to date.</p>
            </div>
          </div>

          <div className="profile-grid">
            <ProfileField
              form={form}
              onChange={handleChange}
              label="Full name"
              name="name"
              placeholder="Enter your full name"
              required
              autoComplete="name"
            />

            <div className="profile-field">
              <label htmlFor="profile-email">Email address</label>
              <input
                id="profile-email"
                type="email"
                value={email}
                readOnly
                placeholder="No email available"
              />
              <small>Your sign-in email is managed separately.</small>
            </div>

            <ProfileField
              form={form}
              onChange={handleChange}
              label="Phone number"
              name="phone"
              type="tel"
              placeholder="Enter your phone number"
              autoComplete="tel"
            />

            <div className="profile-field profile-field-full">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={form.bio}
                onChange={handleChange}
                placeholder="Write a short introduction about yourself..."
                rows={4}
                maxLength={500}
              />
              <small>{form.bio.length}/500 characters</small>
            </div>
          </div>
        </section>

        {/* ADDRESS */}
        <section className="profile-card">
          <div className="profile-card-heading">
            <div>
              <h2>Address details</h2>
              <p>
                {isBuyer
                  ? "Save your delivery address and location."
                  : "Add your location and contact address."}
              </p>
            </div>
          </div>

          <div className="profile-grid">
            <div className="profile-field profile-field-full">
              <label htmlFor="addressLine">Street address</label>
              <input
                id="addressLine"
                name="addressLine"
                value={form.addressLine}
                onChange={handleChange}
                placeholder="House number and street"
                autoComplete="address-line1"
              />
            </div>

            <ProfileField
              form={form}
              onChange={handleChange}
              label="Apartment, suite or unit"
              name="apartment"
              placeholder="Optional"
              autoComplete="address-line2"
            />

            <ProfileField
              form={form}
              onChange={handleChange}
              label="City / town"
              name="city"
              placeholder="Enter city or town"
              autoComplete="address-level2"
            />

            <ProfileField
              form={form}
              onChange={handleChange}
              label="Region / state"
              name="region"
              placeholder="Enter region or state"
              autoComplete="address-level1"
            />

            {isBuyer && (
              <div className="profile-field profile-field-full">
                <label htmlFor="deliveryInstructions">
                  Delivery instructions
                </label>
                <textarea
                  id="deliveryInstructions"
                  name="deliveryInstructions"
                  value={form.deliveryInstructions}
                  onChange={handleChange}
                  placeholder="Optional directions to help with delivery"
                  rows={3}
                />
              </div>
            )}
          </div>
        </section>

        {/* SELLER: link to the My store page (store details are edited only there) */}
        {isSeller && <StoreLinkCard />}

        {/* ADMIN INFORMATION */}
        {isAdmin && (
          <section className="profile-card profile-admin-note">
            <div className="profile-admin-note-icon">i</div>
            <div>
              <h3>Administrator account</h3>
              <p>
                You can update your personal details here. Your
                administrator role and permissions cannot be changed
                from this page.
              </p>
            </div>
          </section>
        )}

        {/* SAVE */}
        <footer className="profile-form-footer">
          <p>
            {saved
              ? "Your changes have been saved."
              : "Fields marked with * are required."}
          </p>

          <button
            type="submit"
            className="profile-button profile-button-dark profile-save-button"
            disabled={saving}
          >
            {saving ? "Saving changes..." : "Save changes"}
          </button>
        </footer>
      </form>
    </main>
  );
}