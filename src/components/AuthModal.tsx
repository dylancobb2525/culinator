"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { 
    user, 
    signInWithGoogle
  } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  // Handle when user becomes authenticated
  useEffect(() => {
    if (user && onSuccess) {
      onSuccess();
      onClose();
    }
  }, [user, onSuccess, onClose]);
  
  if (!isOpen) return null;
  
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Error signing in with Google:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <X size={20} />
        </button>
        
        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold">Sign In to Culinator</h2>
          <p className="text-gray-500 mt-1">To access your personalized recipes</p>
        </div>
        
        {/* Google Authentication button */}
        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className={`w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-md py-3 px-4 ${
              isLoading 
                ? "opacity-70 cursor-not-allowed" 
                : "hover:bg-gray-50 transition-colors"
            }`}
          >
            <Image src="/google-logo.svg" alt="Google" width={20} height={20} />
            <span>{isLoading ? "Signing in..." : "Sign in with Google"}</span>
          </button>
        </div>
      </div>
    </div>
  );
} 