import { useEffect, useState } from "react";
import api from "../services/api.js";
import StatusBadge from "../components/StatusBadge.jsx";
import Loading from "../components/Loading.jsx";

export default function Verification() {
  const [claims, setClaims] = useState([]);
  const [selected, setSelected] = useState(null);
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/claims").then((response) => {
      setClaims(response.data.claims);
      setSelected(response.data.claims[0] || null);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setVerification(null);
    api.get(`/claims/${selected.claimId}/verify`)
      .then((response) => setVerification(response.data))
      .catch(() => setVerification({ verified: false }));
  }, [selected]);

  if (loading) return <Loading />;
  return <section><div className="page-intro"><div><p className="eyebrow accent">PROOF OF INTEGRITY</p><h2>Blockchain verification.</h2><p className="muted">Compare your application record with its immutable blockchain fingerprint.</p></div></div><div className="verification-layout"><div className="panel claim-selector"><p className="eyebrow">SELECT CLAIM</p>{claims.map((claim) => <button className={selected?._id === claim._id ? "claim-select active" : "claim-select"} key={claim._id} onClick={() => setSelected(claim)}><span><b>{claim.claimId}</b><small>{claim.claimType}</small></span><StatusBadge status={claim.status} /></button>)}</div>{selected ? <div className="panel verification-card"><div className={verification?.verified ? "verified-icon" : "verified-icon failed"}>{verification?.verified ? "✓" : "!"}</div><p className="eyebrow accent">VERIFICATION RESULT</p><h3>{verification?.verified ? "Claim data verified" : "Verification unavailable"}</h3><p className="muted">{verification?.verified ? "The database record matches the hash stored on the blockchain." : "This record has not been written to the local blockchain yet."}</p><div className="verify-result">{verification?.verified ? "✓ VERIFIED" : "— NOT RECORDED"}</div><div className="hash-block"><small>CLAIM DATA HASH</small><code>{verification?.databaseHash || selected.claimDataHash}</code></div><div className="hash-block"><small>TRANSACTION HASH</small><code>{verification?.transactionHash || selected.transactionHash || "Pending blockchain record"}</code></div><div className="verify-meta"><span>Status<strong><StatusBadge status={selected.status} /></strong></span><span>Block number<strong>{verification?.blockNumber || selected.blockNumber || "—"}</strong></span></div></div> : <div className="panel empty">No claims available for verification.</div>}</div></section>;
}
