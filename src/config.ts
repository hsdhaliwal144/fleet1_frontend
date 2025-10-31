// API configuration based on environment
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiEndpoints = {
  // Fleet endpoints
  fleet: `${API_URL}/api/fleet`,
  rigbyChat: `${API_URL}/api/rigby/chat`,
  
  // Broker Intelligence endpoints
  brokerIntelligence: {
    stats: `${API_URL}/api/broker-intelligence/stats`,
    priorityLoads: (minScore: number = 70) => `${API_URL}/api/broker-intelligence/priority-loads?minScore=${minScore}`,
    brokers: `${API_URL}/api/broker-intelligence/brokers`,
    brokerLoads: (broker: string) => `${API_URL}/api/broker-intelligence/brokers/${encodeURIComponent(broker)}/loads`,
  },
  
  // Broker Outreach endpoints
  brokerOutreach: {
  drafts: (status: string = '') => `${API_URL}/api/outreach/drafts${status ? `?status=${status}` : ''}`,
  stats: `${API_URL}/api/outreach/stats`,
  generateBatch: `${API_URL}/api/outreach/generate-batch`,
  updateDraft: (id: number) => `${API_URL}/api/outreach/drafts/${id}`,
  sendDraft: (id: number) => `${API_URL}/api/outreach/send/${id}`,
  deleteDraft: (id: number) => `${API_URL}/api/outreach/drafts/${id}`,
}
} as const;