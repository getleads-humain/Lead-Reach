import { create } from 'zustand';
import type { ViewType, AgentInfo, Notification, AgentName, UserProfile, PortfolioItem } from './types';
import { AGENT_DEFINITIONS, EMPTY_USER_PROFILE } from './types';

interface AppState {
  activeView: ViewType;
  selectedCampaignId: string | null;
  selectedLeadId: string | null;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  agentStatuses: Record<AgentName, AgentInfo>;
  notifications: Notification[];
  userProfile: UserProfile;

  setActiveView: (view: ViewType) => void;
  setSelectedCampaignId: (id: string | null) => void;
  setSelectedLeadId: (id: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  updateAgentStatus: (name: AgentName, update: Partial<AgentInfo>) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  setUserProfile: (profile: Partial<UserProfile>) => void;
  addPortfolioItem: (item: PortfolioItem) => void;
  removePortfolioItem: (id: string) => void;
  updatePortfolioItem: (id: string, update: Partial<PortfolioItem>) => void;
}

const initialAgentStatuses: Record<AgentName, AgentInfo> = Object.fromEntries(
  AGENT_DEFINITIONS.map((def) => [
    def.name,
    {
      ...def,
      status: 'idle' as const,
      tasksCompleted: 0,
      tasksInProgress: 0,
      tasksFailed: 0,
      currentTask: null,
      lastActivity: null,
    },
  ])
) as Record<AgentName, AgentInfo>;

export const useAppStore = create<AppState>((set) => ({
  activeView: 'dashboard',
  selectedCampaignId: null,
  selectedLeadId: null,
  sidebarOpen: true,
  sidebarCollapsed: false,
  agentStatuses: initialAgentStatuses,
  notifications: [],
  userProfile: EMPTY_USER_PROFILE,

  setActiveView: (view) => set({ activeView: view }),
  setSelectedCampaignId: (id) => set({ selectedCampaignId: id }),
  setSelectedLeadId: (id) => set({ selectedLeadId: id }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  updateAgentStatus: (name, update) =>
    set((state) => ({
      agentStatuses: {
        ...state.agentStatuses,
        [name]: { ...state.agentStatuses[name], ...update },
      },
    })),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        {
          ...notification,
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toISOString(),
          read: false,
        },
        ...state.notifications,
      ],
    })),
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  clearNotifications: () => set({ notifications: [] }),
  setUserProfile: (profile) =>
    set((state) => ({
      userProfile: { ...state.userProfile, ...profile },
    })),
  addPortfolioItem: (item) =>
    set((state) => ({
      userProfile: {
        ...state.userProfile,
        portfolioItems: [...state.userProfile.portfolioItems, item],
      },
    })),
  removePortfolioItem: (id) =>
    set((state) => ({
      userProfile: {
        ...state.userProfile,
        portfolioItems: state.userProfile.portfolioItems.filter((i) => i.id !== id),
      },
    })),
  updatePortfolioItem: (id, update) =>
    set((state) => ({
      userProfile: {
        ...state.userProfile,
        portfolioItems: state.userProfile.portfolioItems.map((i) =>
          i.id === id ? { ...i, ...update } : i
        ),
      },
    })),
}));
