import { useEffect, useState } from 'react';
import client from '../../api/client';

export default function AdminUsersPanel() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await client.get('/admin/users', { params: { role: roleFilter || undefined } });
    setUsers(data.users || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [roleFilter]);

  const setStatus = async (userId, status) => {
    await client.patch(`/admin/users/${userId}/status`, { status });
    load();
  };
  const makeAdmin = async (userId) => {
    if (!confirm('Grant admin access to this user?')) return;
    await client.post(`/admin/users/${userId}/make-admin`);
    load();
  };

  return (
    <div>
      <div className="field-group" style={{ maxWidth: 220, marginBottom: 16 }}>
        <label>Filter by role</label>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All</option>
          <option value="buyer">Buyer</option>
          <option value="seller">Seller</option>
          <option value="delivery">Delivery</option>
        </select>
      </div>

      {loading ? <div className="empty-state">Loading users…</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {users.map((u) => (
            <div className="card-surface" key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <strong>{u.full_name}</strong> {u.is_admin && <span className="product-card-badge">Admin</span>}
                <div className="product-card-meta">{u.email} · {u.primary_role} · KYC: {u.kyc_status}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className={`status-chip status-${u.status}`}>{u.status}</span>
                {u.status !== 'suspended' ? (
                  <button className="btn-secondary" onClick={() => setStatus(u.id, 'suspended')}>Suspend</button>
                ) : (
                  <button className="btn-secondary" onClick={() => setStatus(u.id, 'active')}>Reactivate</button>
                )}
                {!u.is_admin && <button className="btn-link" onClick={() => makeAdmin(u.id)}>Make admin</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
