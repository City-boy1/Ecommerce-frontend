import { useEffect, useState } from "react";
import { axiosPrivate } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getMyDeletionRequest, requestDeletion, cancelDeletionRequest } from "../../services/deletionService";
import "../../css/settings.css";

const DEFAULT_SETTINGS = {
  orderUpdates: true,
  orderNotifications: true,
  storeNotifications: true,
  showStore: true,
};

const SECTIONS = [
  { id: "notifications", label: "Notifications", description: "Order and store alerts", roles: ["buyer", "seller"] },
  { id: "store", label: "Store", description: "Shop visibility", roles: ["seller"] },
  { id: "security", label: "Security", description: "Password", roles: ["buyer", "seller", "admin"] },
  { id: "account", label: "Account", description: "Details and closing your account", roles: ["buyer", "seller", "admin"] },
];

function Toggle({ label, description, checked, onChange }) {
  return (
    <label className="settings-toggle-row">
      <span className="settings-toggle-copy">
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
      <input
        className="settings-toggle-input"
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="settings-toggle-track" aria-hidden="true">
        <span />
      </span>
    </label>
  );
}

function SettingsField({ label, hint, children }) {
  return (
    <div className="settings-field">
      <label>{label}</label>
      {children}
      {hint && <small>{hint}</small>}
    </div>
  );
}

