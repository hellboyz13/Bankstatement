export type PlanType = 'free' | 'premium';

export interface User {
  id: string;
  email: string;
  password?: string;
  plan: PlanType;
  uploadCount: number;
  createdAt: string;
  lastLogin: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  signupWithGoogle: () => Promise<void>;
  signupWithGooglePremium: () => Promise<void>;
  logout: () => void;
  upgradeToPremium: () => void;
  incrementUploadCount: () => void;
}
