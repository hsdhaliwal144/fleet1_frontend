import React, { useState, useEffect } from 'react';
import { apiEndpoints } from '../config';

interface OutreachDraft {
  id: number;
  brokerName: string;
  recipientEmail: string;
  subject: string;
  body: string;
  emailType: string;
  reasoning: string;
  status: string;
  createdAt: string;
  sentAt?: string;
  repliedAt?: string;
  gmailMessageId?: string;
}

interface OutreachStats {
  totalDrafts: number;
  totalSent: number;
  totalReplied: number;
  replyRate: string;
}

interface BrokerIntel {
  broker: string;
  totalLoads: number;
  avgRatePerMile: number;
  topLanes: string[];
  relationshipScore: number;
}

interface GroupedBroker {
  name: string;
  email: string;
  drafts: OutreachDraft[];
  intel?: BrokerIntel;
}

export const BrokerOutreachDashboard: React.FC = () => {
  const [drafts, setDrafts] = useState<OutreachDraft[]>([]);
  const [brokerIntel, setBrokerIntel] = useState<BrokerIntel[]>([]);
  const [stats, setStats] = useState<OutreachStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState<number | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<OutreachDraft | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [expandedBrokers, setExpandedBrokers] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchDrafts();
    fetchStats();
    fetchBrokerIntel();
  }, []);

  const fetchDrafts = async () => {
    setLoading(true);
    try {
      const response = await fetch(apiEndpoints.brokerOutreach.drafts());
      const data = await response.json();
      if (data.success) {
        setDrafts(data.drafts);
      }
    } catch (error) {
      console.error('Error fetching drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(apiEndpoints.brokerOutreach.stats);
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchBrokerIntel = async () => {
    try {
      const response = await fetch(apiEndpoints.brokerIntelligence.brokers);
      const data = await response.json();
      if (data.success) {
        setBrokerIntel(data.brokers);
      }
    } catch (error) {
      console.error('Error fetching broker intel:', error);
    }
  };

  const generateBatchEmails = async () => {
    if (!confirm('Generate AI emails for top 5 brokers?')) return;

    setGenerating(true);
    try {
      const response = await fetch(apiEndpoints.brokerOutreach.generateBatch, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 5 })
      });
      
      const data = await response.json();
      if (data.success) {
        alert(`✅ Generated ${data.count} emails!`);
        fetchDrafts();
        fetchStats();
      }
    } catch (error) {
      console.error('Error generating emails:', error);
      alert('❌ Failed to generate emails');
    } finally {
      setGenerating(false);
    }
  };

  const viewDraft = (draft: OutreachDraft) => {
    setSelectedDraft(draft);
    setEditedSubject(draft.subject);
    setEditedBody(draft.body);
    setEditMode(false);
    setShowModal(true);
  };

  const saveEdits = async () => {
    if (!selectedDraft) return;

    try {
      const response = await fetch(apiEndpoints.brokerOutreach.updateDraft(selectedDraft.id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: editedSubject,
          body: editedBody
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Email updated!');
        setEditMode(false);
        fetchDrafts();
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error saving edits:', error);
      alert('❌ Failed to save edits');
    }
  };

  const approveAndSend = async (id: number) => {
    setSending(id);
    try {
      await fetch(apiEndpoints.brokerOutreach.updateDraft(id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' })
      });

      const response = await fetch(apiEndpoints.brokerOutreach.sendDraft(id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Email sent successfully!');
        fetchDrafts();
        fetchStats();
        setShowModal(false);
      } else {
        alert(`❌ Failed to send: ${data.error}`);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('❌ Failed to send email');
    } finally {
      setSending(null);
    }
  };

  const toggleBrokerExpand = (brokerName: string) => {
    const newExpanded = new Set(expandedBrokers);
    if (newExpanded.has(brokerName)) {
      newExpanded.delete(brokerName);
    } else {
      newExpanded.add(brokerName);
    }
    setExpandedBrokers(newExpanded);
  };

  const groupDraftsByBroker = (): GroupedBroker[] => {
    const grouped = new Map<string, GroupedBroker>();

    drafts.forEach(draft => {
      if (!grouped.has(draft.brokerName)) {
        const intel = brokerIntel.find(b => b.broker === draft.brokerName);
        grouped.set(draft.brokerName, {
          name: draft.brokerName,
          email: draft.recipientEmail,
          drafts: [],
          intel
        });
      }
      grouped.get(draft.brokerName)!.drafts.push(draft);
    });

    return Array.from(grouped.values()).sort((a, b) => {
      const aScore = a.intel?.relationshipScore || 0;
      const bScore = b.intel?.relationshipScore || 0;
      return bScore - aScore;
    });
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: 'bg-gray-50 text-gray-700',
      approved: 'bg-green-50 text-green-700',
      sent: 'bg-blue-50 text-blue-700',
      replied: 'bg-purple-50 text-purple-700',
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const groupedBrokers = groupDraftsByBroker();

  return (
    <div style={{ padding: '32px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            📧 Broker Outreach Dashboard
          </h1>
          <button
            onClick={generateBatchEmails}
            disabled={generating}
            style={{
              padding: '12px 24px',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: generating ? 'not-allowed' : 'pointer',
              opacity: generating ? 0.5 : 1
            }}
          >
            {generating ? '⏳ Generating...' : '🤖 Generate AI Emails'}
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Total Drafts</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#111827' }}>{stats.totalDrafts}</div>
            </div>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Sent</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#2563eb' }}>{stats.totalSent}</div>
            </div>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Replied</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#16a34a' }}>{stats.totalReplied}</div>
            </div>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Reply Rate</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#9333ea' }}>{stats.replyRate}</div>
            </div>
          </div>
        )}
      </div>

      {/* Broker Groups */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Loading drafts...</div>
      ) : groupedBrokers.length === 0 ? (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '48px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>No drafts yet. Click "Generate AI Emails" to start!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {groupedBrokers.map(broker => (
            <div key={broker.name} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              {/* Broker Header */}
              <div 
                onClick={() => toggleBrokerExpand(broker.name)}
                style={{
                  padding: '20px 24px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#f9fafb',
                  borderBottom: expandedBrokers.has(broker.name) ? '1px solid #e5e7eb' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ fontSize: '20px' }}>{expandedBrokers.has(broker.name) ? '▼' : '▶'}</div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>{broker.name}</div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>{broker.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  {broker.intel && (
                    <>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Relationship</div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{broker.intel.relationshipScore}/100</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Loads</div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{broker.intel.totalLoads}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Rate</div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#16a34a' }}>${broker.intel.avgRatePerMile.toFixed(2)}/mi</div>
                      </div>
                    </>
                  )}
                  <div style={{
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {broker.drafts.length} {broker.drafts.length === 1 ? 'draft' : 'drafts'}
                  </div>
                </div>
              </div>

              {/* Drafts List */}
              {expandedBrokers.has(broker.name) && (
                <div style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {broker.drafts.map(draft => (
                      <div
                        key={draft.id}
                        onClick={() => viewDraft(draft)}
                        style={{
                          padding: '16px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          border: '1px solid #f3f4f6',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f3f4f6';
                          e.currentTarget.style.borderColor = '#e5e7eb';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                          e.currentTarget.style.borderColor = '#f3f4f6';
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                              {draft.subject}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              {draft.emailType} • {new Date(draft.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            fontSize: '11px',
                            fontWeight: '500',
                            borderRadius: '12px'
                          }} className={getStatusBadge(draft.status)}>
                            {draft.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic', lineHeight: '1.5' }}>
                          {draft.reasoning.substring(0, 120)}...
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Draft Modal */}
      {showModal && selectedDraft && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }} onClick={() => setShowModal(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ padding: '32px' }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'start',
                justifyContent: 'space-between',
                marginBottom: '24px',
                paddingBottom: '24px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}>
                    {selectedDraft.brokerName}
                  </h2>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
                    {selectedDraft.recipientEmail}
                  </p>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    fontSize: '11px',
                    fontWeight: '500',
                    borderRadius: '12px'
                  }} className={getStatusBadge(selectedDraft.status)}>
                    {selectedDraft.status}
                  </span>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    fontSize: '32px',
                    color: '#9ca3af',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    lineHeight: '1'
                  }}
                >
                  ×
                </button>
              </div>

              {/* AI Reasoning */}
              <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px'
              }}>
                <p style={{ fontSize: '13px', color: '#1e40af', lineHeight: '1.6' }}>
                  <strong style={{ fontWeight: '600' }}>🎯 Why this email:</strong> {selectedDraft.reasoning}
                </p>
              </div>

              {/* Email Content */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  Subject:
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={editedSubject}
                    onChange={(e) => setEditedSubject(e.target.value)}
                    style={{
                      width: '100%',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      fontSize: '14px'
                    }}
                  />
                ) : (
                  <div style={{
                    backgroundColor: '#f9fafb',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px',
                    color: '#111827',
                    fontWeight: '500'
                  }}>
                    {selectedDraft.subject}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  Message:
                </label>
                {editMode ? (
                  <textarea
                    value={editedBody}
                    onChange={(e) => setEditedBody(e.target.value)}
                    rows={16}
                    style={{
                      width: '100%',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      fontSize: '13px',
                      fontFamily: 'monospace',
                      lineHeight: '1.6'
                    }}
                  />
                ) : (
                  <div style={{
                    whiteSpace: 'pre-wrap',
                    backgroundColor: '#f9fafb',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '13px',
                    color: '#374151',
                    fontFamily: 'monospace',
                    lineHeight: '1.6',
                    minHeight: '400px'
                  }}>
                    {selectedDraft.body}
                  </div>
                )}
              </div>

              {selectedDraft.sentAt && (
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '24px'
                }}>
                  <p style={{ fontSize: '13px', color: '#15803d', fontWeight: '500' }}>
                    ✅ Sent on {new Date(selectedDraft.sentAt).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                paddingTop: '24px',
                borderTop: '1px solid #e5e7eb'
              }}>
                {editMode ? (
                  <>
                    <button
                      onClick={() => {
                        setEditMode(false);
                        setEditedSubject(selectedDraft.subject);
                        setEditedBody(selectedDraft.body);
                      }}
                      style={{
                        padding: '10px 20px',
                        border: '1px solid #d1d5db',
                        color: '#374151',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        backgroundColor: 'white'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveEdits}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      💾 Save Changes
                    </button>
                  </>
                ) : (
                  <>
                    {selectedDraft.status !== 'sent' && (
                      <button
                        onClick={() => setEditMode(true)}
                        style={{
                          padding: '10px 20px',
                          border: '1px solid #d1d5db',
                          color: '#374151',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          backgroundColor: 'white'
                        }}
                      >
                        ✏️ Edit
                      </button>
                    )}
                    <button
                      onClick={() => approveAndSend(selectedDraft.id)}
                      disabled={sending === selectedDraft.id}
                      style={{
                        padding: '10px 24px',
                        backgroundColor: '#16a34a',
                        color: 'white',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: sending === selectedDraft.id ? 'not-allowed' : 'pointer',
                        opacity: sending === selectedDraft.id ? 0.5 : 1
                      }}
                    >
                      {sending === selectedDraft.id ? '⏳ Sending...' : selectedDraft.status === 'sent' ? '🔄 Send Again' : '✅ Approve & Send'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .bg-gray-50 { background-color: #f9fafb; }
        .text-gray-700 { color: #374151; }
        .bg-green-50 { background-color: #f0fdf4; }
        .text-green-700 { color: #15803d; }
        .bg-blue-50 { background-color: #eff6ff; }
        .text-blue-700 { color: #1d4ed8; }
        .bg-purple-50 { background-color: #faf5ff; }
        .text-purple-700 { color: #7e22ce; }
      `}</style>
    </div>
  );
};

export default BrokerOutreachDashboard;