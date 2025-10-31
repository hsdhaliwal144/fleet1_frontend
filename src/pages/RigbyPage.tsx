import { useState, useEffect } from 'react';
import { Home, TrendingUp, Database, BarChart3, Mail, GraduationCap, Clock, FileCheck, DollarSign, Send, MoreVertical } from 'lucide-react';
import BrokerIntelligenceDashboard from '../components/BrokerIntelligenceDashboard';
import BrokerOutreachDashboard from '../components/BrokerOutreachDashboard';

interface FleetMetrics {
  trucks: number;
  drivers: number;
  loadsPerMonth: number;
  milesPerMonth: number;
  fuelCost: number;
  insurance: number;
  maintenance: number;
  otherExpenses: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function RigbyPage() {
  const [activeTab, setActiveTab] = useState('rigby');
  const [metrics, setMetrics] = useState<FleetMetrics>({
    trucks: 0,
    drivers: 0,
    loadsPerMonth: 0,
    milesPerMonth: 0,
    fuelCost: 0,
    insurance: 0,
    maintenance: 0,
    otherExpenses: 0
  });
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! How can I assist you?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFleetData();
  }, []);

  const loadFleetData = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/fleet');
      const data = await response.json();
      if (data.success) {
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Failed to load fleet data:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/rigby/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }],
          currentMetrics: metrics
        })
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);

      if (data.updatedMetrics) {
        setMetrics(prev => ({ ...prev, ...data.updatedMetrics }));
        await fetch('http://localhost:3000/api/fleet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...metrics, ...data.updatedMetrics })
        });
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I had trouble with that. Can you try again?' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'rigby', label: 'Rigby', icon: Home },
    { id: 'load-optimizer', label: 'Load Optimizer', icon: TrendingUp },
    { id: 'tms', label: 'TMS', icon: Database },
    { id: 'broker-intelligence', label: 'Broker Intelligence', icon: BarChart3 },
    { id: 'broker-outreach', label: 'Broker Outreach', icon: Mail },
    { id: 'education', label: 'Education', icon: GraduationCap },
  ];

  const calculateFinancials = () => {
    const totalExpenses = metrics.fuelCost + metrics.insurance + metrics.maintenance + metrics.otherExpenses;
    const cpm = metrics.milesPerMonth > 0 ? totalExpenses / metrics.milesPerMonth : 0;
    const estimatedRevenue = metrics.loadsPerMonth * 2500;
    const rpm = metrics.milesPerMonth > 0 ? estimatedRevenue / metrics.milesPerMonth : 0;
    const profitPerMile = rpm - cpm;
    return { cpm, rpm, profitPerMile };
  };

  const financials = calculateFinancials();

  // Full-width views for Broker Intelligence and Broker Outreach
  if (activeTab === 'broker-intelligence' || activeTab === 'broker-outreach') {
    return (
      <div style={{ 
        display: 'flex', 
        height: '100vh', 
        width: '100vw',
        backgroundColor: '#f8fafc',
        position: 'fixed',
        top: 0,
        left: 0,
        overflow: 'hidden'
      }}>
        {/* Sidebar */}
        <div style={{ 
          width: '240px', 
          backgroundColor: 'white', 
          borderRight: '1px solid #e5e7eb', 
          display: 'flex', 
          flexDirection: 'column',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0
        }}>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 30L50 10L50 50L20 70L20 30Z" fill="url(#gradient1)" />
                <path d="M50 10L80 30L80 70L50 50L50 10Z" fill="url(#gradient2)" />
                <defs>
                  <linearGradient id="gradient1" x1="20" y1="10" x2="50" y2="70" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3b82f6" />
                    <stop offset="1" stopColor="#60a5fa" />
                  </linearGradient>
                  <linearGradient id="gradient2" x1="50" y1="10" x2="80" y2="70" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#60a5fa" />
                    <stop offset="1" stopColor="#93c5fd" />
                  </linearGradient>
                </defs>
              </svg>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', lineHeight: '1.2' }}>Fleet1.AI</div>
                <div style={{ fontSize: '9px', color: '#6b7280', letterSpacing: '0.02em' }}>Autonomous Fleet Intelligence</div>
              </div>
            </div>
          </div>
          
          <nav style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: isActive ? '#f3f4f6' : 'transparent',
                    color: isActive ? '#111827' : '#6b7280',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    width: '100%',
                    textAlign: 'left'
                  }}
                >
                  <Icon size={20} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div style={{ 
          marginLeft: '240px',
          flex: 1,
          height: '100vh',
          overflow: 'auto'
        }}>
          {activeTab === 'broker-intelligence' && <BrokerIntelligenceDashboard />}
          {activeTab === 'broker-outreach' && <BrokerOutreachDashboard />}
        </div>
      </div>
    );
  }

  // Rigby view with 3-panel layout
  if (activeTab === 'rigby') {
    return (
      <div style={{ 
        display: 'flex', 
        height: '100vh',
        width: '100vw',
        backgroundColor: '#f8fafc',
        position: 'fixed',
        top: 0,
        left: 0,
        overflow: 'hidden'
      }}>
        {/* Sidebar */}
        <div style={{ 
          width: '240px', 
          backgroundColor: 'white', 
          borderRight: '1px solid #e5e7eb', 
          display: 'flex', 
          flexDirection: 'column',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0
        }}>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 30L50 10L50 50L20 70L20 30Z" fill="url(#gradient1)" />
                <path d="M50 10L80 30L80 70L50 50L50 10Z" fill="url(#gradient2)" />
                <defs>
                  <linearGradient id="gradient1" x1="20" y1="10" x2="50" y2="70" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3b82f6" />
                    <stop offset="1" stopColor="#60a5fa" />
                  </linearGradient>
                  <linearGradient id="gradient2" x1="50" y1="10" x2="80" y2="70" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#60a5fa" />
                    <stop offset="1" stopColor="#93c5fd" />
                  </linearGradient>
                </defs>
              </svg>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', lineHeight: '1.2' }}>Fleet1.AI</div>
                <div style={{ fontSize: '9px', color: '#6b7280', letterSpacing: '0.02em' }}>Autonomous Fleet Intelligence</div>
              </div>
            </div>
          </div>
          
          <nav style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: isActive ? '#f3f4f6' : 'transparent',
                    color: isActive ? '#111827' : '#6b7280',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    width: '100%',
                    textAlign: 'left'
                  }}
                >
                  <Icon size={20} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        
        {/* Center Content */}
        <div style={{ 
          marginLeft: '240px',
          marginRight: '320px',
          flex: 1,
          height: '100vh',
          overflowY: 'auto',
          padding: '48px 64px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#111827', marginBottom: '12px' }}>
              Rigby – Fleet Advisor
            </h1>
            <p style={{ fontSize: '18px', color: '#6b7280' }}>
              Your fleet's financial co-pilot — built to make every mile count.
            </p>
          </div>

          <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <div style={{ width: '64px', height: '64px', backgroundColor: '#dbeafe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={28} color="#2563eb" />
                </div>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', textAlign: 'center', marginBottom: '8px' }}>
                Fleet Profile
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center', marginBottom: '16px' }}>
                Track your trucks and drivers
              </p>
              <div style={{ fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#6b7280' }}>Trucks:</span>
                  <span style={{ fontWeight: '500', color: '#111827' }}>{metrics.trucks}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#6b7280' }}>Drivers:</span>
                  <span style={{ fontWeight: '500', color: '#111827' }}>{metrics.drivers}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Loads/Month:</span>
                  <span style={{ fontWeight: '500', color: '#111827' }}>{metrics.loadsPerMonth}</span>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <div style={{ width: '64px', height: '64px', backgroundColor: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileCheck size={28} color="#16a34a" />
                </div>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', textAlign: 'center', marginBottom: '8px' }}>
                Financial Snapshot
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center', marginBottom: '16px' }}>
                Your profitability metrics
              </p>
              <div style={{ fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#6b7280' }}>CPM:</span>
                  <span style={{ fontWeight: '500', color: '#111827' }}>${financials.cpm.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#6b7280' }}>RPM:</span>
                  <span style={{ fontWeight: '500', color: '#111827' }}>${financials.rpm.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Profit/Mile:</span>
                  <span style={{ fontWeight: '500', color: financials.profitPerMile > 0 ? '#16a34a' : '#111827' }}>
                    ${financials.profitPerMile.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <div style={{ width: '64px', height: '64px', backgroundColor: '#f3e8ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={28} color="#9333ea" />
                </div>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', textAlign: 'center', marginBottom: '8px' }}>
                Upload Documents
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center', marginBottom: '16px' }}>
                Rate cons, fuel receipts, expenses
              </p>
              <button style={{
                width: '100%',
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer'
              }}>
                Choose Files
              </button>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <div style={{ 
          width: '320px', 
          backgroundColor: 'white', 
          borderLeft: '1px solid #e5e7eb', 
          display: 'flex', 
          flexDirection: 'column',
          height: '100vh',
          position: 'fixed',
          right: 0,
          top: 0
        }}>
          <div style={{ padding: '24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827' }}>Chat with Rigby</h2>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
              <MoreVertical size={20} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  backgroundColor: msg.role === 'user' ? '#2563eb' : '#f3f4f6',
                  color: msg.role === 'user' ? 'white' : '#111827',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: '24px', borderTop: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: '12px', padding: '12px 16px' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type a message..."
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  color: '#111827'
                }}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: loading || !input.trim() ? '#d1d5db' : '#2563eb',
                  marginLeft: '8px'
                }}
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Other tabs (Load Optimizer, TMS, Education)
  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh',
      width: '100vw',
      backgroundColor: '#f8fafc',
      position: 'fixed',
      top: 0,
      left: 0,
      overflow: 'hidden'
    }}>
      {/* Sidebar */}
      <div style={{ 
        width: '240px', 
        backgroundColor: 'white', 
        borderRight: '1px solid #e5e7eb', 
        display: 'flex', 
        flexDirection: 'column',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0
      }}>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 30L50 10L50 50L20 70L20 30Z" fill="url(#gradient1)" />
              <path d="M50 10L80 30L80 70L50 50L50 10Z" fill="url(#gradient2)" />
              <defs>
                <linearGradient id="gradient1" x1="20" y1="10" x2="50" y2="70" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#3b82f6" />
                  <stop offset="1" stopColor="#60a5fa" />
                </linearGradient>
                <linearGradient id="gradient2" x1="50" y1="10" x2="80" y2="70" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#60a5fa" />
                  <stop offset="1" stopColor="#93c5fd" />
                </linearGradient>
              </defs>
            </svg>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', lineHeight: '1.2' }}>Fleet1.AI</div>
              <div style={{ fontSize: '9px', color: '#6b7280', letterSpacing: '0.02em' }}>Autonomous Fleet Intelligence</div>
            </div>
          </div>
        </div>
        
        <nav style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: isActive ? '#f3f4f6' : 'transparent',
                  color: isActive ? '#111827' : '#6b7280',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  width: '100%',
                  textAlign: 'left'
                }}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      
      <div style={{ 
        marginLeft: '240px',
        flex: 1,
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '8px', textTransform: 'capitalize' }}>
            {activeTab.replace('-', ' ')}
          </h2>
          <p style={{ color: '#6b7280' }}>Coming soon...</p>
        </div>
      </div>
    </div>
  );
}