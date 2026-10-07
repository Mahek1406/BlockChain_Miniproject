import { useEffect, useState } from "react";
import api from "../services/api.js";
import Loading from "../components/Loading.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Policies() {
  const [policies, setPolicies] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { api.get("/policies").then(r => setPolicies(r.data.policies)).catch(() => setError("Policies could not be loaded. Please refresh or sign in again.")).finally(() => setLoading(false)); }, []);
  if (loading) return <Loading />;
  return <section><div className="page-intro"><div><p className="eyebrow accent">INDIA COVERAGE</p><h2>{policies.length ? "Your policies." : "Policies overview."}</h2><p className="muted">Policies in this account: <b>{policies.length}</b> · Indian products shown in INR.</p></div></div>{error && <div className="alert alert-danger">{error}</div>}{!error && !policies.length && <div className="panel"><h3>No policies assigned yet</h3><p className="muted">An administrator must assign an Indian insurance policy to your account before you can submit a claim.</p></div>}<div className="policy-grid">{policies.map(p => <article className="policy-card" key={p._id}><div className="policy-icon">◈</div><StatusBadge status={p.status} /><h3>{p.policyType}</h3><p className="muted">{p.insurer} · {p.policyNumber}</p><p className="muted">{p.coverageType}</p><div className="policy-amount"><small>Coverage amount</small><strong>₹{Number(p.coverageAmount).toLocaleString("en-IN")}</strong></div><div className="policy-meta"><span>Premium<br /><b>₹{Number(p.premium).toLocaleString("en-IN")}</b></span><span>Valid until<br /><b>{new Date(p.endDate).toLocaleDateString("en-IN")}</b></span></div></article>)}</div></section>;
}
