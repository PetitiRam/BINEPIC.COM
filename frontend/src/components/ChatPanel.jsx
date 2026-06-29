import { useEffect, useRef, useState } from 'react';
import client from '../api/client';

export default function ChatPanel({ adminView = false, threadUserId = null }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  const endpoint = adminView ? `/chat/threads/${threadUserId}` : '/chat/mine';

  const load = async () => {
    if (adminView && !threadUserId) return;
    const { data } = await client.get(endpoint);
    setMessages(data.messages || []);
  };

  useEffect(() => { load(); }, [threadUserId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    await client.post(endpoint, { body: text });
    setText('');
    load();
  };

  return (
    <div className="card-surface" style={{ display: 'flex', flexDirection: 'column', height: 420 }}>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {messages.length === 0 && <div className="empty-state">No messages yet. Say hello to the JEDIDA admin team.</div>}
        {messages.map((m) => (
          <div key={m.id} style={{
            alignSelf: m.sender_id === m.user_id && !adminView ? 'flex-end' : (adminView && m.sender_id !== threadUserId ? 'flex-end' : 'flex-start'),
            background: 'var(--cream-dim)', padding: '8px 12px', borderRadius: 10, maxWidth: '75%', fontSize: '0.9rem'
          }}>
            {m.body}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message the admin team…" onKeyDown={(e) => e.key === 'Enter' && send()} />
        <button className="btn-primary" style={{ width: 'auto', padding: '10px 18px' }} onClick={send}>Send</button>
      </div>
    </div>
  );
}
