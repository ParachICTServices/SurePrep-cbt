import { apiClient } from '../apiClient';
import { User, AuthResponse } from '@/app/type'; 

export interface LoginCredentials {
  email: string;
  password: string;
}

export const authService = {
  async register(data: any): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response;
  },

  // Login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response;
  },

  async logout(): Promise<void> {
    if (typeof apiClient.clearToken === 'function') {
      apiClient.clearToken();
    }
    return Promise.resolve();
  },

  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/auth/me');
  },

  async sendPasswordResetEmail(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  },

  async verifyEmail(email: string, otp: string): Promise<void> {
    await apiClient.post('/auth/verify-email', { email, otp });
  },

  async sendVerificationOtp(email: string): Promise<void> {
    await apiClient.post('/auth/send-verification-otp', { email });
  }
};