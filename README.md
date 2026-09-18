<div align="center">
  <h1>Local Brain</h1>
  <p><strong>A high-precision, privacy-first desktop document intelligence assistant.</strong></p>
  <p>
    <a href="#what-is-local-brain">What is Local Brain?</a> *
    <a href="#key-benefits">Key Benefits</a> *
    <a href="#how-it-works">How it Works</a> *
    <a href="#getting-started">Getting Started</a>
  </p>
</div>

## What is Local Brain?

Local Brain is a private, intelligent document management system that runs directly on your computer. If you have hundreds of PDFs, notes, and research papers scattered across folders, finding the exact paragraph you need can be frustrating. Local Brain acts like a personal librarian with perfect memory.

Instead of just searching for keywords, you can ask Local Brain natural questions like "What did the Q3 report say about marketing budgets?" and it will read through your documents, find the exact answer, and even summarize it for you. 

The best part? It can do all of this offline. Your sensitive documents never leave your computer, ensuring absolute privacy.

**Website**: [https://cambrianminds.github.io/local-brain/](https://cambrianminds.github.io/local-brain/)

## Key Benefits

- **Absolute Privacy**: You can run Local Brain completely offline. Your files are never uploaded to the cloud unless you explicitly choose to connect a cloud provider.
- **Search by Meaning, Not Keywords**: Powered by "semantic search," Local Brain understands the context of your question. Even if you do not use the exact words written in the document, it will find what you are looking for.
- **Automatic Organization**: When you add documents, Local Brain automatically tags and categorizes them (e.g., Finance, Technical, Legal), saving you from manual filing.
- **Knowledge Wikis**: Select a topic or a group of documents, and Local Brain will synthesize the information into a comprehensive, encyclopedia-grade article.
- **Flexible AI Integration**: You have the freedom to use local, offline models (via LM Studio) or connect to powerful cloud models (like Google Gemini or OpenRouter) if you prefer.

## How it Works

When you add a document to Local Brain, the system breaks it down into small chunks and converts the text into numbers (called "vectors"). These numbers represent the meaning of the text. 

When you ask a question, your question is also converted into numbers. Local Brain then finds the document chunks that have the most similar numbers to your question. Finally, it uses an AI text generator to read those specific chunks and write a clear answer for you.

## Technical Architecture

For developers looking to contribute or understand the stack:
- **Frontend**: Built with React 19, Tailwind CSS v4, and Framer Motion for a fluid, responsive user interface.
- **Backend**: An Express.js server handles API requests, document processing, and AI model orchestration.
- **Storage**: Uses embedded LanceDB for vector storage and SQLite for relational catalog persistence (WAL mode for performance).
- **AI Router**: A fallback multi-provider routing system seamlessly switches between LM Studio (local), Google GenAI, and OpenRouter APIs.

## Getting Started

### Prerequisites

1. **Node.js**: The underlying framework required to run the application. [Download it here](https://nodejs.org/) (version 20 or higher is recommended).
2. **LM Studio (Optional)**: If you want to run the AI completely offline, you will need to download [LM Studio](https://lmstudio.ai/).

### Installation

Open your computer's terminal (or command prompt) and run the following commands:

1. **Clone the repository** (Downloads the code to your machine):
   ```bash
   git clone https://github.com/CambrianMinds/local-brain.git
   cd local-brain
   ```

2. **Install dependencies** (Downloads the required software packages):
   ```bash
   npm install
   ```

3. **Start the application**:
   ```bash
   npm run dev
   ```

Once started, the application will be available in your web browser, typically at `http://localhost:3000`.

## Configuration

You can configure Local Brain to use different AI models based on your needs.

### Using LM Studio (100% Offline Mode)

This is the recommended method for processing sensitive or confidential documents.

1. Download and install [LM Studio](https://lmstudio.ai/).
2. Open LM Studio and search for a conversational model (for example, `Llama-3.2-3B-Instruct` or `Qwen-2.5-7B`).
3. Download the model and go to the "Local Server" tab in LM Studio.
4. Start the server on port `1234`.
5. Local Brain will automatically detect the running server and begin processing your documents entirely offline.

### Using Cloud Providers (Gemini / OpenRouter)

If you prefer to use powerful cloud models and your documents are not sensitive:

1. Copy the example configuration file:
   ```bash
   cp .env.example .env.local
   ```
2. Open the new `.env.local` file in a text editor and add your API keys:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

## GitHub Pages Setup

This repository includes a pre-built static landing page in the `/docs` directory. This is perfect for hosting a public website for the project.

To enable it on GitHub:
1. Go to your repository **Settings** -> **Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Select the `main` branch and change the folder from `/ (root)` to `/docs`.
4. Click **Save**. Your site will be live shortly!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
