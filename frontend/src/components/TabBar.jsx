import { useState } from 'react';

/**
 * Horizontal, scroll-on-overflow tab bar (mobile-friendly: swipe instead of a sidebar).
 * tabs: [{ key, label }]; children render function receives the active key.
 */
export default function TabBar({ tabs, initial, children }) {
  const [active, setActive] = useState(initial || tabs[0]?.key);

  return (
    <div>
      <div className="tab-scroll">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab-pill ${active === tab.key ? 'tab-pill-active' : ''}`}
            onClick={() => setActive(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tab-panel">{children(active)}</div>
    </div>
  );
}
