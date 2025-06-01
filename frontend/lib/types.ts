export interface User {
  id: string;
  username: string;
  email?: string;
}

export interface Message {
  id: string;
  sender_id: string;
  sender_username: string;
  original_content: string;
  transformed_content: string;
  timestamp: string;
  is_mine: boolean;
  is_read: boolean;
}

export interface Conversation {
  id: string;
  other_user: {
    id: string;
    username: string;
  };
  last_message?: {
    content: string;
    timestamp: string;
    is_mine: boolean;
  };
  unread_count: number;
  my_agent_tone: AgentTone;
  my_custom_prompt?: string;
}

export enum AgentTone {
  SMARTER = "smarter",
  PROFESSIONAL = "professional",
  NICER = "nicer",
  MEANER = "meaner",
  SARCASM = "sarcasm",
  LOVING = "loving",
  ANGRY = "angry",
  CUSTOM = "custom"
}

export const AgentToneLabels: Record<AgentTone, string> = {
  [AgentTone.SMARTER]: "Smarter",
  [AgentTone.PROFESSIONAL]: "Professional",
  [AgentTone.NICER]: "Nicer",
  [AgentTone.MEANER]: "Meaner",
  [AgentTone.SARCASM]: "Sarcastic",
  [AgentTone.LOVING]: "Loving",
  [AgentTone.ANGRY]: "Angry",
  [AgentTone.CUSTOM]: "Custom"
}; 