function SaveBar({ hasChanges, saving, label }) {
  return (
    <div className="settings-save-bar">
      <span>{hasChanges ? "You have unsaved changes." : "Everything is up to date."}</span>
      <button
        className="settings-button settings-button-dark"
        type="submit"
        disabled={saving || !hasChanges}
      >
        {saving ? "Saving..." : label}
      </button>
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const toast = useToast();

  const role = String(user?.role || "buyer").toLowerCase();
  const isSeller = role === "seller";
  const isAdmin = role === "admin";
  const roleLabel = isAdmin ? "Administrator" : isSeller ? "Seller" : "Buyer";

  const [activeSection, setActiveSection] = useState("notifications");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const [deletionReason, setDeletionReason] = useState("");
  const [confirmDeletion, setConfirmDeletion] = useState(false);
  const [requestingDeletion, setRequestingDeletion] = useState(false);
  const [deletion, setDeletion] = useState(null); // my pending request, if any

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const response = await axiosPrivate.get("/users/me/settings");
        if (active) {
          setSettings({ ...DEFAULT_SETTINGS, ...(response.data?.settings || {}) });
        }
      } catch (error) {
        if (active) {
          toast.error(
            error?.response?.data?.message || "Couldn't load your saved settings."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load my pending deletion request (admins can't request one)
  useEffect(() => {
    if (isAdmin) return;
    let active = true;
    getMyDeletionRequest()
      .then((d) => active && setDeletion(d.request))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isAdmin]);

  const visibleSections = SECTIONS.filter((s) => s.roles.includes(role));
  const currentId = visibleSections.some((s) => s.id === activeSection)
    ? activeSection
    : visibleSections[0]?.id;
  const activeLabel = visibleSections.find((s) => s.id === currentId)?.label || "Settings";

  function updateSetting(name, value) {
    setSettings((current) => ({ ...current, [name]: value }));
    setHasChanges(true);
  }

  async function saveSettings(event) {
    event?.preventDefault();
    setSaving(true);

    try {
      const body = {
        orderUpdates: settings.orderUpdates,
        orderNotifications: settings.orderNotifications,
        storeNotifications: settings.storeNotifications,
      };
      if (isSeller) body.showStore = settings.showStore;

      const response = await axiosPrivate.patch("/users/me/settings", body);
      setSettings({ ...DEFAULT_SETTINGS, ...(response.data?.settings || settings) });
      setHasChanges(false);
      toast.success("Your settings have been saved.");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Couldn't save your settings. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();

    if (passwordForm.newPassword.length < 8) {
      toast.error("Your new password must be at least 8 characters.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Your new passwords do not match.");
      return;
    }

    setChangingPassword(true);
    try {
      await axiosPrivate.patch("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Your password has been changed.");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Couldn't change your password. Please try again."
      );
    } finally {
      setChangingPassword(false);
    }
  }

  async function requestAccountDeletion(event) {
    event.preventDefault();

    if (!confirmDeletion) {
      toast.error("Please confirm that you understand this request.");
      return;
    }

    setRequestingDeletion(true);
    try {
      const res = await requestDeletion(deletionReason.trim());
      setDeletion(res.request);
      setConfirmDeletion(false);
      setDeletionReason("");
      toast.success("Your request was sent. An admin will review it.");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Couldn't submit your request. Please try again."
      );
    } finally {
      setRequestingDeletion(false);
    }
  }

  async function cancelDeletion() {
    setRequestingDeletion(true);
    try {
      await cancelDeletionRequest();
      setDeletion(null);
      toast.success("Your request was cancelled.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Couldn't cancel your request. Please try again.");
    } finally {
      setRequestingDeletion(false);
    }
  }

  return (
    <main className="seller-settings">
      <header className="settings-page-header">
        <div>
          <span className="settings-eyebrow">ACCOUNT</span>
          <h1>Settings</h1>
          <p>Manage your notifications and keep your account secure.</p>
        </div>
        <span className="settings-account-badge">{roleLabel} account</span>
      </header>

      <div className="settings-layout">
        <aside className="settings-sidebar" aria-label="Settings sections">
          <p className="settings-sidebar-title">SETTINGS MENU</p>

          {visibleSections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`settings-nav-item ${currentId === section.id ? "is-active" : ""}`}
              onClick={() => setActiveSection(section.id)}
            >
              <span className="settings-nav-copy">
                <strong>{section.label}</strong>
                <small>{section.description}</small>
              </span>
              <span className="settings-nav-arrow" aria-hidden="true">›</span>
            </button>
          ))}
        </aside>

        <section className="settings-content">
          <div className="settings-content-header">
            <div>
              <h2>{activeLabel}</h2>
            </div>
          </div>

          {loading ? (
            <div className="settings-loading">
              <span className="settings-spinner" />
              <p>Loading your settings...</p>
            </div>
          ) : (
            <>
              {currentId === "notifications" && (
                <form onSubmit={saveSettings}>
                  <div className="settings-panel">
                    <div className="settings-panel-heading">
                      <h3>{isSeller ? "Store notifications" : "Order notifications"}</h3>
                      <p>Choose which alerts appear in your notification bell.</p>
                    </div>

                    {!isSeller && (
                      <Toggle
                        label="Order updates"
                        description="When your order is confirmed, shipped, or delivered."
                        checked={settings.orderUpdates}
                        onChange={(v) => updateSetting("orderUpdates", v)}
                      />
                    )}

                    {isSeller && (
                      <>
                        <Toggle
                          label="New orders"
                          description="When a customer orders one of your products."
                          checked={settings.orderNotifications}
                          onChange={(v) => updateSetting("orderNotifications", v)}
                        />
                        <Toggle
                          label="Product review updates"
                          description="When an admin approves one of your products, and when stock runs low."
                          checked={settings.storeNotifications}
                          onChange={(v) => updateSetting("storeNotifications", v)}
                        />
                      </>
                    )}

                    <p className="settings-muted">
                      Security alerts, such as password changes, and product rejections are always on.
                    </p>
                  </div>

                  <SaveBar hasChanges={hasChanges} saving={saving} label="Save notifications" />
                </form>
              )}

              {currentId === "store" && isSeller && (
                <form onSubmit={saveSettings}>
                  <div className="settings-panel">
                    <div className="settings-panel-heading">
                      <h3>Shop visibility</h3>
                      <p>Control whether shoppers can see your products.</p>
                    </div>

                    <Toggle
                      label="Show my store"
                      description="When off, your approved products are hidden from the shop until you turn it back on. You can still manage them in Inventory."
                      checked={settings.showStore}
                      onChange={(v) => updateSetting("showStore", v)}
                    />
                  </div>

                  <SaveBar hasChanges={hasChanges} saving={saving} label="Save store settings" />
                </form>
              )}

              {currentId === "security" && (
                <div className="settings-panel">
                  <div className="settings-panel-heading">
                    <h3>Change password</h3>
                    <p>Use a strong password that you don't use on other websites.</p>
                  </div>

                  <form className="settings-password-form" onSubmit={changePassword}>
                    <SettingsField label="Current password">
                      <input
                        type="password"
                        autoComplete="current-password"
                        required
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          setPasswordForm((c) => ({ ...c, currentPassword: e.target.value }))
                        }
                      />
                    </SettingsField>

                    <SettingsField label="New password" hint="Use at least 8 characters.">
                      <input
                        type="password"
                        autoComplete="new-password"
                        minLength={8}
                        required
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm((c) => ({ ...c, newPassword: e.target.value }))
                        }
                      />
                    </SettingsField>

                    <SettingsField label="Confirm new password">
                      <input
                        type="password"
                        autoComplete="new-password"
                        minLength={8}
                        required
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          setPasswordForm((c) => ({ ...c, confirmPassword: e.target.value }))
                        }
                      />
                    </SettingsField>

                    <button
                      type="submit"
                      className="settings-button settings-button-dark"
                      disabled={changingPassword}
                    >
                      {changingPassword ? "Updating..." : "Change password"}
                    </button>
                  </form>
                </div>
              )}

              {currentId === "account" && (
                <>
                  <div className="settings-panel">
                    <div className="settings-panel-heading">
                      <h3>Account information</h3>
                      <p>The account you're signed in with.</p>
                    </div>

                    <div className="settings-account-row">
                      <span>Email</span>
                      <strong>{user?.email || "Not available"}</strong>
                    </div>
                    <div className="settings-account-row">
                      <span>Account type</span>
                      <strong>{roleLabel}</strong>
                    </div>
                    <div className="settings-account-row">
                      <span>Region</span>
                      <strong>Ghana · prices in cedis (GH₵) · Accra time (GMT)</strong>
                    </div>

                    <p className="settings-muted">
                      To update your name, phone, address, or avatar, use the Profile page.
                    </p>
                  </div>

                  {!isAdmin && (
                    <div className="settings-panel settings-danger-panel">
                      <div className="settings-panel-heading">
                        <h3>Request account deletion</h3>
                        <p>An admin reviews every request. Your account is not deleted immediately.</p>
                      </div>

                      {deletion ? (
                        <>
                          <p>
                            Your request was sent on{" "}
                            {new Date(deletion.createdAt).toLocaleDateString("en-GH", { dateStyle: "medium" })} and is
                            waiting for review.
                          </p>
                          {(deletion.openOrders > 0 || deletion.openDisputes > 0) && (
                            <p className="settings-muted">
                              We can only close your account once your open orders ({deletion.openOrders}) and
                              problem reports ({deletion.openDisputes}) are finished.
                            </p>
                          )}
                          <button
                            type="button"
                            className="settings-button settings-button-dark"
                            onClick={cancelDeletion}
                            disabled={requestingDeletion}
                          >
                            {requestingDeletion ? "Working..." : "Cancel my request"}
                          </button>
                        </>
                      ) : (
                        <form onSubmit={requestAccountDeletion}>
                          <SettingsField
                            label="Reason (optional)"
                            hint="Don't include your password or other sensitive details."
                          >
                            <textarea
                              rows={3}
                              maxLength={300}
                              value={deletionReason}
                              onChange={(e) => setDeletionReason(e.target.value)}
                              placeholder="Tell us why you want to close your account..."
                            />
                          </SettingsField>

                          <label className="settings-confirm-row">
                            <input
                              type="checkbox"
                              checked={confirmDeletion}
                              onChange={(e) => setConfirmDeletion(e.target.checked)}
                            />
                            <span>
                              I understand that closing my account removes my personal details and signs me out
                              everywhere. I can't undo it once approved.
                            </span>
                          </label>

                          <button
                            type="submit"
                            className="settings-button settings-button-danger"
                            disabled={requestingDeletion}
                          >
                            {requestingDeletion ? "Submitting request..." : "Request account deletion"}
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}