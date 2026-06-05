export interface SupplyItem {
  id: string;
  name: string;
  category: string;
  estimatedCost: number;
  actualCost: number;
  purchased: boolean;
  addedBy: string;
  createdAt: number;
  approvals?: string[]; // user nicknames who gave a thumbs-up approval
  storeUrl?: string; // product page or direct purchasing link
}

export type GradeLevel = 'kindergarten' | 'elementary' | 'middle' | 'high_school' | 'college' | 'general';

export interface BudgetRoom {
  id: string;
  name: string;
  totalBudget: number;
  gradeLevel: GradeLevel;
  categoryLimits: Record<string, number>;
  items: SupplyItem[];
  members: string[]; // member nicknames active in the last active interval
}

export interface AISuggestion {
  name: string;
  category: string;
  estimatedCost: number;
  reason: string;
  storeUrl?: string;
}

export interface AIRecResponse {
  suggestions: AISuggestion[];
  savingsTips: string[];
}
