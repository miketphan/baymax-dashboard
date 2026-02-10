import React, { useState } from 'react';
import { ProjectsKanban } from './sections/ProjectsKanban';
import { ConnectedServices } from './sections/ConnectedServices';
import { UsageLimits } from './sections/UsageLimits';

type Section = 'projects' | 'services' | 'usage';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('projects');

  const navItems: { id: Section; label: string; icon: string }[] = [
    { id: 'projects', label: 'Projects', icon: '📋' },
    { id: 'services', label: 'Connected Services', icon: '🔌' },
    { id: 'usage', label: 'Usage & Limits', icon: '📊' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#020617',
        color: '#f8fafc',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header */}
      <header
        style={{
          background: '#0f172a',
          borderBottom: '1px solid #1e293b',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}
          >
            ◆
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Nexus Dashboard
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span
            style={{
              color: '#64748b',
              fontSize: '13px',
            }}
          >
            v1.0.0
          </span>
          <div
            style={{
              width: '32px',
              height: '32px',
              background: '#334155',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
            }}
          >
            👤
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', height: 'calc(100vh - 69px)' }}>
        {/* Sidebar */}
        <nav
          style={{
            width: '240px',
            background: '#0f172a',
            borderRight: '1px solid #1e293b',
            padding: '16px 12px',
          }}
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              style={{
                width: '100%',
                padding: '12px 16px',
                marginBottom: '4px',
                background: activeSection === item.id ? '#1e293b' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: activeSection === item.id ? '#f8fafc' : '#94a3b8',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s',
                textAlign: 'left',
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Main Content */}
        <main
          style={{
            flex: 1,
            padding: '24px',
            overflow: 'auto',
          }}
        >
          {activeSection === 'projects' && <ProjectsKanban />}
          {activeSection === 'services' && <ConnectedServices />}
          {activeSection === 'usage' && <UsageLimits />}
        </main>
      </div>
    </div>
  );
};

export default App;
