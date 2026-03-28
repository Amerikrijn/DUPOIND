import { Activity, ShieldCheck, Clock, AlertTriangle } from 'lucide-react';
import { useSystemLogs } from '../hooks/useFirestore';

export function SystemDashboard() {
  const { logs } = useSystemLogs();

  return (
    <div className="glass-panel system-dashboard" style={{ marginTop: '1.5rem', border: '1px solid rgba(0, 255, 100, 0.1)' }}>
      <div className="panel-header">
        <Activity className="panel-icon pulse-icon" size={22} color="#00ff66" />
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1rem', color: '#00ff66' }}>Atlas Pulse</h2>
          <p style={{ fontSize: '0.65rem', opacity: 0.6 }}>Autonomous System Maintenance</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: '#00ff66', background: 'rgba(0,255,100,0.05)', padding: '2px 8px', borderRadius: '12px' }}>
          <ShieldCheck size={12} /> Live
        </div>
      </div>

      <div className="logs-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', padding: '0.5rem' }}>
        {logs.length === 0 && <p style={{ fontSize: '0.7rem', opacity: 0.4, textAlign: 'center' }}>Initializing system diagnostics...</p>}
        {logs.map((log) => (
          <div key={log.id} style={{ 
            display: 'flex', 
            gap: '0.75rem', 
            background: 'rgba(255,255,255,0.02)', 
            padding: '0.5rem', 
            borderRadius: '8px', 
            fontSize: '0.75rem',
            borderLeft: `2px solid ${log.status === 'success' ? '#00ff66' : log.status === 'warning' ? '#ffcc00' : '#ff4444'}`
          }}>
            <div style={{ marginTop: '2px' }}>
              {log.status === 'success' ? <ShieldCheck size={14} color="#00ff66" /> : <AlertTriangle size={14} color="#ffcc00" />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ fontWeight: 'bold' }}>{log.action}</span>
                <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>{log.details}</div>
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.65rem', opacity: 0.5 }}>
          <Clock size={12} /> System Status: Normal · Cycle Optimal
        </div>
      </div>
    </div>
  );
}
