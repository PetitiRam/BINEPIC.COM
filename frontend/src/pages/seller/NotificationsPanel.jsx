import { useEffect, useState } from 'react';
import client from '../../api/client';

export default function NotificationsPanel() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/notifications/mine');
      setNotifications(data.notifications || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await client.post(`/notifications/${id}/read`);
    load();
  };

  if (loading) return <div className="empty-state">Loading notifications…</div>;
  if (notifications.length === 0) return <div className="empty-state">No notifications yet.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {notifications.map((n) => (
        <div key={n.id} className="card-surface" style={{ padding: 16, opacity: n.is_read ? 0.6 : 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <strong>{n.title}</strong>
            {!n.is_read && <button className="btn-link" onClick={() => markRead(n.id)}>Mark read</button>}
          </div>
          <p style={{ color: '#5B6760', marginTop: 4, fontSize: '0.9rem' }}>{n.body}</p>
          <span style={{ fontSize: '0.75rem', color: '#8A9189' }}>{new Date(n.created_at).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
