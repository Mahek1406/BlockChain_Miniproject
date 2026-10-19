import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api.js";
import StatusBadge from "../components/StatusBadge.jsx";
import Loading from "../components/Loading.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Claims() {
  const { session } = useAuth();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [selected, setSelected] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [files, setFiles] = useState({});
  const filter = searchParams.get("status");

  function refresh() {
    api.get("/claims")
      .then((response) => setClaims(filter ? response.data.claims.filter((claim) => claim.status === filter) : response.data.claims))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, [filter]);

  async function changeStatus(status) {
    try {
      await api.put(`/claims/${selected.claimId}/status`, { status, remarks });
      setSelected(null);
      refresh();
    } catch (err) {
      window.alert(err.response?.data?.message || "Unable to update the claim on the blockchain.");
    }
  }

  async function settle(claimId, method) {
    try {
      await api.put(`/claims/${claimId}/payment`, { method });
      refresh();
    } catch (err) {
      window.alert(err.response?.data?.message || "Unable to simulate settlement");
    }
  }

  async function upload(claimId) {
    const file = files[claimId];
    if (!file) return window.alert("Choose a PDF, JPG, or PNG document first.");
    const data = new FormData();
    data.append("document", file);
    try {
      await api.post(`/documents/claims/${claimId}`, data);
      window.alert("Encrypted document uploaded.");
      setFiles({ ...files, [claimId]: null });
    } catch (err) {
      window.alert(err.response?.data?.message || "Unable to upload document");
    }
  }

  if (loading) return <Loading />;

  return (
    <section>
      <div className="page-intro">
        <div>
          <p className="eyebrow accent">{session.user.role === "ADMIN" ? "OPERATIONS" : "YOUR ACTIVITY"}</p>
          <h2>{filter ? "Pending claims." : session.user.role === "ADMIN" ? "Claims queue." : "Your claims."}</h2>
          <p className="muted">{claims.length} claim{claims.length === 1 ? "" : "s"} in this view.</p>
        </div>
        {session.user.role !== "ADMIN" && <Link to="/claims/new" className="btn btn-primary">Submit a claim <span>→</span></Link>}
      </div>
      <div className="panel">
        <div className="table-responsive">
          <table>
            <thead><tr><th>Claim ID</th><th>Policy</th><th>Type</th><th>Submitted</th><th>Amount</th><th>Status</th><th>Review</th><th>Settlement</th>{session.user.role === "ADMIN" && <th />}</tr></thead>
            <tbody>{claims.map((claim) => (
              <tr key={claim._id}>
                <td><b>{claim.claimId}</b></td>
                <td>{claim.policyId}</td>
                <td>{claim.claimType}</td>
                <td>{new Date(claim.createdAt).toLocaleDateString("en-IN")}</td>
                <td>₹{Number(claim.amount).toLocaleString("en-IN")}</td>
                <td><StatusBadge status={claim.status} /></td>
                <td>{claim.reviewedAt ? <><small>{new Date(claim.reviewedAt).toLocaleDateString("en-IN")}</small>{claim.approvedAt && <><br /><small>Approved {new Date(claim.approvedAt).toLocaleDateString("en-IN")}</small></>}</> : "Pending review"}</td>
                <td>
                  {claim.payment?.status === "PAID" ? "Paid" : claim.status === "APPROVED" && session.user.role !== "ADMIN" ? <select aria-label={`Settlement method for ${claim.claimId}`} defaultValue="" onChange={(event) => event.target.value && settle(claim.claimId, event.target.value)}><option value="">Settle (simulated)</option><option value="UPI">UPI</option><option value="BANK_TRANSFER">Bank transfer</option><option value="CHEQUE">Cheque</option></select> : "—"}
                  <div><input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => setFiles({ ...files, [claim.claimId]: event.target.files?.[0] })} /><button className="btn btn-sm btn-light" onClick={() => upload(claim.claimId)}>Upload encrypted document</button></div>
                </td>
                {session.user.role === "ADMIN" && <td><button className="btn btn-sm btn-light" onClick={() => { setSelected(claim); setRemarks(claim.remarks || ""); }}>Review</button></td>}
              </tr>
            ))}</tbody>
          </table>
        </div>
        {!claims.length && <p className="muted empty">No claims match this view.</p>}
      </div>
      {selected && <div className="modal-backdrop"><div className="review-modal">
        <button className="modal-close" onClick={() => setSelected(null)}>×</button>
        <p className="eyebrow accent">CLAIM REVIEW</p>
        <h3>{selected.claimId}</h3>
        <p>{selected.description}</p>
        <div className="review-details"><span>Claim type<strong>{selected.claimType}</strong></span><span>Amount<strong>₹{Number(selected.amount).toLocaleString()}</strong></span><span>Current status<strong><StatusBadge status={selected.status} /></strong></span><span>Submitted<strong>{new Date(selected.createdAt).toLocaleDateString()}</strong></span></div>
        <label>Officer remarks<textarea rows="3" value={remarks} onChange={(event) => setRemarks(event.target.value)} /></label>
        <div className="review-actions">
          {selected.status === "PENDING" && <button className="btn btn-primary" onClick={() => changeStatus("UNDER_REVIEW")}>Start review</button>}
          {selected.status === "UNDER_REVIEW" && <><button className="btn btn-outline-danger" onClick={() => changeStatus("REJECTED")}>Reject claim</button><button className="btn btn-primary" onClick={() => changeStatus("APPROVED")}>Approve claim</button></>}
        </div>
      </div></div>}
    </section>
  );
}
