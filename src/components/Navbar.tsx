"use client";

import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { useState, useEffect } from "react";
import Image from "next/image";

export function Navbar() {
  const { user, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Only show client-side content after component has mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <header className="bg-white shadow-sm">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/fork.webp" alt="Culinator" width={30} height={30} />
            <span className="font-bold text-xl">Culinator</span>
          </Link>
          <div className="w-24 h-8"></div> {/* Placeholder for authentication UI */}
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto p-4 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <Image src="/fork.webp" alt="Culinator" width={30} height={30} />
          <span className="font-bold text-xl">Culinator</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <div className="flex items-center space-x-2">
                {user.photoURL && (
                  <Image 
                    src={user.photoURL} 
                    alt="Profile" 
                    width={32} 
                    height={32} 
                    className="rounded-full"
                  />
                )}
                <span className="font-medium">Chef {user.displayName?.split(' ')[0] || 'User'}</span>
              </div>
              <button 
                onClick={signOut} 
                className="text-sm bg-gray-100 hover:bg-gray-200 py-1 px-3 rounded-md"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="w-24 h-8"> </div> 
          )}
        </div>
      </div>
    </header>
  );
} 