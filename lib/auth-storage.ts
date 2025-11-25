import { User } from './auth-types';

declare global {
  var localUsers: User[] | undefined;
  var currentUser: User | null | undefined;
}

// Initialize if not exists
if (typeof global !== 'undefined') {
  if (!global.localUsers) {
    global.localUsers = [];
  }
}

export function createUser(email: string, password: string, plan: 'free' | 'premium' = 'free'): User {
  const user: User = {
    id: `user_${Date.now()}`,
    email,
    password, // In production, this should be hashed
    plan,
    uploadCount: 0,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };

  if (!global.localUsers) {
    global.localUsers = [];
  }

  global.localUsers.push(user);
  return user;
}

export function findUserByEmail(email: string): User | undefined {
  if (!global.localUsers) {
    global.localUsers = [];
  }
  return global.localUsers.find((u) => u.email === email);
}

export function authenticateUser(email: string, password: string): User | null {
  const user = findUserByEmail(email);
  if (user && user.password === password) {
    user.lastLogin = new Date().toISOString();
    return user;
  }
  return null;
}

export function updateUser(userId: string, updates: Partial<User>): User | null {
  if (!global.localUsers) {
    global.localUsers = [];
  }

  const userIndex = global.localUsers.findIndex((u) => u.id === userId);
  if (userIndex !== -1) {
    global.localUsers[userIndex] = {
      ...global.localUsers[userIndex],
      ...updates,
      id: global.localUsers[userIndex].id, // Never update ID
    };
    return global.localUsers[userIndex];
  }
  return null;
}

export function setCurrentUser(user: User | null): void {
  global.currentUser = user;
}

export function getCurrentUser(): User | null {
  return global.currentUser || null;
}

export function clearAuth(): void {
  global.currentUser = null;
}
