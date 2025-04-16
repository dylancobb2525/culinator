'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { getUserRecipes, deleteRecipe, Recipe } from '@/lib/firebase/firebaseUtils';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import Link from 'next/link';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ArrowLeft, X, Clock, BookOpen, ImageOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const foodEmojis = ['🍎', '🍕', '🥑', '🍔', '🍣', '🥩', '🌮', '🍦', '🧀', '🍝', '🍩', '🍗'];

// Helper function to format Firestore timestamp
const formatFirestoreTimestamp = (timestamp: any) => {
  if (!timestamp) return 'Unknown date';
  
  // Handle Firestore Timestamp object
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  }
  
  // Handle JavaScript Date object
  if (timestamp instanceof Date) {
    return timestamp.toLocaleDateString();
  }
  
  // Handle string or number timestamps
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    return new Date(timestamp).toLocaleDateString();
  }
  
  return 'Unknown date';
};

export default function Library() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [imagesPreloaded, setImagesPreloaded] = useState<{[key: string]: boolean}>({});
  
  // Preload images when recipes load
  useEffect(() => {
    if (recipes.length > 0) {
      const imagesToPreload = recipes
        .filter(recipe => recipe.imageUrl)
        .map(recipe => recipe.imageUrl);
        
      // Preload each image
      imagesToPreload.forEach(imageUrl => {
        const img = new window.Image();
        img.src = imageUrl;
        img.onload = () => {
          setImagesPreloaded(prev => ({
            ...prev,
            [imageUrl]: true
          }));
        };
      });
    }
  }, [recipes]);

  useEffect(() => {
    const fetchRecipes = async () => {
      if (user?.uid) {
        try {
          console.log("Fetching recipes for user:", user.uid);
          const userRecipes = await getUserRecipes(user.uid);
          console.log("Recipes fetched successfully:", userRecipes.length, userRecipes);
          setRecipes(userRecipes);
        } catch (error) {
          console.error('Error fetching recipes:', error);
          toast.error('Failed to load your recipes');
        } finally {
          setLoading(false);
        }
      } else {
        console.log("No user logged in");
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [user]);

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!user?.uid) {
      toast.error('You must be signed in to delete recipes');
      return;
    }
    
    if (!recipeId) {
      toast.error('Invalid recipe ID');
      return;
    }
    
    try {
      console.log("Deleting recipe:", recipeId);
      await deleteRecipe(user.uid, recipeId);
      console.log("Recipe deleted, updating UI state");
      
      // Update the UI state
      setRecipes(recipes.filter(recipe => recipe.id !== recipeId));
      toast.success('Recipe deleted successfully');
      
      // Close the modal if the deleted recipe was being viewed
      if (selectedRecipe && selectedRecipe.id === recipeId) {
        setShowDetailModal(false);
        setSelectedRecipe(null);
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
      toast.error('Failed to delete recipe. Please try again.');
    }
  };
  
  const openRecipeDetail = (recipe: any) => {
    setSelectedRecipe(recipe);
    setShowDetailModal(true);
  };
  
  const closeRecipeDetail = () => {
    setShowDetailModal(false);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-green-50 to-amber-50">
      <Toaster position="top-center" />
      <AnimatedBackground emojis={foodEmojis} />
      
      <div className="container mx-auto px-4 py-8 z-10 relative">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-green-800">My Recipe Library</h1>
            <Link 
              href="/get-started"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md inline-flex items-center"
            >
              <BookOpen size={20} className="mr-2" />
              Create New Recipe
            </Link>
          </div>
          
          {!user && (
            <div className="bg-white rounded-xl shadow-md p-8 mb-8 text-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Sign in to view your saved recipes</h2>
              <Link 
                href="/get-started"
                className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Sign In
              </Link>
            </div>
          )}

          {user && loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your recipes...</p>
            </div>
          )}

          {user && !loading && recipes.length === 0 && (
            <div className="bg-white rounded-xl shadow-md p-8 mb-8 text-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">No saved recipes yet</h2>
              <p className="text-gray-600 mb-6">Generate some delicious recipes and save them to your library!</p>
              <Link 
                href="/get-started"
                className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Create a Recipe
              </Link>
            </div>
          )}

          {user && !loading && recipes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {recipes.map((recipe, index) => (
                <motion.div 
                  key={recipe.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => openRecipeDetail(recipe)}
                >
                  <div className="w-full h-40 relative bg-gray-100">
                    {recipe.imageUrl ? (
                      <Image 
                        src={recipe.imageUrl} 
                        alt={recipe.title} 
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                        placeholder="blur"
                        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
                        priority
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <ImageOff size={36} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-800 truncate">{recipe.title}</h3>
                    <div className="flex items-center text-gray-500 mt-2">
                      <Clock size={16} className="mr-1" />
                      <p className="text-sm">Saved on {formatFirestoreTimestamp(recipe.createdAt)}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          
          {/* Recipe Detail Modal */}
          {showDetailModal && selectedRecipe && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl shadow-xl overflow-auto max-w-4xl w-full max-h-[90vh]"
              >
                <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-4 border-b">
                  <h2 className="text-2xl font-bold text-gray-800">{selectedRecipe.title}</h2>
                  <button 
                    onClick={closeRecipeDetail}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <div className="p-6">
                  {selectedRecipe.imageUrl && (
                    <div className="mb-6 relative aspect-video">
                      <Image 
                        src={selectedRecipe.imageUrl} 
                        alt={selectedRecipe.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 95vw, 800px"
                        className="object-cover rounded-lg"
                        priority
                      />
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Saved on</h3>
                    <p className="text-gray-600">{formatFirestoreTimestamp(selectedRecipe.createdAt)}</p>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Ingredients</h3>
                    <ul className="list-disc pl-5 text-gray-600 space-y-1">
                      {selectedRecipe.ingredients && selectedRecipe.ingredients.map((ingredient: string, i: number) => (
                        <li key={i}>{ingredient}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {selectedRecipe.additionalNotes && (
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">Additional Notes</h3>
                      <p className="text-gray-600">{selectedRecipe.additionalNotes}</p>
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Instructions</h3>
                    <div className="text-gray-600 prose max-w-none">
                      <ReactMarkdown>{selectedRecipe.instructions}</ReactMarkdown>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleDeleteRecipe(selectedRecipe.id)}
                      className="text-red-600 hover:text-red-800 font-medium flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Recipe
                    </button>
                    
                    <Link 
                      href="/get-started"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
                    >
                      Create Similar Recipe
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 