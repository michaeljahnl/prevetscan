export enum HealthCategory {
  TEETH = 'Teeth & Gums',
  EYES = 'Eyes',
  SKIN = 'Skin & Coat',
  GAIT = 'Gait & Movement',
  OTHER = 'General'
}

export interface AnalysisResult {
  severity: 'Low' | 'Moderate' | 'High' | 'Critical' | 'Healthy';
  title: string;
  observations: string[];
  recommendation: string;
  disclaimer: string;
  financialForecast: string; // New field for cost-saving estimation
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
  view: 'home' | 'analysis' | 'chat';
  selectedCategory?: HealthCategory;
}