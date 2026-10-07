import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";

const types = ["Health Insurance", "Motor Insurance", "Life Insurance", "Personal Accident Insurance", "Home Insurance", "Travel Insurance", "Crop Insurance"];

export default function AdminProductForm() {
  const navigate = useNavigate(); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", policyType: types[0], insurer: "", coverageType: "", coverageAmount: "", premium: "", gstRate: 18, termMonths: 12 });
  function update(e) { setForm({ ...form, [e.target.name]: e.target.value }); }
  async function submit(e) {
    e.preventDefault(); setError("");
    if (Object.values(form).some(value => value === "")) return setError("Complete every field before publishing the product.");
    setBusy(true);
    try { await api.post("/policies/catalog", { ...form, coverageAmount: Number(form.coverageAmount), premium: Number(form.premium), gstRate: Number(form.gstRate), termMonths: Number(form.termMonths) }); navigate("/policy-catalog"); }
    catch (err) { setError(err.response?.data?.message || "Unable to publish policy product"); } finally { setBusy(false); }
  }
  return <section><div className="page-intro"><div><p className="eyebrow accent">ADMINISTRATION</p><h2>Publish a policy product.</h2><p className="muted">This product will appear in the policyholder marketplace.</p></div></div><div className="form-panel">{error && <div className="alert alert-danger">{error}</div>}<form onSubmit={submit}><label>Product name<input name="name" value={form.name} onChange={update} /></label><div className="form-row"><label>Category<select name="policyType" value={form.policyType} onChange={update}>{types.map(type => <option key={type}>{type}</option>)}</select></label><label>Insurer<input name="insurer" value={form.insurer} onChange={update} /></label></div><label>Coverage type<input name="coverageType" value={form.coverageType} onChange={update} /></label><div className="form-row"><label>Coverage amount (₹)<input type="number" min="1" name="coverageAmount" value={form.coverageAmount} onChange={update} /></label><label>Premium (₹)<input type="number" min="1" name="premium" value={form.premium} onChange={update} /></label></div><div className="form-row"><label>Term (months)<input type="number" min="1" max="600" name="termMonths" value={form.termMonths} onChange={update} /></label><label>GST rate (%)<input type="number" min="0" max="100" name="gstRate" value={form.gstRate} onChange={update} /></label></div><button disabled={busy} className="btn btn-primary">{busy ? "Publishing..." : "Publish product"} <span>→</span></button></form></div></section>;
}
