import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api.js";

export default function ClaimForm() {
  const navigate = useNavigate(); const [policies, setPolicies] = useState([]); const [loadingPolicies, setLoadingPolicies] = useState(true); const [form, setForm] = useState({ policyId: "", claimType: "Accident", incidentDate: "", amount: "", description: "" }); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => {
    api.get("/policies")
      .then(r => { const activePolicies = r.data.policies.filter(policy => policy.status === "ACTIVE"); setPolicies(activePolicies); if (activePolicies[0]) setForm(f => ({ ...f, policyId: activePolicies[0].policyId })); })
      .catch(() => setError("Policies could not be loaded. Refresh the page or sign in again."))
      .finally(() => setLoadingPolicies(false));
  }, []);
  async function submit(e) {
    e.preventDefault(); setError("");
    if (!form.policyId) return setError("Select a policy before submitting.");
    if (!form.incidentDate) return setError("Incident date is required.");
    if (new Date(form.incidentDate) > new Date()) return setError("Incident date cannot be in the future.");
    if (!form.amount || Number(form.amount) <= 0) return setError("Enter a claim amount greater than ₹0.");
    if (form.description.trim().length < 10) return setError("Describe the incident in at least 10 characters.");
    setBusy(true);
    try { await api.post("/claims", { ...form, amount: Number(form.amount), description: form.description.trim() }); navigate("/claims"); }
    catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to submit claim");
    }
    finally { setBusy(false); }
  }
  return <section><div className="page-intro"><div><p className="eyebrow accent">NEW SUBMISSION</p><h2>Tell us what happened.</h2><p className="muted">Your claim will be securely hashed and recorded on the blockchain.</p></div><Link to="/claims" className="text-link">← Back to claims</Link></div><div className="form-panel">{error && <div className="alert alert-danger">{error}</div>}{!loadingPolicies && !policies.length && !error && <div className="alert alert-warning">No active policies are linked to your account. Ask an administrator to assign a policy before submitting a claim. <Link to="/policies" className="text-link">View policies</Link></div>}<form onSubmit={submit}><div className="form-row"><label>Policy<select required disabled={loadingPolicies || !policies.length} value={form.policyId} onChange={e => setForm({ ...form, policyId: e.target.value })}><option value="">{loadingPolicies ? "Loading policies..." : policies.length ? "Select a policy" : "No active policies available"}</option>{policies.map(p => <option key={p._id} value={p.policyId}>{p.policyId} · {p.policyType}</option>)}</select></label><label>Claim type<select value={form.claimType} onChange={e => setForm({ ...form, claimType: e.target.value })}><option>Accident</option><option>Medical</option><option>Theft</option><option>Property damage</option></select></label></div><div className="form-row"><label>Incident date<input type="date" required value={form.incidentDate} onChange={e => setForm({ ...form, incidentDate: e.target.value })} /></label><label>Claim amount (₹)<input type="number" min="1" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></label></div><label>Describe the incident<textarea required minLength="10" rows="6" placeholder="Provide the relevant details..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label><div className="form-note">◆ Your claim data will be secured with a cryptographic hash. Documents are stored off-chain.</div><button disabled={busy || loadingPolicies || !policies.length} className="btn btn-primary">{busy ? "Recording claim..." : "Submit claim securely"} <span>→</span></button></form></div></section>;
}
