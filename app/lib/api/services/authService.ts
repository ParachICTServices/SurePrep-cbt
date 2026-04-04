import { apiClient } from '../apiClient';
import { User, AuthResponse } from '@/app/type'; 

export interface LoginCredentials {
  email: string;
  password: string;
}

/** Step 1 of admin sign-in: sends OTP to email (no token yet). */
export interface AdminLoginInitResponse {
  message?: string;
}

function normalizeAuthResponse(raw: AuthResponse): AuthResponse {
  const accessToken = raw.accessToken ?? raw.token ?? '';
  return { ...raw, accessToken, user: raw.user };
}

export const authService = {
  async register(data: any): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return normalizeAuthResponse(response);
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return normalizeAuthResponse(response);
  },

  async adminLogin(credentials: LoginCredentials): Promise<AdminLoginInitResponse> {
    return apiClient.post<AdminLoginInitResponse>('/auth/admin/login', credentials);
  },

  async adminVerifyLoginOtp(body: { email: string; otp: string }): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      '/auth/admin/verify-login-otp',
      body
    );
    return normalizeAuthResponse(response);
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