import { useEffect, useState } from "react";
import api from "../services/api.js";
import Loading from "../components/Loading.jsx";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/notifications")
      .then(({ data }) => setNotifications(data.notifications))
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <Loading />;
  return <section><div className="page-intro"><div><p className="eyebrow accent">UPDATES</p><h2>Notifications.</h2><p className="muted">Claim and payment updates for your account.</p></div></div><div className="panel">{notifications.map(item => <article className="notification-item" key={item._id}><div><strong>{item.title}</strong><p className="muted">{item.message}</p></div><small>{new Date(item.createdAt).toLocaleString("en-IN")}</small></article>)}{!notifications.length && <p className="muted empty">No notifications yet.</p>}</div></section>;
}
