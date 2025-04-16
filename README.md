# Culinator - AI Recipe Generator

Culinator is an AI-powered recipe generator that creates personalized recipes based on your desired dish and available ingredients. With a modern and intuitive interface, Culinator helps you cook delicious meals without the hassle of searching through multiple recipe websites.

## Features

- **AI Recipe Generation**: Generate detailed recipes based on what you want to cook and what ingredients you have on hand
- **Ingredient Optimization**: Makes the best use of your available ingredients while suggesting any additional items you might need
- **Personal Cookbook**: Save your favorite recipes to your personal cookbook for easy access later
- **Dietary Preferences**: Include notes about dietary restrictions, allergies, or preferences to get tailored recipes
- **Recipe Visualization**: Each recipe comes with an AI-generated image of the final dish
- **User Authentication**: Secure user accounts with Firebase authentication

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TailwindCSS
- **Authentication**: Firebase Authentication
- **AI Integration**: 
  - OpenAI API for recipe generation and image creation
  - Anthropic Claude API as a fallback for recipe generation
- **Styling**: Custom responsive design with Tailwind CSS
- **Deployment**: Vercel

## App Structure

- **Home Page**: Landing page with a "Get Started" button
- **Get Started Page**: Form to input desired recipe, available ingredients, and dietary notes
- **Recipe Result Page**: Displays the generated recipe with ingredients, instructions, and an AI-generated image
- **Cookbook/Library**: Stores saved recipes for registered users

## Development Approach

This app was built using the Next.js App Router architecture. The development process followed these key principles:

1. **Client-Side Components**: Components that require interactivity like forms and authentication are client components
2. **API Routes**: Leveraging Next.js API routes for secure communication with AI services
3. **Responsive Design**: Mobile-first approach ensuring a great experience on all devices
4. **Progressive Enhancement**: Core functionality works with or without JavaScript enabled
5. **Error Handling**: Robust error handling for API failures and input validation

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn
- API keys for OpenAI and Firebase (optional: Anthropic)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/dylancobb2525/culinator.git
   ```

2. Install dependencies:
   ```
   cd culinator
   npm install
   ```

3. Create a `.env.local` file with your API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key
   FIREBASE_API_KEY=your_firebase_api_key
   FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   FIREBASE_APP_ID=your_firebase_app_id
   ANTHROPIC_API_KEY=your_anthropic_api_key (optional)
   ```

4. Run the development server:
   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) to see the app in action.

## Future Enhancements

- Recipe sharing functionality
- Social features for discovering popular recipes
- Meal planning and grocery list integration
- Advanced filtering options in the cookbook
- Nutrition information for recipes

## License

This project is MIT licensed.