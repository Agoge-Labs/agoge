import { create } from "zustand";
import type { SimulatedProposal, SimulatedActivity } from "@/lib/agents/agent-simulator";

// ----------------------------------------------------------------
// Intent Store
// ----------------------------------------------------------------

export interface UserIntent {
    id: string;
    inputToken: string;
    inputAmount: number;
    outputToken: string;
    outputTokenName: string;
    destinationChain: string;
    status: "pending" | "competing" | "assigned" | "fulfilled" | "cancelled" | "failed";
    proposals: SimulatedProposal[];
    selectedProposal?: SimulatedProposal;
    createdAt: number;
    txHash?: string;
}

interface AppState {
    // Intent state
    intents: UserIntent[];
    activeIntentId: string | null;
    addIntent: (intent: UserIntent) => void;
    updateIntent: (id: string, updates: Partial<UserIntent>) => void;
    setActiveIntent: (id: string | null) => void;

    // Activity feed
    activities: SimulatedActivity[];
    setActivities: (activities: SimulatedActivity[]) => void;
    addActivity: (activity: SimulatedActivity) => void;

    // UI state
    selectedCategory: string;
    setSelectedCategory: (category: string) => void;
    isAdvancedMode: boolean;
    toggleAdvancedMode: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    // Intents
    intents: [],
    activeIntentId: null,
    addIntent: (intent) =>
        set((state) => ({ intents: [intent, ...state.intents] })),
    updateIntent: (id, updates) =>
        set((state) => ({
            intents: state.intents.map((i) => (i.id === id ? { ...i, ...updates } : i)),
        })),
    setActiveIntent: (id) => set({ activeIntentId: id }),

    // Activity feed
    activities: [],
    setActivities: (activities) => set({ activities }),
    addActivity: (activity) =>
        set((state) => ({
            activities: [activity, ...state.activities].slice(0, 50),
        })),

    // UI state
    selectedCategory: "real-world-assets-rwa",
    setSelectedCategory: (category) => set({ selectedCategory: category }),
    isAdvancedMode: false,
    toggleAdvancedMode: () =>
        set((state) => ({ isAdvancedMode: !state.isAdvancedMode })),
}));
