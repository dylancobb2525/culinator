import { auth, db, storage } from "./firebase";
import {
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  getDoc,
  Timestamp,
  setDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Auth functions
export const logoutUser = () => signOut(auth);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

// Recipe functions
export interface Recipe {
  id?: string;
  title: string;
  ingredients: string[];
  instructions: string;
  additionalNotes?: string;
  imageUrl?: string;
  createdAt: Timestamp | Date;
}

/**
 * Save a recipe to the user's collection
 */
export const saveRecipe = async (userId: string, recipe: Omit<Recipe, "id" | "createdAt">) => {
  try {
    // Ensure user document exists first
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Create user document if it doesn't exist
      await setDoc(userRef, { 
        createdAt: Timestamp.now(),
        lastLogin: Timestamp.now()
      });
    }
    
    // Add recipe to user's recipes collection
    const recipeData = {
      ...recipe,
      createdAt: Timestamp.now(),
      // Convert ingredients array to ensure it's properly formatted if it's a string
      ingredients: Array.isArray(recipe.ingredients) 
        ? recipe.ingredients 
        : typeof recipe.ingredients === 'string' 
          ? (recipe.ingredients as string).split(',').map((i: string) => i.trim()) 
          : [],
    };
    
    console.log("Saving recipe with data:", recipeData);
    
    const recipeRef = await addDoc(collection(db, "users", userId, "recipes"), recipeData);
    console.log("Recipe saved with ID:", recipeRef.id);
    
    return { id: recipeRef.id, ...recipeData };
  } catch (error) {
    console.error("Error saving recipe:", error);
    throw error;
  }
};

/**
 * Get all recipes for a user
 */
export const getUserRecipes = async (userId: string) => {
  try {
    console.log("Getting recipes for user:", userId);
    
    if (!userId) {
      console.error("getUserRecipes called with empty userId");
      return [];
    }
    
    const recipesQuery = query(
      collection(db, "users", userId, "recipes"),
      orderBy("createdAt", "desc") // Most recent first
    );
    
    console.log("Executing Firestore query...");
    const snapshot = await getDocs(recipesQuery);
    console.log("Query returned:", snapshot.docs.length, "recipes");
    
    const recipes = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data
      };
    });
    
    console.log("Processed recipes:", recipes.length);
    return recipes as Recipe[];
  } catch (error) {
    console.error("Error fetching user recipes:", error);
    throw error;
  }
};

/**
 * Get a specific recipe
 */
export const getRecipe = async (userId: string, recipeId: string) => {
  try {
    const recipeRef = doc(db, "users", userId, "recipes", recipeId);
    const recipeDoc = await getDoc(recipeRef);
    
    if (!recipeDoc.exists()) {
      throw new Error("Recipe not found");
    }
    
    return {
      id: recipeDoc.id,
      ...recipeDoc.data()
    } as Recipe;
  } catch (error) {
    console.error("Error fetching recipe:", error);
    throw error;
  }
};

/**
 * Delete a recipe
 */
export const deleteRecipe = async (userId: string, recipeId: string) => {
  try {
    console.log("Deleting recipe:", recipeId, "for user:", userId);
    
    if (!userId || !recipeId) {
      console.error("deleteRecipe called with empty userId or recipeId");
      throw new Error("userId and recipeId are required");
    }
    
    const recipeRef = doc(db, "users", userId, "recipes", recipeId);
    
    // Verify the recipe exists before deleting
    const recipeDoc = await getDoc(recipeRef);
    if (!recipeDoc.exists()) {
      console.error("Recipe does not exist:", recipeId);
      throw new Error("Recipe not found");
    }
    
    await deleteDoc(recipeRef);
    console.log("Recipe deleted successfully:", recipeId);
  } catch (error) {
    console.error("Error deleting recipe:", error);
    throw error;
  }
};

// Firestore functions
export const addDocument = (collectionName: string, data: any) =>
  addDoc(collection(db, collectionName), data);

export const getDocuments = async (collectionName: string) => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const updateDocument = (collectionName: string, id: string, data: any) =>
  updateDoc(doc(db, collectionName, id), data);

export const deleteDocument = (collectionName: string, id: string) =>
  deleteDoc(doc(db, collectionName, id));

// Storage functions
export const uploadFile = async (file: File, path: string) => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};
