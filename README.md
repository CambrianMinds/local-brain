<div align="center">
  <h1>🧠 Local Brain</h1>
  <p><strong>A high-precision, privacy-first desktop document intelligence assistant.</strong></p>
  <p>
    <a href="#features">Features</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#installation">Installation</a> •
    <a href="#configuration">Configuration</a>
  </p>
</div>

## Overview

Local Brain is a powerful, privacy-first document management system built with React, Vite, and Express. It provides semantic vector search, auto-categorization, and AI-driven wiki generation, all capable of running 100% locally on your machine.

**Website**: [https://yourusername.github.io/local-brain/](https://yourusername.github.io/local-brain/)

## ✨ Features

- 🔒 **Privacy-First**: Run entirely offline with local models, guaranteeing zero data egress.
- 🔍 **Semantic Search**: Fast, accurate document retrieval powered by dense vector embeddings.
- 🏷️ **Auto-Categorization**: AI automatically tags and files your documents into the correct categories.
- 📚 **Knowledge Synthesis**: Instantly generate encyclopedia-grade markdown wikis from your document clusters.
- 🔌 **Multi-Provider Support**: Seamlessly switch between local (LM Studio) and cloud (Gemini, OpenRouter) models.

## 🛠️ Architecture

- **Frontend**: React 19, Tailwind CSS v4, Framer Motion for fluid UI.
- **Backend**: Express server with robust lazy-loaded model endpoints.
- **AI Integration**: Fallback multi-provider router supporting `LM Studio`, `Google GenAI`, and `OpenRouter`.

## 🚀 Installation

**Prerequisites:** 
- [Node.js](https://nodejs.org/) (v20+ recommended)
- [LM Studio](https://lmstudio.ai/) (Optional, for offline execution)

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/local-brain.git
   cd local-brain
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

## ⚙️ Configuration

Copy the example environment file and add your keys if you plan to use cloud providers:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Using LM Studio (100% Offline Mode)
1. Download and install [LM Studio](https://lmstudio.ai/).
2. Load a conversational model (e.g., `Llama-3.2-3B-Instruct`).
3. Start the Local Server on port `1234`.
4. Local Brain will automatically detect the running server and route queries to it!

## 🌐 GitHub Pages Setup

This repository includes a pre-built static landing page in the `/docs` directory, ready to be hosted on GitHub Pages.

To enable it:
1. Go to your repository **Settings** -> **Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Select the `main` branch and the `/docs` folder.
4. Click **Save**. Your site will be live shortly!

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
