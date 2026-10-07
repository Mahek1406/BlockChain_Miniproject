import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";

const types = ["Health Insurance", "Motor Insurance", "Life Insurance", "Personal Accident Insurance", "Home Insurance", "Travel Insurance", "Crop Insurance"];

export default function AdminPolicyForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ policyId: "", policyType: types[0], insurer: "", policyNumber: "", coverageType: "", coverageAmount: "", premium: "", gstRate: "18", startDate: "", endDate: "", userId: "" });
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  function update(event) { setForm({ ...form, [event.target.name]: event.target.value }); }
  async function submit(event) {
    event.preventDefault(); setError("");
    if (!form.policyId || !form.insurer || !form.policyNumber || !form.coverageType || !form.userId) return setError("Complete all policy identity fields, including the policyholder user ID.");
    if (!form.coverageAmount || Number(form.coverageAmount) <= 0 || !form.premium || Number(form.premium) <= 0) return setError("Coverage and premium must be greater than ₹0.");
    if (!form.startDate || !form.endDate || new Date(form.endDate) <= new Date(form.startDate)) return setError("Choose a valid policy period.");
    setBusy(true);
    try { await api.post("/policies", { ...form, coverageAmount: Number(form.coverageAmount), premium: Number(form.premium), gstRate: Number(form.gstRate) }); navigate("/policies"); }
    catch (err) { setError(err.response?.data?.message || "Unable to create policy"); } finally { setBusy(false); }
  }
  return <section><div className="page-intro"><div><p className="eyebrow accent">ADMINISTRATION</p><h2>Create an Indian policy.</h2><p className="muted">Assign a new INR policy to an existing policyholder.</p></div></div><div className="form-panel">{error && <div className="alert alert-danger">{error}</div>}<form onSubmit={submit}><div className="form-row"><label>Policy ID<input name="policyId" value={form.policyId} onChange={update} /></label><label>Policyholder user ID<input name="userId" value={form.userId} onChange={update} /></label></div><div className="form-row"><label>Policy category<select name="policyType" value={form.policyType} onChange={update}>{types.map(type => <option key={type}>{type}</option>)}</select></label><label>Insurer<input name="insurer" value={form.insurer} onChange={update} /></label></div><div className="form-row"><label>Policy number<input name="policyNumber" value={form.policyNumber} onChange={update} /></label><label>Coverage type<input name="coverageType" value={form.coverageType} onChange={update} /></label></div><div className="form-row"><label>Coverage amount (₹)<input type="number" min="1" name="coverageAmount" value={form.coverageAmount} onChange={update} /></label><label>Annual premium (₹)<input type="number" min="1" name="premium" value={form.premium} onChange={update} /></label></div><div className="form-row"><label>Start date<input type="date" name="startDate" value={form.startDate} onChange={update} /></label><label>End date<input type="date" name="endDate" value={form.endDate} onChange={update} /></label></div><label>GST rate (%)<input type="number" min="0" max="100" name="gstRate" value={form.gstRate} onChange={update} /></label><button disabled={busy} className="btn btn-primary">{busy ? "Creating policy..." : "Create policy"} <span>→</span></button></form></div></section>;
}
