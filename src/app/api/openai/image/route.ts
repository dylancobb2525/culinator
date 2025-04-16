export const runtime = "edge";

// Helper function to clean the API key
function cleanApiKey(key: string | undefined): string {
  if (!key) return '';
  
  // Remove any whitespace, line breaks, or trailing characters
  return key.trim().replace(/\s+/g, '');
}

export async function POST(req: Request) {
  const { recipe, ingredients } = await req.json();
  
  // Clean the API key
  const apiKey = cleanApiKey(process.env.OPENAI_API_KEY);
  
  try {
    const prompt = `A high-quality, appetizing photograph of ${recipe}. The dish includes ${ingredients}. Professional food photography style with good lighting, on a nice plate, restaurant quality presentation.`;
    
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI Image API error:", error);
      
      // Check for specific error types
      if (error.error?.type === 'insufficient_quota') {
        return Response.json({ 
          error: "OpenAI account has insufficient funds. Please check your billing details." 
        }, { status: response.status });
      } else if (error.error?.code === 'invalid_api_key') {
        return Response.json({ 
          error: "Invalid OpenAI API key. Please check your API key configuration." 
        }, { status: response.status });
      } else {
        return Response.json({ 
          error: error.error?.message || "Failed to generate image. Please try again." 
        }, { status: response.status });
      }
    }
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error("Error generating image:", error);
    return Response.json({ error: "Failed to generate image. Try again or check API key configuration." }, { status: 500 });
  }
} 