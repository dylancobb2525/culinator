"use client";

import { useEffect, useState, useRef, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { Camera, ArrowLeft, BookmarkPlus, Check } from "lucide-react";
import { marked } from "marked";
import ReactMarkdown from 'react-markdown';
import Head from "next/head";
import ChefChat from "@/app/components/ChefChat";
import { useAuth } from "@/lib/hooks/useAuth";
import { saveRecipe } from "@/lib/firebase/firebaseUtils";
import { toast } from "react-hot-toast";

// Reuse the same emoji background but with a static seed to prevent flickering
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

// Component to handle search params with Suspense
function RecipeResultContent() {
  const searchParams = useSearchParams();
  const recipe = searchParams.get("recipe") || "";
  const ingredients = searchParams.get("ingredients") || "";
  const additionalNotes = searchParams.get("notes") || "";
  
  const [mounted, setMounted] = useState(false);
  const [recipeContent, setRecipeContent] = useState("");
  const [isLoadingRecipe, setIsLoadingRecipe] = useState(true);
  const [recipeError, setRecipeError] = useState("");
  
  const [dishImage, setDishImage] = useState("");
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [isImageVisible, setIsImageVisible] = useState(false);
  const [imageError, setImageError] = useState("");
  
  // For saving recipe
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Use useRef to prevent multiple API calls
  const hasCalledAPI = useRef(false);
  
  useEffect(() => {
    setMounted(true);
    if (!hasCalledAPI.current) {
      fetchRecipe();
      hasCalledAPI.current = true;
    }
  }, []);
  
  async function fetchRecipe() {
    setIsLoadingRecipe(true);
    
    if (!recipe || !ingredients) {
      setRecipeError("Recipe or ingredients information is missing.");
      setIsLoadingRecipe(false);
      return;
    }
    
    try {
      const promptText = `Please generate a recipe for ${recipe} using the following ingredients: ${ingredients}${additionalNotes ? `. Additional notes: ${additionalNotes}` : ''}.
      
      The recipe should be well-formatted with:
      1. A brief introduction
      2. List of all ingredients with measurements
      3. Clear step-by-step instructions
      4. Serving suggestions or tips
      
      ${additionalNotes ? `Pay special attention to these additional requirements and preferences: "${additionalNotes}". They are high priority considerations that should guide the recipe creation.` : ''}
      
      If the user provided ingredients aren't sufficient, suggest alternatives that would work well.`;
      
      console.log("Sending recipe request to API...");
      
      const response = await fetch("/api/openai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText,
          recipe: recipe,
          ingredients: ingredients,
          additionalNotes: additionalNotes,
          type: 'recipe',
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API response error:", response.status, errorData);
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        console.error("API returned error:", data.error);
        throw new Error(data.error);
      }
      
      if (data.recipe) {
        console.log("Recipe generated successfully");
        setRecipeContent(data.recipe);
        setIsLoadingRecipe(false);
      } else {
        console.error("No recipe content in response:", data);
        throw new Error("No recipe content received");
      }
    } catch (error) {
      console.error("Error fetching recipe:", error);
      if (error instanceof Error) {
        setRecipeError(error.message || "Failed to generate recipe. Please try again.");
      } else {
        setRecipeError("An unexpected error occurred. Please try again later.");
      }
      setIsLoadingRecipe(false);
    }
  }
  
  async function generateDishImage() {
    setIsLoadingImage(true);
    setIsImageVisible(false);
    setImageError("");
    
    try {
      const response = await fetch("/api/openai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipe: recipe,
          ingredients: ingredients
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate image");
      }
      
      const data = await response.json();
      
      if (data.data && data.data[0] && data.data[0].url) {
        setDishImage(data.data[0].url);
        // Keep loading state true until image is loaded in the browser
      } else {
        throw new Error("Invalid image data received");
      }
      
    } catch (error) {
      console.error("Error generating image:", error);
      setImageError("Failed to generate image. Please try again.");
      setIsLoadingImage(false);
    }
  }
  
  function createMarkup() {
    return { __html: marked(recipeContent) };
  }
  
  // Handle saving recipe to user's collection
  const handleSaveRecipe = async () => {
    if (!user) {
      toast.error("Please sign in to save recipes");
      return;
    }

    if (!recipeContent) {
      toast.error("No recipe to save");
      return;
    }

    setIsSaving(true);
    try {
      console.log("Starting recipe save process...");
      
      // Parse ingredients from recipe content
      let ingredientsList = ingredients.split(',').map(i => i.trim());
      console.log("Parsed ingredients:", ingredientsList);
      
      // Prepare recipe data
      const recipeData = {
        title: recipe,
        ingredients: ingredientsList,
        instructions: recipeContent,
        additionalNotes: additionalNotes,
        imageUrl: dishImage || undefined
      };
      console.log("Recipe data to save:", recipeData);
      
      // Save the recipe
      const savedRecipe = await saveRecipe(user.uid, recipeData);
      console.log("Recipe saved successfully:", savedRecipe.id);
      
      setIsSaved(true);
      toast.success("Recipe saved to your library!");
    } catch (error) {
      console.error("Error saving recipe:", error);
      toast.error("Failed to save recipe. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <main className="min-h-screen w-full flex flex-col items-center pb-16 relative">
      {mounted && <FoodEmojiBackground />}
      
      <div className="w-full max-w-4xl flex flex-col items-center bg-white/85 backdrop-blur-sm p-4 sm:p-8 mt-8 mx-4 rounded-lg shadow-lg z-10">
        <div className="w-full max-w-3xl">
          <div className="flex justify-between items-center mb-8">
            <Link href="/get-started" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft size={20} className="mr-2" />
              <span>Back to Form</span>
            </Link>
            
            <div className="flex items-center">
              <Image src="/fork.webp" alt="Culinator" width={50} height={50} />
              <h1 className="text-2xl font-bold ml-2">Culinator</h1>
            </div>
          </div>
          
          {isLoadingRecipe ? (
            <div className="w-full flex justify-center py-12">
              <LoadingSpinner message="Generating your recipe..." />
            </div>
          ) : recipeError ? (
            <div className="bg-red-50 p-6 rounded-lg text-center">
              <p className="text-red-600 font-medium text-lg mb-4">{recipeError}</p>
              <div className="text-red-500 text-sm mb-6">
                {recipeError.includes("insufficient funds") && (
                  <p>The OpenAI account needs additional funds. Please try again later when this has been resolved.</p>
                )}
                {recipeError.includes("API key") && (
                  <p>There seems to be an issue with the API configuration. Please contact support.</p>
                )}
              </div>
              <Link 
                href="/get-started" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md inline-block"
              >
                Try Again
              </Link>
            </div>
          ) : (
            <div className="recipe-content space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold">{recipe}</h2>
                
                <div className="flex space-x-2">
                  {user && (
                    <button
                      onClick={handleSaveRecipe}
                      disabled={isSaving || isSaved}
                      className={`flex items-center gap-2 py-2 px-4 rounded-md transition-colors ${
                        isSaved
                          ? "bg-green-100 text-green-700 cursor-default"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {isSaved ? (
                        <>
                          <Check size={18} />
                          <span>Saved</span>
                        </>
                      ) : (
                        <>
                          <BookmarkPlus size={18} />
                          <span>{isSaving ? "Saving..." : "Save Recipe"}</span>
                        </>
                      )}
                    </button>
                  )}
                  
                  {!dishImage && !isLoadingImage && (
                    <button
                      onClick={generateDishImage}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                    >
                      Generate Dish Image
                    </button>
                  )}
                </div>
              </div>
              
              {isLoadingImage && !isImageVisible && (
                <div className="w-full flex justify-center py-6">
                  <LoadingSpinner message="Generating image..." />
                </div>
              )}
              
              {imageError && (
                <div className="bg-red-50 p-4 rounded-md">
                  <p className="text-red-600">{imageError}</p>
                </div>
              )}
              
              {dishImage && (
                <div className={`w-full flex justify-center my-6 ${!isImageVisible ? 'hidden' : ''}`}>
                  <div className="w-full max-w-md overflow-hidden rounded-lg shadow-md">
                    <Image 
                      src={dishImage} 
                      alt={`${recipe} dish`}
                      width={500}
                      height={500}
                      className="w-full h-auto object-cover"
                      onLoad={() => {
                        setIsImageVisible(true);
                        setIsLoadingImage(false);
                      }}
                      priority
                    />
                  </div>
                </div>
              )}
              
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown>{recipeContent}</ReactMarkdown>
              </div>
              
              <div className="mt-8 pt-4 border-t border-gray-200">
                <p className="text-gray-600 text-sm mb-4">
                  Recipe generated based on:{" "}
                  <span className="font-medium">{recipe}</span> with ingredients:{" "}
                  <span className="font-medium">{ingredients}</span>
                  {additionalNotes && (
                    <>
                      {" and additional notes: "}
                      <span className="font-medium">{additionalNotes}</span>
                    </>
                  )}
                </p>
                
                {additionalNotes && (
                  <div className="bg-blue-50 p-4 rounded-md mb-4">
                    <h3 className="font-medium text-blue-800 mb-2">Additional Notes Considered</h3>
                    <p className="text-blue-700">{additionalNotes}</p>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/get-started"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md inline-block"
                  >
                    Generate Another Recipe
                  </Link>
                  
                  {user && (
                    <Link
                      href="/library"
                      className="border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-2 px-6 rounded-md inline-block"
                    >
                      View Recipe Library
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Add Chef Chat Component */}
      {!isLoadingRecipe && !recipeError && (
        <ChefChat 
          recipe={recipe} 
          ingredients={ingredients} 
          additionalNotes={additionalNotes} 
          recipeContent={recipeContent}
        />
      )}
    </main>
  );
}

// Main component with Suspense boundary
export default function RecipeResult() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner message="Loading recipe..." /></div>}>
      <RecipeResultContent />
    </Suspense>
  );
} 