import { anthropic } from "@ai-sdk/anthropic";
import { convertToCoreMessages, streamText } from "ai";

export const runtime = "edge";

export async function POST(req: Request) {
  const { messages, recipe, ingredients, additionalNotes, recipeContent } = await req.json();
  
  // Create a chef-like system prompt with recipe context if provided
  let systemPrompt = "You are a helpful, friendly chef assistant named Chef Claude. You provide cooking advice, recipe modifications, and answer questions about cooking. ALWAYS KEEP YOUR RESPONSES SHORT AND CONVERSATIONAL - aim for 1-3 sentences maximum per response. Avoid long explanations and unnecessary details. Write as if you're texting with a friend.";
  
  if (recipe && ingredients) {
    systemPrompt += ` You are currently discussing a recipe for ${recipe} that includes these ingredients: ${ingredients}.`;
    
    if (additionalNotes) {
      systemPrompt += ` The user had these additional notes/dietary requirements: ${additionalNotes}.`;
    }
    
    if (recipeContent) {
      systemPrompt += ` Here is the full recipe that was generated:\n\n${recipeContent}\n\nYou can reference specific parts of this recipe when answering questions, but keep your answers very brief and to the point.`;
    }
    
    systemPrompt += " Always prioritize safety and dietary restrictions in your answers. If the user has allergies or dietary needs, ensure your suggestions respect these constraints.";
    
    systemPrompt += " Remember to keep all responses SHORT (1-3 sentences) and CONVERSATIONAL in tone. Users prefer quick, direct answers they can easily read in a chat interface.";
  }
  
  const result = await streamText({
    model: anthropic("claude-3-haiku-20240307"),
    messages: convertToCoreMessages(messages),
    system: systemPrompt,
    maxTokens: 500,
  });

  return result.toDataStreamResponse();
}
