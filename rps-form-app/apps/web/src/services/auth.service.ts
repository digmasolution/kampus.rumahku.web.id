import api from './api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'DOSEN' | 'USER';
  avatar?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: UserProfile;
  token: string;
}

const AUTH_USER_KEY = 'dk_auth_user';
const AUTH_TOKEN_KEY = 'dk_auth_token';

export const authService = {
  async login(email: string, password: string): Promise<UserProfile> {
    const res = await api.post<LoginResponse>('/auth/login', { email, password });
    if (res.data.success && res.data.user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(res.data.user));
      localStorage.setItem(AUTH_TOKEN_KEY, res.data.token);
      return res.data.user;
    }
    throw new Error(res.data.message || 'Login gagal');
  },

  getCurrentUser(): UserProfile | null {
    try {
      const data = localStorage.getItem(AUTH_USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  logout(): void {
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem(AUTH_USER_KEY);
  },

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'ADMIN';
  },
};
