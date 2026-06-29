import { useEffect, useState } from 'react';
import client from '../../api/client';
import ChatPanel from '../../components/ChatPanel';

export default function AdminChatPanel() {
  const [threads, setThreads] = useState([]);
  const [activeUserId, setActiveUserId] = useState(null);

  useEffect(() => { client.get('/chat/threads').then(({ data }) => setThreads(data.threads || [])); }, []);

  return (
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ width: 240 }}>
        {threads.map((t) => (
          <button key={t.user_id} onClick={() => setActiveUserId(t.user_id)}
            className="card-surface" style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 8, padding: 12,
              border: activeUserId === t.user_id ? '2px solid var(--forest)' : '1px solid var(--line)' }}>
            <strong>{t.full_name}</strong>
            <div className="product-card-meta">{t.last_message?.slice(0, 30)}</div>
          </button>
        ))}
        {threads.length === 0 && <div className="empty-state">No conversations yet.</div>}
      </div>
      <div style={{ flex: 1, minWidth: 280 }}>
        {activeUserId ? <ChatPanel adminView threadUserId={activeUserId} /> : <div className="empty-state">Select a conversation.</div>}
      </div>
    </div>
  );
}
