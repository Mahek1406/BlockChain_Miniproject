import { useEffect, useState } from "react";
import api from "../services/api.js";
import Loading from "../components/Loading.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Purchases() {
  const { session } = useAuth();
  const [purchases, setPurchases] = useState([]); const [loading, setLoading] = useState(true);
  useEffect(() => { api.get("/policies/purchases").then(r => setPurchases(r.data.purchases)).finally(() => setLoading(false)); }, []);
  if (loading) return <Loading />;
  return <section><div className="page-intro"><div><p className="eyebrow accent">{session.user.role === "ADMIN" ? "SALES LEDGER" : "PAYMENT HISTORY"}</p><h2>{session.user.role === "ADMIN" ? "Policy purchases." : "Your payments."}</h2><p className="muted">{session.user.role === "ADMIN" ? "Every buyer, policy, and simulated payment in one place." : "Your masked mock payment references and purchased policies."}</p></div></div><div className="panel"><div className="table-responsive"><table><thead><tr>{session.user.role === "ADMIN" && <th>Buyer</th>}<th>Policy</th><th>Premium</th><th>Payment</th><th>Reference</th><th>Date</th></tr></thead><tbody>{purchases.map(p => <tr key={p._id}>{session.user.role === "ADMIN" && <td><b>{p.buyerId?.name}</b><br /><small>{p.buyerId?.email}</small></td>}<td>{p.productName}<br /><small>{p.policyId?.policyId}</small></td><td>₹{Number(p.premium).toLocaleString("en-IN")}</td><td>{p.paymentMethod} · {p.paymentStatus}</td><td>{p.paymentReference}</td><td>{new Date(p.createdAt).toLocaleDateString("en-IN")}</td></tr>)}</tbody></table></div>{!purchases.length && <p className="muted empty">No policy purchases yet.</p>}</div></section>;
}
