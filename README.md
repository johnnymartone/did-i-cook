# Did I Cook? 🍳

A simple AI design analysis tool that tells you whether your design changes are actually improvements or not.

## What it does

Upload a "before" and "after" image of your design, and get AI-powered feedback on whether you cooked (made it better) or got cooked (made it worse). The app provides real-time streaming analysis with specific feedback and suggestions.

## Setup

1. **Clone and install dependencies:**
```bash
git clone https://github.com/johnnymartone/did-i-cook.git
cd didicook
npm install
```

2. **Set up environment variables:**
Create a `.env.local` file in the root directory:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

3. **Run the development server:**
```bash
npm run dev
```

4. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

## How to use

1. Upload your original design in the "Before" section
2. Upload your redesigned version in the "After" section  
3. Click "Analyze Design" and watch the AI analyze your changes
4. Get your verdict: "Cooked!" (good) or "You got cooked!" (needs work)
5. Read the detailed reasoning and suggestions

## Tech Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **OpenAI API** - AI vision analysis
- **Streaming API** - Real-time responses

## Deploy

Deploy easily on [Vercel](https://vercel.com/new) (recommended) or any platform that supports Next.js.

Don't forget to add your `OPENAI_API_KEY` environment variable in your deployment settings.