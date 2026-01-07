  export enum HealthCategory {
    TEETH = 'Teeth & Gums',
    EYES = 'Eyes',
    SKIN = 'Skin & Coat',
    GAIT = 'Gait & Movement',
    OTHER = 'General'
  }

  export interface AnalysisResult {
    severity: string;
    title: string;
    observations: string[];
    possibleCauses: string[];
    vetWillExamine: string[];
    questionsToAsk: string[];
    urgency: string;
    nextSteps: string;
    disclaimer: string;
    financialForecast: string;
  }

  export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    image?: string; // Base64 string for uploaded quotes or symptoms
    isThinking?: boolean;
    timestamp: number;
  }

  export interface AppState {
    view: 'home' | 'analysis' | 'chat' | 'dashboard';
    selectedCategory?: HealthCategory;
  }