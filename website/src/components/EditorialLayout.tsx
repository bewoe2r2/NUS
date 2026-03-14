import { NavLink } from 'react-router-dom';
import { Heart, Cpu, BarChart3, Play } from 'lucide-react';
import '../styles/global.css';

interface NavItemProps {
  to: string;
  label: string;
  icon: React.ComponentType<{ size: number }>;
}

const NavItem = ({ to, label, icon: Icon }: NavItemProps) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `site-nav__link${isActive ? ' site-nav__link--active' : ''}`
    }
  >
    <Icon size={16} />
    {label}
  </NavLink>
);

export const EditorialLayout = ({ children }: { children: React.ReactNode }) => (
  <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
    <header className="site-header">
      <div className="container site-header__inner">
        <NavLink to="/" className="site-header__brand">
          <span className="site-header__title">BEWO</span>
          <span className="site-header__tagline">Predictive Chronic Care</span>
        </NavLink>

        <nav className="site-nav">
          <NavItem to="/" label="Overview" icon={Heart} />
          <NavItem to="/technology" label="Technology" icon={Cpu} />
          <NavItem to="/impact" label="Impact" icon={BarChart3} />
          <NavItem to="/demo" label="Product" icon={Play} />
        </nav>
      </div>
    </header>

    <main style={{ flex: 1, paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-8)' }}>
      <div className="container">
        {children}
      </div>
    </main>

    <footer className="site-footer">
      <div className="container">
        <p className="site-footer__text">
          Bewo Health 2026 — Predictive AI for Singapore's Aging Population
        </p>
      </div>
    </footer>
  </div>
);
