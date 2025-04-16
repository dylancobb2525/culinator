"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import AuthModal from "@/components/AuthModal";
import { BookOpen } from "lucide-react";

// Array of food emojis to use in the background animation
const foodEmojis = ["🍔", "🍕", "🍣", "🍩", "🍗", "🥗", "🌮", "🍦", "🥪", "🍜", "🧁", "🥐", "🍫", "🍰", "🍇", "🍓", "🍍", "🥑", "🍒", "🍋", "🍊", "🥥", "🧀", "🥞", "🌯", "🍱"];

// Memoized background to prevent re-renders causing flickering
const FoodEmojiBackground = () => {
  // Use useMemo to ensure this only renders once
  const emojiElements = useMemo(() => {
    // Initial wave of emojis
    const initialEmojis = Array.from({ length: 15 }).map((_, i) => {
      const randomEmoji = foodEmojis[i % foodEmojis.length]; // Use index mod length for deterministic results
      const size = 25 + ((i * 343) % 45); // Deterministic size
      const initialProgress = i / 15;
      const xPos = 100 - (initialProgress * 100);
      const yPos = initialProgress < 0.5 
        ? 50 + (initialProgress * 2 * 10)
        : 50 + ((1 - initialProgress) * 2 * 10);
      
      return (
        <div 
          key={`initial-${i}`}
          className="absolute text-4xl"
          style={{
            left: `${xPos}%`,
            top: `${yPos}%`,
            fontSize: `${size}px`,
            opacity: 0.5,
            animation: `float ${15}s linear ${0}s infinite`,
            animationDelay: `${-initialProgress * 15}s`,
          }}
        >
          {randomEmoji}
        </div>
      );
    });

    // Continuous stream of emojis
    const streamEmojis = Array.from({ length: 70 }).map((_, i) => {
      const randomEmoji = foodEmojis[(i + 15) % foodEmojis.length]; // Use index mod length for deterministic results
      const size = 25 + ((i * 137) % 45); // Deterministic size
      const delay = (i % 10) * 0.8 + 2;
      const duration = (10 + (i % 15)); // Deterministic duration
      const startX = 100 + (i % 20); // Deterministic X
      const startY = (i * 17) % 100; // Deterministic Y
      const yOffset = ((i * 7) % 30) - 15; // Deterministic Y offset
      
      return (
        <div 
          key={`stream-${i}`}
          className="absolute text-4xl"
          style={{
            left: `${startX}%`,
            top: `${startY}%`,
            fontSize: `${size}px`,
            animation: `float ${duration}s linear ${delay}s infinite`,
            transform: `translateY(${yOffset}px)`,
          }}
        >
          {randomEmoji}
        </div>
      );
    });

    return [...initialEmojis, ...streamEmojis];
  }, []); // Empty dependency array ensures this only runs once

  return (
    <div className="fixed inset-0 overflow-hidden -z-10 select-none pointer-events-none">
      {emojiElements}
    </div>
  );
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const handleGetStarted = () => {
    if (user) {
      router.push('/get-started');
    } else {
      setIsAuthModalOpen(true);
    }
  };
  
  const handleAuthSuccess = () => {
    router.push('/get-started');
  };
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center relative">
      {mounted && <FoodEmojiBackground />}
      
      {/* Cookbook Button */}
      {user && (
        <div className="absolute top-4 right-4 z-20">
          <Link 
            href="/library" 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors shadow-md"
          >
            <BookOpen size={20} />
            <span>Cookbook</span>
          </Link>
        </div>
      )}
      
      <div className="max-w-md flex flex-col items-center gap-8 z-10 bg-white/85 p-8 rounded-lg">
        <h1 className="text-6xl font-bold mb-4">Culinator</h1>
        
        <p className="text-xl">
          Generate a recipe based on your idea<br />
          and available ingredients.
        </p>
        
        <div className="w-40 h-40 my-8 relative">
          <Image 
            src="/fork.webp" 
            alt="Culinator" 
            width={160} 
            height={160}
            priority
          />
        </div>
        
        <button 
          onClick={handleGetStarted}
          className="border-2 border-black rounded-full px-10 py-4 text-xl font-medium hover:bg-black hover:text-white transition-all mt-4"
        >
          Get Started
        </button>
      </div>
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </main>
  );
}
