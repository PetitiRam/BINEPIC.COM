import Logo from './Logo';

export default function AuthLayout({ children }) {
  return (
    <div className="auth-shell">
      <aside className="auth-side">
        <div>
          <Logo size={40} light />
          <p className="tagline" style={{ marginTop: 56 }}>
            From the farm to the feed.<br />One marketplace for everyone who sells.
          </p>
          <p className="sub">
            JEDIDA connects sellers, shoppers and delivery partners in one trusted
            marketplace — built around agriculture, the backbone of our economy.
          </p>
        </div>
        <div className="feature-chips">
          <div className="feature-chip"><span className="dot" /> Your own shop with a shareable storefront link</div>
          <div className="feature-chip"><span className="dot" /> Escrow-protected payments, released on delivery</div>
          <div className="feature-chip"><span className="dot" /> AI listing assistants polish your products for you</div>
        </div>
        <div className="weave-divider" />
      </aside>
      <div className="auth-form-panel">
        <div className="auth-card">{children}</div>
      </div>
    </div>
  );
}
