"use client";

import React, { createContext, useEffect, useState } from "react";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  PhoneAuthProvider
} from "firebase/auth";
import { User } from "firebase/auth";
import { auth } from "../firebase/firebase";

// Test phone numbers for local development
const TEST_PHONE_NUMBERS = [
  "+1 650-555-1234",
  "+1 650-555-5678",
  "+16505551234",
  "+16505555678",
  // Add more test numbers as needed
];

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  
  // Phone authentication
  phoneNumber: string;
  setPhoneNumber: (phoneNumber: string) => void;
  verificationCode: string;
  setVerificationCode: (code: string) => void;
  verificationId: string;
  setVerificationId: (id: string) => void;
  phoneAuthError: string;
  setPhoneAuthError: (error: string) => void;
  phoneAuthStep: 'phone' | 'code' | 'complete';
  setPhoneAuthStep: (step: 'phone' | 'code' | 'complete') => void;
  phoneConfirmationResult: ConfirmationResult | null;
  
  // Phone auth methods
  sendVerificationCode: () => Promise<void>;
  verifyPhoneCode: () => Promise<void>;
  
  // Test mode helper
  isTestMode: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  
  // Phone authentication
  phoneNumber: "",
  setPhoneNumber: () => {},
  verificationCode: "",
  setVerificationCode: () => {},
  verificationId: "",
  setVerificationId: () => {},
  phoneAuthError: "",
  setPhoneAuthError: () => {},
  phoneAuthStep: 'phone',
  setPhoneAuthStep: () => {},
  phoneConfirmationResult: null,
  
  // Phone auth methods
  sendVerificationCode: async () => {},
  verifyPhoneCode: async () => {},
  
  // Test mode helper
  isTestMode: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Phone authentication state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [phoneAuthError, setPhoneAuthError] = useState("");
  const [phoneAuthStep, setPhoneAuthStep] = useState<'phone' | 'code' | 'complete'>('phone');
  const [phoneConfirmationResult, setPhoneConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [isTestMode, setIsTestMode] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  // Check if we're in test mode (localhost)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isLocalhost = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1';
      setIsTestMode(isLocalhost);
    }
  }, []);
  
  // Cleanup recaptcha when component unmounts
  useEffect(() => {
    return () => {
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
      }
    };
  }, [recaptchaVerifier]);
  
  // Initialize reCAPTCHA verifier
  const initRecaptcha = () => {
    if (recaptchaVerifier) {
      // Clear existing verifier first
      try {
        recaptchaVerifier.clear();
      } catch (error) {
        console.warn("Error clearing existing reCAPTCHA:", error);
      }
      setRecaptchaVerifier(null);
    }
    
    try {
      if (typeof window !== 'undefined') {
        // Make sure the container element exists
        const container = document.getElementById('recaptcha-container');
        if (!container) {
          setPhoneAuthError("reCAPTCHA container not found. Please try again.");
          return null;
        }
        
        // Clear any previous reCAPTCHA widgets
        container.innerHTML = '';
        
        // Create new verifier
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'normal',
          callback: () => {
            // reCAPTCHA solved, allow signInWithPhoneNumber
            console.log('reCAPTCHA verified');
          },
          'expired-callback': () => {
            // Response expired. Ask user to solve reCAPTCHA again
            setPhoneAuthError("reCAPTCHA has expired. Please refresh and try again.");
          }
        });
        
        verifier.render().then(() => {
          console.log('reCAPTCHA rendered');
        }).catch(error => {
          console.error('Error rendering reCAPTCHA:', error);
          setPhoneAuthError("Failed to render reCAPTCHA. Please refresh and try again.");
        });
        
        setRecaptchaVerifier(verifier);
        return verifier;
      }
    } catch (error) {
      console.error("Error initializing reCAPTCHA:", error);
      setPhoneAuthError("Error initializing reCAPTCHA. Please refresh and try again.");
      return null;
    }
    
    return null;
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Error signing in with Google", error);
    }
  };

  const signOutUser = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };
  
  // Helper function to check if a number is a test number
  const isTestPhoneNumber = (number: string) => {
    // Clean the phone number for comparison
    const cleanedNumber = number.replace(/\s+/g, '');
    return TEST_PHONE_NUMBERS.some(testNum => testNum.replace(/\s+/g, '') === cleanedNumber);
  };
  
  // Send SMS verification code
  const sendVerificationCode = async () => {
    try {
      setPhoneAuthError("");
      
      if (!phoneNumber) {
        setPhoneAuthError("Please enter a phone number");
        return;
      }
      
      const formattedPhoneNumber = phoneNumber.startsWith('+') 
        ? phoneNumber 
        : `+1${phoneNumber}`; // Default to US format if no country code
      
      // For test phone numbers in development
      if (isTestMode && isTestPhoneNumber(formattedPhoneNumber)) {
        console.log("Using test mode for phone:", formattedPhoneNumber);
        // Simulate confirmation result with a mock object
        setPhoneConfirmationResult({
          verificationId: "test-verification-id",
          confirm: async (code: string) => {
            // Accept any 6-digit code for test mode
            if (code.length === 6 && /^\d+$/.test(code)) {
              return { user: null } as any;
            } else {
              throw new Error("Invalid verification code");
            }
          }
        } as ConfirmationResult);
        setPhoneAuthStep('code');
        return;
      }
      
      // Regular phone authentication flow
      const verifier = initRecaptcha();
      if (!verifier) {
        setPhoneAuthError("reCAPTCHA initialization failed. Please refresh and try again.");
        return;
      }
      
      try {
        const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, verifier);
        setPhoneConfirmationResult(confirmationResult);
        setPhoneAuthStep('code');
      } catch (error: any) {
        console.error("Firebase phone auth error:", error);
        
        // Handle specific Firebase error codes
        if (error.code === 'auth/invalid-phone-number') {
          setPhoneAuthError("Invalid phone number format. Please use the format: +1XXXXXXXXXX");
        } else if (error.code === 'auth/invalid-app-credential') {
          setPhoneAuthError("The reCAPTCHA verification failed. Please try again.");
          // Recreate the reCAPTCHA
          if (recaptchaVerifier) {
            recaptchaVerifier.clear();
            setRecaptchaVerifier(null);
          }
        } else if (error.code === 'auth/too-many-requests') {
          setPhoneAuthError("Too many requests. Try again later.");
        } else {
          setPhoneAuthError(error.message || "Failed to send verification code. Please try again.");
        }
      }
    } catch (error: any) {
      console.error("Error sending verification code:", error);
      setPhoneAuthError("An unexpected error occurred. Please try again later.");
    }
  };
  
  // Verify SMS code
  const verifyPhoneCode = async () => {
    try {
      setPhoneAuthError("");
      
      if (!verificationCode) {
        setPhoneAuthError("Please enter the verification code");
        return;
      }
      
      if (!phoneConfirmationResult) {
        setPhoneAuthError("Please send the verification code first");
        return;
      }
      
      try {
        await phoneConfirmationResult.confirm(verificationCode);
        setPhoneAuthStep('complete');
      } catch (error: any) {
        console.error("Error verifying code:", error);
        
        if (error.code === 'auth/invalid-verification-code') {
          setPhoneAuthError("Invalid verification code. Please try again.");
        } else if (error.code === 'auth/code-expired') {
          setPhoneAuthError("Verification code has expired. Please request a new code.");
          setPhoneAuthStep('phone');
        } else {
          setPhoneAuthError(error.message || "Failed to verify code. Please try again.");
        }
      }
    } catch (error: any) {
      console.error("Unexpected error during verification:", error);
      setPhoneAuthError("An unexpected error occurred. Please try again later.");
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        signInWithGoogle, 
        signOut: signOutUser,
        
        // Phone authentication
        phoneNumber,
        setPhoneNumber,
        verificationCode,
        setVerificationCode,
        verificationId,
        setVerificationId,
        phoneAuthError,
        setPhoneAuthError,
        phoneAuthStep,
        setPhoneAuthStep,
        phoneConfirmationResult,
        
        // Phone auth methods
        sendVerificationCode,
        verifyPhoneCode,
        
        // Test mode helper
        isTestMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
