# Text Humanizer

A powerful AI-powered application that transforms AI-generated text into natural, human-like content while preserving the original meaning. This tool is designed to help users bypass AI detection tools like ZeroGPT by making text sound authentically human.

## Features

- **Advanced Text Humanization**: Uses OpenAI's GPT-4 to rewrite text with natural sentence structures
- **Meaning Preservation**: Maintains 100% of the original content meaning
- **Student-Style Writing**: Rewrites text to sound like it was written by a student
- **Natural Variations**: Varies sentence length and vocabulary for authenticity
- **Modern UI**: Beautiful, responsive interface with dark mode support
- **Copy to Clipboard**: Easy copying of humanized text

## How It Works

The app uses a carefully crafted prompt that instructs the AI to:

- Rewrite in fluent academic English, but make it sound like a student wrote it
- Vary sentence length (mix short and long sentences)
- Use natural transitions, not overly polished ones
- Change vocabulary and sentence structure where possible
- Avoid repeating the same phrases
- Keep the meaning 100% intact
- Make it readable when spoken aloud

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd paris-phrase
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. Paste your AI-generated text into the "Original Text" textarea
2. Click the "Humanize Text" button
3. Wait for the AI to process and rewrite your text
4. Copy the humanized text using the copy button

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **AI Integration**: OpenAI GPT-4 API
- **Deployment**: Vercel-ready

## Important Notes

- You need a valid OpenAI API key to use this application
- The application uses GPT-4 for the best humanization results
- Make sure to follow OpenAI's usage policies and rate limits
- This tool is designed for legitimate academic and content creation purposes

## License

This project is for educational and personal use. Please ensure you comply with OpenAI's terms of service and any applicable academic integrity policies.