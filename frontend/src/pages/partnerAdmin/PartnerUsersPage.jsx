// frontend/src/pages/partnerAdmin/PartnerUsersPage.jsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getOrganizations } from "../../api/organizationsApi";
import {
  createPartnerInvite,
  listPartnerUsers,
  activatePartnerUser,
  deactivatePartnerUser,
  deletePartnerUser,
} from "../../api/partnerAdminApi";

const LAST_INVITE_KEY = "last_partner_invite_link";

export default function PartnerUsersPage() {
  const [organizations, setOrganizations] = useState([]);
  const [partnerUsers, setPartnerUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  
  const [inviteLoading, setInviteLoading] = useState(false);
  const [rowActionLoadingId, setRowActionLoadingId] = useState(null);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [inviteLink, setInviteLink] = useState(() => localStorage.getItem(LAST_INVITE_KEY) || "");
  const [copied, setCopied] = useState(false);

  
  const [confirmDeleteUser, setConfirmDeleteUser] = useState(null);

  const [form, setForm] = useState({
    organization_id: "",
    email: "",
    full_name: "",
    role: "PARTNER_ADMIN",
    expires_in_hours: 24,
  });

  const copyBtnRef = useRef(null);
  const copiedTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const orgLabelById = useMemo(() => {
    const map = new Map();
    organizations.forEach((o) => map.set(String(o.id), o.name || `Organization #${o.id}`));
    return map;
  }, [organizations]);

  const loadAll = async () => {
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const [orgsRes, usersRes] = await Promise.allSettled([getOrganizations(), listPartnerUsers()]);

      setOrganizations(orgsRes.status === "fulfilled" && Array.isArray(orgsRes.value) ? orgsRes.value : []);
      setPartnerUsers(usersRes.status === "fulfilled" && Array.isArray(usersRes.value) ? usersRes.value : []);
    } catch (e) {
      console.error(e);
      setError("Failed to load Partner Users data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setCopied(false);

    if (!form.organization_id) {
      setError("Please select an organization.");
      return;
    }

    setInviteLoading(true);
    try {
      const payload = {
        organization_id: Number(form.organization_id),
        email: form.email,
        full_name: form.full_name || null,
        role: form.role,
        expires_in_hours: Number(form.expires_in_hours) || 24,
      };

      const res = await createPartnerInvite(payload);
      const link = res?.invite_link || "";

      if (!link) {
        setError("Invite created, but invite link was not returned. Check backend response (invite_link).");
      } else {
        setInviteLink(link);
        localStorage.setItem(LAST_INVITE_KEY, link);
        setSuccessMsg("Invite created successfully. Copy the invite link below.");
      }

      setForm((p) => ({
        ...p,
        email: "",
        full_name: "",
        role: "PARTNER_ADMIN",
        expires_in_hours: 24,
      }));

      await loadAll();
    } catch (e2) {
      console.error(e2);
      const msg =
        e2?.response?.data?.detail || "Failed to create invite. Ensure you're logged in as ADMIN/MANAGER.";
      setError(msg);
    } finally {
      setInviteLoading(false);
    }
  };

  const copyInvite = async () => {
    if (!inviteLink) return;
    setError("");
    setSuccessMsg("");

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setSuccessMsg("Invite link copied ✅");

      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setSuccessMsg("Copy failed. Please select and copy manually.");
      
      if (copyBtnRef.current) {
        copyBtnRef.current.animate(
          [
            { transform: "translateX(0px)" },
            { transform: "translateX(-3px)" },
            { transform: "translateX(3px)" },
            { transform: "translateX(0px)" },
          ],
          { duration: 240 }
        );
      }
    }
  };

  const handleToggleActive = async (u) => {
    setError("");
    setSuccessMsg("");
    setRowActionLoadingId(u.id);

    try {
      if (u.is_active) {
        await deactivatePartnerUser(u.id);
        setSuccessMsg("Partner user deactivated.");
      } else {
        await activatePartnerUser(u.id);
        setSuccessMsg("Partner user activated.");
      }
      await loadAll();
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.detail || "Failed to update partner user status.";
      setError(msg);
    } finally {
      setRowActionLoadingId(null);
    }
  };

  const handleDelete = async (u) => {
    setError("");
    setSuccessMsg("");
    setRowActionLoadingId(u.id);

    try {
      await deletePartnerUser(u.id);
      setSuccessMsg("Partner user deleted.");
      setConfirmDeleteUser(null);
      await loadAll();
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.detail || "Failed to delete partner user.";
      setError(msg);
    } finally {
      setRowActionLoadingId(null);
    }
  };

  const styles = {
    
    pageWrap: { maxWidth: 1100, margin: "0 auto", padding: "0 1rem" },
    headerRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: "1rem",
      flexWrap: "wrap",
      marginBottom: "0.75rem",
    },
    title: { fontSize: "1.6rem", fontWeight: 800, margin: 0 },
    subtitle: { color: "#6b7280", margin: 0, fontSize: "0.95rem" },

    alertError: {
      marginBottom: "1rem",
      padding: "0.75rem 0.85rem",
      borderRadius: "0.75rem",
      background: "#fef2f2",
      color: "#b91c1c",
      fontSize: "0.95rem",
      border: "1px solid #fecaca",
    },
    alertSuccess: {
      marginBottom: "1rem",
      padding: "0.75rem 0.85rem",
      borderRadius: "0.75rem",
      background: "#ecfdf3",
      color: "#166534",
      fontSize: "0.95rem",
      border: "1px solid #bbf7d0",
      whiteSpace: "pre-wrap",
    },

    card: {
      background: "#fff",
      borderRadius: "1rem",
      padding: "1rem",
      border: "1px solid #e5e7eb",
      boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
    },

    gridForm: { display: "grid", gap: "0.85rem", maxWidth: 640 },
    twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" },

    label: { display: "block", fontSize: "0.9rem", marginBottom: "0.25rem", color: "#111827", fontWeight: 600 },
    input: {
      width: "100%",
      padding: "0.6rem 0.75rem",
      borderRadius: "0.75rem",
      border: "1px solid #d1d5db",
      outline: "none",
    },

    actionsRow: { display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" },

    inviteBox: {
      padding: "0.85rem",
      borderRadius: "0.85rem",
      border: "1px solid #e5e7eb",
      background: "#f9fafb",
      wordBreak: "break-all",
      fontSize: "0.92rem",
      lineHeight: 1.35,
    },

    pill: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.35rem",
      padding: "0.22rem 0.55rem",
      borderRadius: 999,
      fontSize: "0.8rem",
      fontWeight: 700,
      border: "1px solid #e5e7eb",
      color: "#111827",
      background: "#fff",
    },
    pillOk: { borderColor: "#bbf7d0", background: "#ecfdf3", color: "#166534" },

    tableWrap: { overflowX: "auto" },
    table: { width: "100%", borderCollapse: "collapse" },
    th: {
      textAlign: "left",
      fontSize: "0.85rem",
      color: "#6b7280",
      padding: "0.75rem 0.6rem",
      borderBottom: "1px solid #e5e7eb",
      whiteSpace: "nowrap",
    },
    td: { padding: "0.85rem 0.6rem", borderBottom: "1px solid #f3f4f6", verticalAlign: "top" },

    btnBase: {
      padding: "0.55rem 0.9rem",
      borderRadius: "0.8rem",
      border: "1px solid transparent",
      cursor: "pointer",
      fontWeight: 700,
      fontSize: "0.92rem",
      transition: "transform 120ms ease, box-shadow 120ms ease, filter 120ms ease",
      boxShadow: "0 6px 16px rgba(15, 23, 42, 0.06)",
    },
    btnPrimary: { background: "#111827", color: "#fff" },
    btnAccent: { background: "#f97316", color: "#fff" },
    btnDanger: { background: "#b91c1c", color: "#fff" },
    btnGhost: { background: "#fff", color: "#111827", borderColor: "#e5e7eb" },
    btnDisabled: { opacity: 0.7, cursor: "not-allowed" },

    
    hoverable: {
      transform: "translateY(0px)",
    },

    
    modalOverlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.35)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      padding: "1rem",
    },
    modal: {
      width: "100%",
      maxWidth: 440,
      background: "#fff",
      borderRadius: "1rem",
      padding: "1rem",
      boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
      border: "1px solid #e5e7eb",
    },
    modalTitle: { fontSize: "1.1rem", fontWeight: 900, margin: "0 0 0.35rem" },
    modalText: { color: "#374151", margin: "0 0 0.85rem", fontSize: "0.95rem" },
  };

  const btnStyle = (variant, disabled) => {
    const base = { ...styles.btnBase };
    let v = styles.btnGhost;
    if (variant === "primary") v = styles.btnPrimary;
    if (variant === "accent") v = styles.btnAccent;
    if (variant === "danger") v = styles.btnDanger;
    if (variant === "ghost") v = styles.btnGhost;
    return { ...base, ...v, ...(disabled ? styles.btnDisabled : {}) };
  };

  
  
  const onEnter = (e) => {
    e.currentTarget.style.transform = "translateY(-1px)";
    e.currentTarget.style.boxShadow = "0 10px 22px rgba(15, 23, 42, 0.10)";
    e.currentTarget.style.filter = "brightness(1.01)";
  };
  const onLeave = (e) => {
    e.currentTarget.style.transform = "translateY(0px)";
    e.currentTarget.style.boxShadow = "0 6px 16px rgba(15, 23, 42, 0.06)";
    e.currentTarget.style.filter = "none";
  };

  
  const onInviteEnter = (e) => {
    e.currentTarget.style.transform = "translateY(-1px)";
    e.currentTarget.style.boxShadow = "0 10px 22px rgba(15, 23, 42, 0.08)";
    e.currentTarget.style.borderColor = "rgba(17, 24, 39, 0.18)";
    e.currentTarget.style.background = "#ffffff";
  };
  const onInviteLeave = (e) => {
    e.currentTarget.style.transform = "translateY(0px)";
    e.currentTarget.style.boxShadow = "none";
    e.currentTarget.style.borderColor = "#e5e7eb";
    e.currentTarget.style.background = "#f9fafb";
  };

  return (
    <div style={styles.pageWrap}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>Partner Users</h1>
          <p style={styles.subtitle}>Bank admin creates partner access (invite link) for each organization.</p>
        </div>
      </div>

      {error && <div style={styles.alertError}>{error}</div>}
      {successMsg && <div style={styles.alertSuccess}>{successMsg}</div>}

      {loading ? (
        <p style={{ color: "#6b7280" }}>Loading...</p>
      ) : (
        <>
          
          <div style={{ ...styles.card, marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: "0.85rem" }}>
              Create Partner Invite
            </h2>

            <form onSubmit={handleInvite}>
              <div style={styles.gridForm}>
                <div>
                  <label style={styles.label}>Organization</label>
                  <select
                    name="organization_id"
                    value={form.organization_id}
                    onChange={handleChange}
                    required
                    style={styles.input}
                  >
                    <option value="">-- Select --</option>
                    {organizations.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name || `Organization #${o.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Partner Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="e.g. hr@organization.com"
                    style={styles.input}
                  />
                </div>

                <div>
                  <label style={styles.label}>Full Name (optional)</label>
                  <input
                    type="text"
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="e.g. Accounts Officer"
                    style={styles.input}
                  />
                </div>

                <div style={styles.twoCol}>
                  <div>
                    <label style={styles.label}>Role</label>
                    <select name="role" value={form.role} onChange={handleChange} style={styles.input}>
                      <option value="PARTNER_ADMIN">PARTNER_ADMIN</option>
                      <option value="PARTNER_STAFF">PARTNER_STAFF</option>
                    </select>
                  </div>

                  <div>
                    <label style={styles.label}>Expires (hours)</label>
                    <input
                      type="number"
                      name="expires_in_hours"
                      value={form.expires_in_hours}
                      onChange={handleChange}
                      min="1"
                      step="1"
                      style={styles.input}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  style={btnStyle("primary", inviteLoading)}
                  onMouseEnter={inviteLoading ? undefined : onEnter}
                  onMouseLeave={inviteLoading ? undefined : onLeave}
                >
                  {inviteLoading ? "Creating..." : "Create Invite Link"}
                </button>
              </div>
            </form>
          </div>

          
          {inviteLink && (
            <div style={{ ...styles.card, marginBottom: "1rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  flexWrap: "wrap",
                }}
              >
                <h2 style={{ fontSize: "1.05rem", fontWeight: 800, margin: 0 }}>Invite Link</h2>

                <span style={{ ...styles.pill, ...(copied ? styles.pillOk : {}) }}>
                  {copied ? "Copied ✅" : "Not copied"}
                </span>
              </div>

              <div
                style={{
                  marginTop: "0 0.75rem",
                  ...styles.inviteBox,
                  transition: "transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease, background 120ms ease",
                }}
                onMouseEnter={onInviteEnter}
                onMouseLeave={onInviteLeave}
                title="Click to copy"
                onClick={copyInvite}
              >
                {inviteLink}
              </div>

              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
                <button
                  ref={copyBtnRef}
                  type="button"
                  onClick={copyInvite}
                  style={btnStyle(copied ? "ghost" : "accent", false)}
                  onMouseEnter={onEnter}
                  onMouseLeave={onLeave}
                >
                  {copied ? "Copied" : "Copy Link"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    
                    try {
                      const el = document.getElementById("inviteLinkSelectable");
                      if (el) {
                        const range = document.createRange();
                        range.selectNodeContents(el);
                        const sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                      }
                    } catch {}
                  }}
                  style={btnStyle("ghost", false)}
                  onMouseEnter={onEnter}
                  onMouseLeave={onLeave}
                >
                  Select Text
                </button>
              </div>

              
              <div
                id="inviteLinkSelectable"
                style={{
                  position: "absolute",
                  left: "-9999px",
                  top: "-9999px",
                  whiteSpace: "pre-wrap",
                }}
              >
                {inviteLink}
              </div>
            </div>
          )}

          
          <div style={styles.card}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: "0.85rem" }}>Partner Users</h2>

            {partnerUsers.length === 0 ? (
              <p style={{ color: "#6b7280" }}>No partner users yet.</p>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Organization</th>
                      <th style={styles.th}>Email</th>
                      <th style={styles.th}>Role</th>
                      <th style={styles.th}>Active</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {partnerUsers.map((u) => {
                      const rowBusy = rowActionLoadingId === u.id;
                      return (
                        <tr key={u.id}>
                          <td style={styles.td}>{u.id}</td>
                          <td style={styles.td}>
                            {orgLabelById.get(String(u.organization_id)) || `Org #${u.organization_id}`}
                          </td>
                          <td style={{ ...styles.td, wordBreak: "break-word" }}>{u.email}</td>
                          <td style={styles.td}>{u.role}</td>
                          <td style={styles.td}>
                            <span style={{ ...styles.pill, ...(u.is_active ? styles.pillOk : {}) }}>
                              {u.is_active ? "true" : "false"}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <div style={styles.actionsRow}>
                              <button
                                type="button"
                                disabled={rowBusy}
                                onClick={() => handleToggleActive(u)}
                                style={btnStyle("accent", rowBusy)}
                                onMouseEnter={rowBusy ? undefined : onEnter}
                                onMouseLeave={rowBusy ? undefined : onLeave}
                              >
                                {rowBusy ? "Working..." : u.is_active ? "Deactivate" : "Activate"}
                              </button>

                              <button
                                type="button"
                                disabled={rowBusy}
                                onClick={() => setConfirmDeleteUser(u)}
                                style={btnStyle("danger", rowBusy)}
                                onMouseEnter={rowBusy ? undefined : onEnter}
                                onMouseLeave={rowBusy ? undefined : onLeave}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          
          {confirmDeleteUser && (
            <div
              style={styles.modalOverlay}
              onClick={() => (rowActionLoadingId ? null : setConfirmDeleteUser(null))}
            >
              <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h3 style={styles.modalTitle}>Delete partner user?</h3>
                <p style={styles.modalText}>
                  You’re about to delete <b>{confirmDeleteUser.email}</b>. This action cannot be undone.
                </p>

                <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    disabled={!!rowActionLoadingId}
                    onClick={() => setConfirmDeleteUser(null)}
                    style={btnStyle("ghost", !!rowActionLoadingId)}
                    onMouseEnter={!!rowActionLoadingId ? undefined : onEnter}
                    onMouseLeave={!!rowActionLoadingId ? undefined : onLeave}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={rowActionLoadingId === confirmDeleteUser.id}
                    onClick={() => handleDelete(confirmDeleteUser)}
                    style={btnStyle("danger", rowActionLoadingId === confirmDeleteUser.id)}
                    onMouseEnter={rowActionLoadingId === confirmDeleteUser.id ? undefined : onEnter}
                    onMouseLeave={rowActionLoadingId === confirmDeleteUser.id ? undefined : onLeave}
                  >
                    {rowActionLoadingId === confirmDeleteUser.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
