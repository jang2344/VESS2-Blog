import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Lazy-loaded design for Google GenAI to avoid crashing on startup if key is missing
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set. Please set it in Settings > Secrets to use AI features.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: process.env.NODE_ENV || "development" });
  });

  // AI-Powered Blog Writing Assistant Route
  app.post("/api/assistant/generate", async (req, res) => {
    try {
      const { task, prompt, text, style, tags } = req.body;

      if (!task) {
        res.status(400).json({ error: "Task identifier is required." });
        return;
      }

      const client = getAiClient();
      let systemInstruction = "You are a highly creative and skilled writing assistant for an editorial blog named 'vess2 Blog' (hosted on blog.vess2.com). Generate responses directly, cleanly, and write key paragraphs in natural Korean as requested, matching the requested tone perfectly. Use Markdown formatting inside your response.";
      let userPrompt = "";

      switch (task) {
        case "draft":
          userPrompt = `Write a complete, highly engaging blog post draft based on the following topic or brief outline: "${prompt}". 
          The tone should be: "${style || 'professional, natural, clear'}". 
          Write it in elegant Korean. Include some markdown headings, paragraphs, and lists as appropriate. Feel free to structure it beautifully.`;
          break;
        case "improve":
          userPrompt = `Act as an editor. Refine, proofread, and enhance the following blog post draft. Correct any typos, improve syntax, and elevate the vocabulary:
          
          "${text}"
          
          Maintain the core idea but make it sound "${style || 'highly polished and natural'}". Write the revised text in Korean and return only the revised editorial version in clean Markdown.`;
          break;
        case "excerpt":
          userPrompt = `Based on this blog post text, generate a single-paragraph concise, engaging reader-focused summary/excerpt (around 2-3 sentences max) to be shown on the home page card:
          
          "${text}"
          
          Write it in natural, enticing Korean. Do not include any meta commentary.`;
          break;
        case "tags":
          userPrompt = `Review this blog post text and suggest a JSON list of 3 to 5 highly relevant, modern tags or keywords in Korean.
          Return ONLY a JSON array of strings, for example: ["Tech", "인공지능", "개발"]. No other text:
          
          "${text}"`;
          break;
        case "titles":
          userPrompt = `Create 5 brilliant, highly clickable, SEO-friendly alternative titles in Korean for a blog post based on this outline or content:
          
          "${prompt || text}"
          
          Return them as a simple numbered list in Korean.`;
          break;
        default:
          res.status(400).json({ error: `Unsupported task: ${task}` });
          return;
      }

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const responseText = response.text || "";
      res.json({ result: responseText.trim() });
    } catch (error: any) {
      console.error("AI Assistant Error:", error);
      res.status(500).json({ 
        error: error.message || "An error occurred during content generation." 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start full-stack server:", err);
});
