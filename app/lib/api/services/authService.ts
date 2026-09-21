import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/app/lib/firebase";
import { getCurrentUserProfile, saveUserProfile } from "@/app/lib/firebaseData";
import { User, AuthResponse } from '@/app/type';

export interface LoginCredentials {
  email: string;
  password: string;
}

interface RegistrationData extends LoginCredentials {
  displayName?: string;
  examCategory?: User["examCategory"];
  specialization?: User["specialization"];
}

/** Step 1 of admin sign-in: sends OTP to email (no token yet). */
export interface AdminLoginInitResponse {
  message?: string;
}

const firebaseAuthMessages: Record<string, string> = {
  "auth/invalid-credential": "The email or password is incorrect. Please check your details and try again.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/user-disabled": "This account has been disabled. Please contact support.",
  "auth/user-not-found": "We could not find an account with that email address.",
  "auth/wrong-password": "The email or password is incorrect. Please check your details and try again.",
  "auth/email-already-in-use": "This email is already registered. Please log in instead.",
  "auth/weak-password": "Your password is too weak. Please use at least 6 characters.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/network-request-failed": "We could not connect to the service. Please check your internet connection and try again.",
};

function friendlyAuthError(error: unknown, fallback: string): Error {
  const errorCode = typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : error instanceof Error
      ? error.message.match(/auth\/[\w-]+/)?.[0]
      : undefined;
  const message = errorCode ? firebaseAuthMessages[errorCode] : undefined;

  if (message) return new Error(message);
  if (error instanceof Error && !error.message.startsWith("Firebase: Error (auth/")) {
    return error;
  }
  return new Error(fallback);
}

async function responseForCurrentUser(): Promise<AuthResponse> {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) throw new Error("Authentication failed.");
  return {
    accessToken: await firebaseUser.getIdToken(),
    user: await getCurrentUserProfile(),
  };
}

export const authService = {
  async register(data: RegistrationData): Promise<AuthResponse> {
    try {
      const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      if (data.displayName) await updateProfile(credential.user, { displayName: data.displayName });
      await saveUserProfile(credential.user.uid, {
        email: credential.user.email ?? data.email,
        displayName: credential.user.displayName ?? data.displayName ?? null,
        examCategory: data.examCategory ?? "senior",
        specialization: data.specialization ?? "general",
        credits: 0,
        totalCreditsEarned: 0,
        emailVerified: credential.user.emailVerified,
        createdAt: new Date().toISOString(),
      });
      await sendEmailVerification(credential.user);
      return responseForCurrentUser();
    } catch (error) {
      throw friendlyAuthError(error, "We could not create your account. Please try again.");
    }
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      return responseForCurrentUser();
    } catch (error) {
      throw friendlyAuthError(error, "We could not sign you in. Please try again.");
    }
  },

  async adminLogin(credentials: LoginCredentials): Promise<AdminLoginInitResponse> {
    try {
      await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      return { message: "Signed in with Firebase. Redirecting to the admin dashboard." };
    } catch (error) {
      throw friendlyAuthError(error, "We could not sign you in. Please try again.");
    }
  },

  async adminVerifyLoginOtp(body: { email: string; otp: string }): Promise<AuthResponse> {
    if (!auth.currentUser || auth.currentUser.email !== body.email) {
      throw new Error("Your Firebase session has expired. Please sign in again.");
    }
    return responseForCurrentUser();
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },

  async getCurrentUser(): Promise<User> {
    return getCurrentUserProfile();
  },

  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      if (typeof window === "undefined") {
        await sendPasswordResetEmail(auth, email);
      } else {
        await sendPasswordResetEmail(auth, email, {
          url: `${window.location.origin}/reset-password`,
          handleCodeInApp: false,
        });
      }
    } catch (error) {
      throw friendlyAuthError(error, "We could not send the password reset email. Please try again.");
    }
  },

  async verifyPasswordResetCode(code: string): Promise<string> {
    try {
      return await verifyPasswordResetCode(auth, code);
    } catch (error) {
      throw friendlyAuthError(error, "This password reset link is invalid or has expired.");
    }
  },

  async confirmPasswordReset(code: string, newPassword: string): Promise<void> {
    try {
      await confirmPasswordReset(auth, code, newPassword);
    } catch (error) {
      throw friendlyAuthError(error, "We could not reset your password. Please request a new link.");
    }
  },

  async verifyEmail(email: string, otp: string): Promise<void> {
    if (!auth.currentUser || auth.currentUser.email !== email) throw new Error("Authentication session not found.");
    if (otp.trim().length === 0) throw new Error("Enter the verification code.");
    await auth.currentUser.reload();
    if (!auth.currentUser.emailVerified) throw new Error("Use the verification link sent to your email.");
  },

  async sendVerificationOtp(email: string): Promise<void> {
    if (!auth.currentUser || auth.currentUser.email !== email) throw new Error("Authentication session not found.");
    try {
      await sendEmailVerification(auth.currentUser);
    } catch (error) {
      throw friendlyAuthError(error, "We could not send the verification email. Please try again.");
    }
  }
};