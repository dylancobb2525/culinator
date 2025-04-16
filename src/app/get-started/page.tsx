"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { Info, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "@/lib/hooks/useAuth";

// Array of food emojis for the background animation (same as home page)
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

export default function RecipeForm() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [recipe, setRecipe] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Constants for character limits
  const MAX_NOTES_CHARS = 500;
  const WARN_NOTES_CHARS = 400;
  
  // Calculate remaining characters
  const remainingNoteChars = MAX_NOTES_CHARS - additionalNotes.length;
  const isNearLimit = remainingNoteChars <= 100;
  const isAtLimit = remainingNoteChars <= 0;
  
  useEffect(() => {
    setMounted(true);
    
    // Redirect to home if not authenticated
    if (!loading && !user) {
      router.replace('/');
    }
  }, [loading, user, router]);
  
  useEffect(() => {
    // If user tries to type more than the limit, truncate
    if (additionalNotes.length > MAX_NOTES_CHARS) {
      setAdditionalNotes(additionalNotes.slice(0, MAX_NOTES_CHARS));
    }
  }, [additionalNotes]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipe || !ingredients) {
      setError("Please fill in both fields");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      // Store recipe and ingredients in sessionStorage to use on the result page
      sessionStorage.setItem("culinator_recipe", recipe);
      sessionStorage.setItem("culinator_ingredients", ingredients);
      sessionStorage.setItem("culinator_notes", additionalNotes);
      
      // Navigate to the recipe result page with all params including optional notes
      const queryParams = new URLSearchParams({
        recipe: recipe,
        ingredients: ingredients,
      });
      
      if (additionalNotes) {
        queryParams.append("notes", additionalNotes);
      }
      
      router.push(`/recipe/result?${queryParams.toString()}`);
    } catch (error) {
      console.error("Error:", error);
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };
  
  // If not authenticated or still loading auth state, show minimal UI
  if (loading || !user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 relative">
        <LoadingSpinner message="Preparing your experience..." />
      </main>
    );
  }
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 relative">
      {mounted && <FoodEmojiBackground />}
      
      {/* Cookbook Button */}
      <div className="absolute top-4 right-4 z-20">
        <Link 
          href="/library" 
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors shadow-md"
        >
          <BookOpen size={20} />
          <span>Cookbook</span>
        </Link>
      </div>
      
      <div className="w-full max-w-4xl flex flex-col items-center z-10 bg-white/85 p-6 sm:p-12 rounded-lg">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="w-full max-w-2xl">
            <div className="flex items-center justify-center mb-8">
              <Image 
                src="/fork.webp" 
                alt="Culinator" 
                width={80} 
                height={80}
                priority
              />
              <h1 className="text-3xl sm:text-4xl font-bold ml-4">Culinator</h1>
            </div>
            
            <h2 className="text-2xl font-semibold mb-8 text-center">Tell us what you'd like to cook</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="w-full space-y-8">
              <div className="space-y-2">
                <label htmlFor="recipe" className="text-lg font-medium">
                  What are you interested in making?
                </label>
                <input
                  id="recipe"
                  type="text"
                  value={recipe}
                  onChange={(e) => setRecipe(e.target.value)}
                  placeholder="E.g., Pasta dish, Vegetarian stir fry, Chocolate cake..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <label htmlFor="ingredients" className="text-lg font-medium">
                    What ingredients do you currently have?
                  </label>
                  <div className="relative ml-2">
                    <button
                      type="button"
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                      onClick={() => setShowTooltip(!showTooltip)}
                    >
                      <Info size={20} />
                    </button>
                    
                    {showTooltip && (
                      <div className="absolute z-10 w-64 p-4 mt-2 -right-2 text-sm bg-gray-800 text-white rounded-md shadow-lg">
                        The recipe will be generated using your provided ingredients when possible. Some recipes may require additional ingredients that will be suggested for purchase.
                        <div className="absolute -top-2 right-3 w-3 h-3 bg-gray-800 transform rotate-45"></div>
                      </div>
                    )}
                  </div>
                </div>
                <textarea
                  id="ingredients"
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  placeholder="E.g., chicken, rice, bell peppers, onions, soy sauce..."
                  className="w-full p-3 border border-gray-300 rounded-md h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <label htmlFor="additionalNotes" className="text-lg font-medium">
                    Any additional notes? <span className="text-sm font-normal text-gray-500">(Optional)</span>
                  </label>
                </div>
                <textarea
                  id="additionalNotes"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="E.g., 'I have a nut allergy', 'I prefer low-carb meals', 'I need high-protein options', 'I'm cooking for a family of 4', 'I want quick recipes under 30 minutes'..."
                  className={`w-full p-3 border ${isAtLimit ? 'border-red-500' : isNearLimit ? 'border-yellow-500' : 'border-gray-300'} rounded-md h-36 focus:ring-2 ${isAtLimit ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-blue-500 focus:border-blue-500'} outline-none`}
                  maxLength={MAX_NOTES_CHARS}
                />
                <div className="flex justify-between items-start">
                  <div className="text-sm text-gray-600 mt-1 space-y-1 w-4/5">
                    <p>Include details such as:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Dietary restrictions or allergies (gluten-free, dairy-free, vegan, etc.)</li>
                      <li>Nutritional preferences (low-carb, high-protein, keto, etc.)</li>
                      <li>Time constraints (quick meals, meal prep, etc.)</li>
                      <li>Cooking skill level (beginner, intermediate, advanced)</li>
                      <li>Number of servings needed</li>
                      <li>Available kitchen equipment (pressure cooker, air fryer, etc.)</li>
                      <li>Flavor preferences (spicy, mild, sweet, savory, etc.)</li>
                      <li>Cultural cuisine preferences (Italian, Thai, Mexican, etc.)</li>
                    </ul>
                    <p className="pt-1">This information helps us tailor recipes to your specific needs and situation.</p>
                    <p className="italic text-gray-500 pt-1">The more details you provide, the more personalized your recipe will be!</p>
                  </div>
                  <div className={`text-sm font-medium ${isAtLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-600' : 'text-gray-500'} mt-1 ml-4 w-1/5 text-right`}>
                    {remainingNoteChars} characters left
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center pt-4">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-full transition-colors shadow-md text-lg"
                >
                  Generate Recipe
                </button>
              </div>
            </form>
            
            <div className="mt-8 text-center">
              <Link 
                href="/"
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 