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

<!-- TASKMASTER_EXPORT_START -->
> 🎯 **Taskmaster Export** - 2025-06-18 09:11:07 UTC
> 📋 Export: without subtasks • Status filter: none
> 🔗 Powered by [Task Master](https://task-master.dev?utm_source=github-readme&utm_medium=readme-export&utm_campaign=visual-learn&utm_content=task-export-link)

```
╭─────────────────────────────────────────────────────────╮╭─────────────────────────────────────────────────────────╮
│                                                         ││                                                         │
│   Project Dashboard                                     ││   Dependency Status & Next Task                         │
│   Tasks Progress: ██████░░░░░░░░░░░░░░ 30%    ││   Dependency Metrics:                                   │
│   30%                                                   ││   • Tasks with no dependencies: 0                      │
│   Done: 3  In Progress: 1  Pending: 6  Blocked: 0     ││   • Tasks ready to work on: 3                          │
│   Deferred: 0  Cancelled: 0                             ││   • Tasks blocked by dependencies: 4                    │
│                                                         ││   • Most depended-on task: #3 (3 dependents)           │
│   Subtasks Progress: ████████████████░░░░     ││   • Avg dependencies per task: 1.4                      │
│   82% 82%                                               ││                                                         │
│   Completed: 14/17  In Progress: 0  Pending: 3      ││   Next Task to Work On:                                 │
│   Blocked: 0  Deferred: 0  Cancelled: 0                 ││   ID: 4.5 - Implement Node Expansion and Refocusi...     │
│                                                         ││   Priority: high  Dependencies: Some                    │
│   Priority Breakdown:                                   ││   Complexity: N/A                                       │
│   • High priority: 4                                   │╰─────────────────────────────────────────────────────────╯
│   • Medium priority: 6                                 │
│   • Low priority: 0                                     │
│                                                         │
╰─────────────────────────────────────────────────────────╯
┌───────────┬──────────────────────────────────────┬─────────────────┬──────────────┬───────────────────────┬───────────┐
│ ID        │ Title                                │ Status          │ Priority     │ Dependencies          │ Complexi… │
├───────────┼──────────────────────────────────────┼─────────────────┼──────────────┼───────────────────────┼───────────┤
│ 1         │ Project Setup and Architecture Found │ ✓ done          │ high         │ None                  │ N/A       │
├───────────┼──────────────────────────────────────┼─────────────────┼──────────────┼───────────────────────┼───────────┤
│ 2         │ LLM Provider Integration Layer       │ ✓ done          │ high         │ 1                     │ N/A       │
├───────────┼──────────────────────────────────────┼─────────────────┼──────────────┼───────────────────────┼───────────┤
│ 3         │ Graph Data Model and State Managemen │ ✓ done          │ high         │ 1                     │ N/A       │
├───────────┼──────────────────────────────────────┼─────────────────┼──────────────┼───────────────────────┼───────────┤
│ 4         │ React Flow Canvas Implementation     │ ► in-progress   │ high         │ 3                     │ N/A       │
├───────────┼──────────────────────────────────────┼─────────────────┼──────────────┼───────────────────────┼───────────┤
│ 5         │ Content Generation and Node Expansio │ ○ pending       │ medium       │ 2, 3                  │ N/A       │
├───────────┼──────────────────────────────────────┼─────────────────┼──────────────┼───────────────────────┼───────────┤
│ 6         │ Focus Mode Implementation            │ ○ pending       │ medium       │ 4, 5                  │ N/A       │
├───────────┼──────────────────────────────────────┼─────────────────┼──────────────┼───────────────────────┼───────────┤
│ 7         │ Exploration Mode Implementation      │ ○ pending       │ medium       │ 4, 5                  │ N/A       │
├───────────┼──────────────────────────────────────┼─────────────────┼──────────────┼───────────────────────┼───────────┤
│ 8         │ Data Persistence and Sharing         │ ○ pending       │ medium       │ 3                     │ N/A       │
├───────────┼──────────────────────────────────────┼─────────────────┼──────────────┼───────────────────────┼───────────┤
│ 9         │ User Interface and Experience        │ ○ pending       │ medium       │ 6, 7, 8               │ N/A       │
├───────────┼──────────────────────────────────────┼─────────────────┼──────────────┼───────────────────────┼───────────┤
│ 10        │ Accessibility, Performance, and Fina │ ○ pending       │ medium       │ 9                     │ N/A       │
└───────────┴──────────────────────────────────────┴─────────────────┴──────────────┴───────────────────────┴───────────┘
```

╭────────────────────────────────────────────── ⚡ RECOMMENDED NEXT TASK ⚡ ──────────────────────────────────────────────╮
│                                                                                                                         │
│  🔥 Next Task to Work On: #4.5 - Implement Node Expansion and Refocusing Interactions                                  │
│                                                                                                                         │
│  Priority: high   Status: ○ pending                                                                                     │
│  Dependencies: 4.3, 4.4                                                                                                     │
│                                                                                                                         │
│  Description: Add functionality to expand nodes to show more details and to refocus the graph on a selected node.     │
│                                                                                                                         │
│  Start working: task-master set-status --id=4.5 --status=in-progress                                                     │
│  View details: task-master show 4.5                                                                      │
│                                                                                                                         │
╰─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯


╭──────────────────────────────────────────────────────────────────────────────────────╮
│                                                                                      │
│   Suggested Next Steps:                                                              │
│                                                                                      │
│   1. Run task-master next to see what to work on next                                │
│   2. Run task-master expand --id=<id> to break down a task into subtasks             │
│   3. Run task-master set-status --id=<id> --status=done to mark a task as complete   │
│                                                                                      │
╰──────────────────────────────────────────────────────────────────────────────────────╯

> 📋 **End of Taskmaster Export** - Tasks are synced from your project using the `sync-readme` command.
<!-- TASKMASTER_EXPORT_END -->







