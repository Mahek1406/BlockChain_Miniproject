import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api.js";

export default function MockPayment() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [method, setMethod] = useState(params.get("method") || "UPI");
  const [form, setForm] = useState({ upiId: "", accountName: "", accountNumber: "", ifsc: "", cardName: "", cardNumber: "", expiry: "", cvv: "" });
  const [error, setError] = useState(""); const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/policies/catalog").then(({ data }) => setProduct(data.products.find(item => (item._id || item.id) === params.get("product")))).catch(() => setError("Unable to load the selected policy."));
  }, [params]);

  function update(event) { setForm({ ...form, [event.target.name]: event.target.value }); }
  function valid() {
    if (method === "UPI") return /^[\w.-]+@[\w.-]+$/.test(form.upiId);
    if (method === "BANK_TRANSFER") return form.accountName.trim() && /^\d{8,18}$/.test(form.accountNumber) && /^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifsc.toUpperCase());
    return form.cardName.trim() && /^\d{16}$/.test(form.cardNumber.replace(/\s/g, "")) && /^(0[1-9]|1[0-2])\/\d{2}$/.test(form.expiry) && /^\d{3,4}$/.test(form.cvv);
  }
  async function submit(event) {
    event.preventDefault(); setError("");
    if (!valid()) return setError(method === "UPI" ? "Enter a valid mock UPI ID, for example user@bank." : method === "BANK_TRANSFER" ? "Enter valid mock account and IFSC details." : "Enter valid mock card details.");
    setBusy(true);
    try {
      const paymentDetails = method === "UPI" ? { upiId: form.upiId } : method === "BANK_TRANSFER" ? { accountName: form.accountName, accountLast4: form.accountNumber.slice(-4), ifsc: form.ifsc.toUpperCase() } : { cardName: form.cardName, cardLast4: form.cardNumber.replace(/\s/g, "").slice(-4), expiry: form.expiry };
      const { data } = await api.post(`/policies/catalog/${params.get("product")}/purchase`, { paymentMethod: method, paymentDetails, paymentResult: "SUCCESS" });
      setResult(data.purchase.paymentReference);
    } catch (err) { setError(err.response?.data?.message || "Mock payment could not be completed."); }
    finally { setBusy(false); }
  }
  async function simulateFailure() {
    setError("");
    try {
      await api.post(`/policies/catalog/${params.get("product")}/purchase`, { paymentMethod: method, paymentResult: "FAILED" });
    } catch (err) {
      setError(err.response?.data?.message || "Mock payment failed as requested.");
    }
  }
  if (!product) return <section><div className="alert alert-danger">{error || "Loading payment details..."}</div></section>;
  return <section><div className="page-intro"><div><p className="eyebrow accent">MOCK PAYMENT</p><h2>{result ? "Payment successful." : "Complete your payment."}</h2><p className="muted">{product.name} · ₹{Number(product.premium).toLocaleString("en-IN")}</p></div></div><div className="form-panel payment-page">{result ? <><div className="alert alert-info">Mock payment approved and policy created.</div><div className="panel"><p className="eyebrow accent">PAYMENT REFERENCE</p><h3>{result}</h3><p className="muted">Save this reference for your records. Payment details were not stored.</p><button className="btn btn-primary" onClick={() => navigate("/policies")}>View my policy</button></div></> : <><button type="button" className="choice-button" onClick={simulateFailure}>Simulate failed payment</button>{error && <div className="alert alert-danger">{error}</div>}<fieldset className="payment-picker"><legend>Choose payment method</legend><div className="choice-buttons">{["UPI", "BANK_TRANSFER", "CARD"].map(option => <button type="button" key={option} className={method === option ? "choice-button active" : "choice-button"} onClick={() => setMethod(option)}>{option === "BANK_TRANSFER" ? "Bank transfer" : option}</button>)}</div></fieldset><form onSubmit={submit}>{method === "UPI" && <label>UPI ID<input name="upiId" placeholder="name@bank" value={form.upiId} onChange={update} /></label>}{method === "BANK_TRANSFER" && <><label>Account holder name<input name="accountName" value={form.accountName} onChange={update} /></label><div className="form-row"><label>Account number<input inputMode="numeric" name="accountNumber" value={form.accountNumber} onChange={update} /></label><label>IFSC code<input name="ifsc" placeholder="ABCD0123456" value={form.ifsc} onChange={update} /></label></div></>}{method === "CARD" && <><label>Name on card<input name="cardName" value={form.cardName} onChange={update} /></label><label>Card number<input inputMode="numeric" maxLength="19" placeholder="1234 5678 9012 3456" name="cardNumber" value={form.cardNumber} onChange={update} /></label><div className="form-row"><label>Expiry (MM/YY)<input placeholder="12/30" name="expiry" value={form.expiry} onChange={update} /></label><label>CVV<input type="password" inputMode="numeric" maxLength="4" name="cvv" value={form.cvv} onChange={update} /></label></div></>}<p className="form-note">Mock payment only. Full card, bank, and UPI details are validated in memory and are never stored.</p><div className="review-actions"><button type="button" className="btn btn-light" onClick={() => navigate("/policy-catalog")}>Cancel</button><button disabled={busy} className="btn btn-primary">{busy ? "Processing..." : "Pay securely (mock)"}</button></div></form></>}</div></section>;
}
