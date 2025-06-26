# AI Recipe Extractor ![In Progress](https://img.shields.io/badge/IN%20PROGRESS-C23F84)

[![OpenAI](https://img.shields.io/badge/OpenAI-74aa9c?style=for-the-badge&logo=openai&logoColor=white)](#)
![Notion](https://img.shields.io/badge/Notion-000?style=for-the-badge&logo=notion&logoColor=white)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000?style=for-the-badge&logo=shadcnui&logoColor=fff)](#)
![Next.js](https://img.shields.io/badge/Next.js-000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Prettier](https://img.shields.io/badge/prettier-%23F7B93E.svg?style=for-the-badge&logo=prettier&logoColor=black)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)
![REST API](https://img.shields.io/badge/REST_API-%23EE2950.svg?style=for-the-badge&logo=fastapi&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-222?style=for-the-badge&logo=pnpm&logoColor=F69220)

A modern web app that extracts recipes from any website and saves them to your Notion database using OpenAI agents. Built with Next.js, TypeScript, and a shared UI component library.

https://github.com/user-attachments/assets/494c6796-d86f-44e5-b276-4133cdec2b90

## 🚀 Features

- **Extract recipes** from any URL
- **Detect language** of the recipe text
- **Translate the recipe** (optional)
- **Save recipes** to your Notion database (with all key fields and content blocks)
- **OpenAI-powered** multi-agent pipeline for smart extraction and publishing
- **REST API** with streamed response for easy integration
- **Monorepo** with shared UI components and configs

## 🛠️ Getting Started

### 1. **Clone the Repository**

```bash
git clone <your-repo-url>
cd recipe-agent
```

### 2. **Install Dependencies**

We use [pnpm](https://pnpm.io/) for fast, monorepo-friendly installs:

```bash
pnpm install
```

### 3. **Set Up Environment Variables**

Create a `.env` file in `apps/web` with the following:

```env
NOTION_TOKEN=your_notion_integration_token
NOTION_DATABASE_ID=your_notion_database_id
OPENAI_API_KEY=your_openai_api_key
```

- **NOTION_TOKEN**: [Create a Notion integration](https://developers.notion.com/docs/create-a-notion-integration) and copy the token.
- **NOTION_DATABASE_ID**: [Create a Notion database](https://www.notion.so/help/guides/database) and copy its ID from the URL.
- **OPENAI_API_KEY**: [Get your OpenAI API key](https://platform.openai.com/account/api-keys).

### 4. **Run the App Locally**

```bash
pnpm --filter web dev
```

- The app will be available at [http://localhost:3000](http://localhost:3000)

## 📦 Project Structure

```
recipe-agent/
├── apps/
│   └── web/         # Main Next.js app (API & frontend)
├── packages/
│   ├── ui/          # Shared UI components
│   ├── eslint-config/   # Shared lint config
│   └── typescript-config/ # Shared TS config
```

## 🧑‍🍳 How Recipe Extraction Works

1. **POST** to `/api/recipe` with `{ "url": "https://example.com/recipe-url", "targetLanguage": "cs" }`
2. The pipeline:
- Crawls the webpage and extracts clean, readable text.
- Detects the recipe's language (supported languages: English, Czech, and Greek).
- Uses OpenAI to convert the recipe into a structured JSON schema.
- Translates the recipe into the target language (based on ISO 639-1), only if different from the detected language. (optional)
- Publishes the recipe to your Notion database, including all fields and content blocks. For now Notion DB must already exist and item schema needs to be identical as the created recipe.

3. **Response**: Success message and result details

### Example: Extract a Recipe Using `curl`

```bash
curl -X POST http://localhost:3000/api/recipe \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.example.com/your-favorite-recipe", "targetLanguage": "cs"}'
```

**Sample Response:**

```json
{
  "success": true,
  "result": "<notion-page-id>",
  "message": "Successfully processed recipe from https://www.example.com/your-favorite-recipe"
}
```

See [`apps/web/lib/example-usage.md`](apps/web/lib/example-usage.md) for full API usage and Notion setup instructions.

## 🧩 Adding UI Components

To add a new UI component (e.g., Button):

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

- Components are placed in `packages/ui/src/components` and shared across the app.
