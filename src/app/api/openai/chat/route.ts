import { openai } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText } from "ai";

export const runtime = "edge";

// Helper function to clean the API key
function cleanApiKey(key: string | undefined): string {
  if (!key) return '';
  
  // Remove any whitespace, line breaks, or trailing characters
  return key.trim().replace(/\s+/g, '');
}

export async function POST(req: Request) {
  const { messages, recipe, ingredients, additionalNotes, prompt } = await req.json();
  
  // Clean the API key
  const apiKey = cleanApiKey(process.env.OPENAI_API_KEY);
  
  // If recipe and ingredients are provided, it's a recipe generation request
  if (recipe && ingredients) {
    try {
      // Include additionalNotes in the prompt if provided
      const recipePrompt = additionalNotes 
        ? `I want to make ${recipe}. I have these ingredients: ${ingredients}. IMPORTANT DIETARY REQUIREMENTS/NOTES: ${additionalNotes}. Please provide a complete recipe with ingredients list, steps, cooking time, and any tips.`
        : `I want to make ${recipe}. I have these ingredients: ${ingredients}. Please provide a complete recipe with ingredients list, steps, cooking time, and any tips.`;
      
      // If custom prompt is provided, use it instead (this allows client-side prompt customization)
      const finalPrompt = prompt || recipePrompt;
      
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4-turbo",
          messages: [
            {
              role: "system",
              content: "You are a world-class chef who creates delicious, practical recipes. Focus on using the ingredients provided while suggesting minimal additional ingredients when necessary. Format your response with clear sections: 'Ingredients', 'Instructions', 'Cooking Time', and 'Chef Tips'. Be creative but practical, ensuring the recipe is achievable for home cooks. CRITICAL: If the user mentions ANY dietary restrictions, allergies, or special requirements in their notes, you MUST strictly follow these - treating them as absolute requirements that cannot be ignored for health and safety reasons. Never include ingredients that violate user's dietary restrictions or allergies."
            },
            {
              role: "user",
              content: finalPrompt
            }
          ],
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenAI API error:", errorData);
        
        // Check for specific error types
        if (errorData.error?.type === 'insufficient_quota') {
          return Response.json(
            { error: "OpenAI account has insufficient funds. Please check your billing details." },
            { status: response.status }
          );
        } else if (errorData.error?.code === 'invalid_api_key') {
          return Response.json(
            { error: "Invalid OpenAI API key. Please check your API key configuration." },
            { status: response.status }
          );
        } else {
          return Response.json(
            { error: `Failed to generate recipe: ${errorData.error?.message || "Unknown error"}` },
            { status: response.status }
          );
        }
      }
      
      const data = await response.json();
      const generatedRecipe = data.choices[0].message.content;
      
      return Response.json({ recipe: generatedRecipe });
    } catch (error) {
      console.error("Error generating recipe:", error);
      return Response.json(
        { error: "Failed to generate recipe. Try again or check API key configuration." },
        { status: 500 }
      );
    }
  }
  
  // Regular chat request - keeping the original implementation
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: messages,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return Response.json(
        { error: "Chat completion failed" },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return Response.json({ response: data.choices[0].message.content });
  } catch (error) {
    console.error("Error in chat completion:", error);
    return Response.json(
      { error: "Chat completion failed" },
      { status: 500 }
    );
  }
}
