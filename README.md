# Visual Learn: Concept Graph Explorer

**Visual Learn** is a frictionless, interactive learning tool that empowers users to visually explore and understand complex technical concepts. By leveraging the generative power of Large Language Models (LLMs), the application transforms learning from a passive reading exercise into an active, self-directed journey of discovery.

This project is a web-only, client-side Concept Graph Explorer that generates interactive, node-based graphs to visualize knowledge domains.

## Key Features

-   **Dual Graph Modes**:
    -   **Focus Mode**: A guided, linear path for a structured, step-by-step curriculum on a new topic.
    -   **Exploration Mode**: A radial mind-map for open-ended discovery and understanding the interconnectedness of a knowledge domain.
-   **LLM-Powered Content**: All conceptual content is generated on-demand by a user-selected LLM (OpenAI, Anthropic, or OpenRouter).
-   **Client-Side & Private**: The application is entirely browser-based with no backend. API keys and graph data are stored locally in your browser, ensuring privacy and user control.
-   **Data Persistence & Sharing**:
    -   Export and import graph states as JSON files.
    -   Generate shareable links that encode the entire graph, allowing you to share your knowledge maps with others.
-   **Rich User Interface**: Built with React Flow, providing a smooth, interactive experience with panning, zooming, and a minimap for easy navigation.

## Tech Stack

-   **Frontend**: React, TypeScript, Vite
-   **Graph Visualization**: React Flow
-   **State Management**: Zustand (or similar)
-   **LLM Integration**: Modular abstraction for various LLM providers.

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/visual-learn.git
    cd visual-learn
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up your environment:**
    You'll need an API key from an LLM provider (like OpenAI). The application will prompt you to enter this in the settings panel.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or another port if 5173 is busy).

## How It Works

The application leverages a user-provided LLM API key to generate content. When you enter a topic, the LLM generates a structured JSON response containing the concept's title, keywords, a detailed explanation, and other metadata. This data is then used to build and render the interactive graph. You can find more details in the [Product Requirements Document](.taskmaster/docs/prd.txt).
