import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Standard Top-Level Request Deserialization (MUST be before any routes)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Security headers & CORS
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Gemini Client Lazy Initialization
let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured.");
    }
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Resilient Model Fallback Ladder with Verified Supported Models
const MODEL_LADDER = [
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.7-flash",
];

// In-memory model cooldown tracking to prioritize healthy models when quota limits (429) occur
const modelCooldownMap = new Map<string, number>();

async function generateContentWithFallback(
  contents: string | Array<{ role?: string; parts?: Array<{ text: string }> }>,
  systemInstruction?: string,
  temperature: number = 0.7
): Promise<string> {
  const ai = getGeminiClient();
  let lastError: any = null;
  const now = Date.now();

  // Prioritize models that are not currently under a 429 quota cooldown
  const sortedLadder = [...MODEL_LADDER].sort((a, b) => {
    const aCooldown = (modelCooldownMap.get(a) || 0) > now ? 1 : 0;
    const bCooldown = (modelCooldownMap.get(b) || 0) > now ? 1 : 0;
    return aCooldown - bCooldown;
  });

  for (const model of sortedLadder) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
          temperature,
        },
      });

      if (response && response.text) {
        // Clear cooldown upon successful response
        modelCooldownMap.delete(model);
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      const rawStatus = err?.status ?? err?.code ?? err?.statusCode;
      const statusNum = typeof rawStatus === "number" ? rawStatus : parseInt(String(rawStatus), 10);
      const is429 = statusNum === 429 || /resource_exhausted|quota|429/i.test(err?.message || "");

      if (is429) {
        // Cooldown this model for 90s so subsequent requests prioritize alternate fallback models
        modelCooldownMap.set(model, now + 90000);
      }

      console.log(`[Gemini Fallback] Model ${model} returned ${rawStatus || 'status'} (${err?.message?.slice(0, 80)}...). Proceeding to next model...`);

      // Retry on standard transient or recoverable status codes
      const isRecoverable =
        is429 ||
        statusNum === 404 ||
        statusNum === 500 ||
        statusNum === 503 ||
        /not found|overloaded|demand|unavailable|resource_exhausted|quota/i.test(err?.message || "");

      if (isRecoverable) {
        continue;
      }
    }
  }

  throw new Error(
    lastError?.message || "Failed to generate AI response from all available Gemini models."
  );
}

// API Health Check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Helper for defensive request body ingestion
function getSanitizedBody(req: Request): Record<string, any> {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }
  return {};
}

// 1. AI Reflection on Journal Entry
app.post("/api/ai/reflect", async (req: Request, res: Response) => {
  try {
    const body = getSanitizedBody(req);
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "Untitled Entry";
    const mood = typeof body.mood === "string" ? body.mood.trim() : "";

    if (!content) {
      return res.status(400).json({ error: "Journal content is required for reflection." });
    }

    if (content.length > 25000) {
      return res.status(400).json({ error: "Journal content exceeds maximum allowed character length (25,000)." });
    }

    const systemInstruction = `You are a gentle, deeply empathetic, insightful, and supportive AI personal journaling companion for "Personal Gemini Journal".
Your goal is to offer compassionate, thoughtful, non-judgmental reflections on the user's journal entry.
Guidelines:
1. Validate the user's emotions and experiences with warmth and sincerity.
2. Highlight meaningful patterns, resilience, gentle perspectives, or subtle insights in their writing.
3. Offer 2-3 open-ended, introspective reflection questions to help them explore their feelings deeper.
4. Keep the tone calm, soothing, empowering, and respectful of their privacy.
5. Use clean, elegant Markdown with gentle formatting (bullet points, soft bolding). Never be overly clinical or prescriptive.`;

    const prompt = `Here is the user's private journal entry:
Title: ${title}
${mood ? `Current Mood/Emoji: ${mood}` : ""}

Content:
"""
${content}
"""

Please provide a compassionate reflection and 2-3 introspective questions for the user.`;

    const result = await generateContentWithFallback(prompt, systemInstruction, 0.7);
    res.json({ success: true, reflection: result });
  } catch (error: any) {
    console.error("Error in /api/ai/reflect:", error?.message || error);
    res.status(500).json({ error: "Unable to complete AI reflection at this time. Your journal entry remains safe." });
  }
});

// 2. AI Summarization & Structured Extraction
app.post("/api/ai/summarize", async (req: Request, res: Response) => {
  try {
    const body = getSanitizedBody(req);
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";

    if (!content) {
      return res.status(400).json({ error: "Journal content is required for summarization." });
    }

    if (content.length > 25000) {
      return res.status(400).json({ error: "Journal content exceeds maximum character limit." });
    }

    const systemInstruction = `You are an expert personal reflection summarizer for "Personal Gemini Journal".
Given a journal entry, produce a comprehensive structured summary in clean Markdown format with the following sections:
- **Short Summary**: 2-3 sentences capturing the core essence and emotional arc.
- **Key Takeaways & Thoughts**: 3-4 bullet points highlighting important realizations.
- **Actionable Steps / Intentions**: 2-3 gentle next steps or healthy intentions if applicable.
- **Reflection Question**: 1 meaningful question for tomorrow.
- **Suggested Title**: A brief poetic or fitting title for this entry.`;

    const prompt = `Journal Title: ${title || "Untitled"}
Journal Content:
"""
${content}
"""

Generate the structured summary.`;

    const result = await generateContentWithFallback(prompt, systemInstruction, 0.5);
    res.json({ success: true, summary: result });
  } catch (error: any) {
    console.error("Error in /api/ai/summarize:", error?.message || error);
    res.status(500).json({ error: "Unable to generate AI summary at this moment." });
  }
});

// 3. AI Brainstorming
app.post("/api/ai/brainstorm", async (req: Request, res: Response) => {
  try {
    const body = getSanitizedBody(req);
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const promptQuery = typeof body.query === "string" ? body.query.trim() : "";

    if (!content && !promptQuery) {
      return res.status(400).json({ error: "Please provide thoughts or a topic to brainstorm." });
    }

    const systemInstruction = `You are a creative, lateral-thinking brainstorming partner for "Personal Gemini Journal".
Help the user explore creative ideas, alternative angles, solutions, creative writing prompts, or life possibilities inspired by their journal entry.
Format with clean bullet points and exciting, practical ideas.`;

    const prompt = `Journal Context:
"""
${content || "No previous text"}
"""

${promptQuery ? `User's Brainstorming Focus: ${promptQuery}` : "Please brainstorm creative ideas, possibilities, and fresh perspectives based on my writing."}`;

    const result = await generateContentWithFallback(prompt, systemInstruction, 0.8);
    res.json({ success: true, ideas: result });
  } catch (error: any) {
    console.error("Error in /api/ai/brainstorm:", error?.message || error);
    res.status(500).json({ error: "Brainstorming is temporarily unavailable." });
  }
});

// 4. AI Organize Thoughts
app.post("/api/ai/organize", async (req: Request, res: Response) => {
  try {
    const body = getSanitizedBody(req);
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!content) {
      return res.status(400).json({ error: "Journal content is required to organize." });
    }

    const systemInstruction = `You are a mindful thought-organizer for "Personal Gemini Journal".
Transform messy, stream-of-consciousness, or scattered notes into a beautifully structured, organized journal layout (e.g. Overview, Themes, Observations, Prioritized Action Items, Mindful Takeaways). Keep the user's authentic voice intact.`;

    const prompt = `Here are my scattered thoughts:
"""
${content}
"""

Please organize these thoughts into clear, structured, and legible sections while preserving my original message and feelings.`;

    const result = await generateContentWithFallback(prompt, systemInstruction, 0.4);
    res.json({ success: true, organized: result });
  } catch (error: any) {
    console.error("Error in /api/ai/organize:", error?.message || error);
    res.status(500).json({ error: "Unable to organize thoughts at this time." });
  }
});

// 5. AI Continue Writing
app.post("/api/ai/continue", async (req: Request, res: Response) => {
  try {
    const body = getSanitizedBody(req);
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!content) {
      return res.status(400).json({ error: "Journal content is required." });
    }

    const systemInstruction = `You are an intuitive creative writing companion for "Personal Gemini Journal".
The user is writing their journal and would like assistance continuing their flow of thought.
Continue writing seamlessly from where they left off, matching their tone, sentiment, and voice. Provide 1-2 thoughtful continuing paragraphs.`;

    const prompt = `Current journal draft:
"""
${content}
"""

Continue this journal entry naturally:`;

    const result = await generateContentWithFallback(prompt, systemInstruction, 0.7);
    res.json({ success: true, continuation: result });
  } catch (error: any) {
    console.error("Error in /api/ai/continue:", error?.message || error);
    res.status(500).json({ error: "Unable to continue writing right now." });
  }
});

// 6. AI Multi-turn Conversation with Journal Context
app.post("/api/ai/chat", async (req: Request, res: Response) => {
  try {
    const body = getSanitizedBody(req);
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const journalContent = typeof body.journalContent === "string" ? body.journalContent.trim() : "";
    const journalTitle = typeof body.journalTitle === "string" ? body.journalTitle.trim() : "Current Journal";
    const history = Array.isArray(body.history) ? body.history : [];

    if (!message) {
      return res.status(400).json({ error: "Message content cannot be empty." });
    }

    if (message.length > 4000) {
      return res.status(400).json({ error: "Message exceeds maximum character limit (4,000)." });
    }

    const systemInstruction = `You are Gemini, a warm, caring, confidential personal journaling companion in "Personal Gemini Journal".
You are conversing with the user specifically about their active journal entry titled "${journalTitle}".
Treat all user notes and messages as private personal thoughts. Offer empathy, mindful insights, thoughtful questions, and gentle encouragement.
Never break character or give harmful advice. Keep responses concise, warm, and formatted cleanly with Markdown.`;

    // Construct context-rich conversation prompt
    let formattedContext = `[ACTIVE JOURNAL CONTEXT]
Title: ${journalTitle}
Content:
"""
${journalContent || "(No journal text written yet)"}
"""\n\n[PREVIOUS CHAT HISTORY]\n`;

    // Take last 8 messages for context efficiency
    const recentHistory = history.slice(-8);
    for (const h of recentHistory) {
      formattedContext += `${h.role === "user" ? "User" : "Gemini"}: ${h.content}\n`;
    }

    formattedContext += `\nUser's New Message: ${message}\nGemini:`;

    const result = await generateContentWithFallback(formattedContext, systemInstruction, 0.7);
    res.json({ success: true, reply: result });
  } catch (error: any) {
    console.error("Error in /api/ai/chat:", error?.message || error);
    res.status(500).json({ error: "Gemini chat is temporarily unavailable. Please try again shortly." });
  }
});

// 7. AI Action Items Extraction
app.post("/api/ai/action-items", async (req: Request, res: Response) => {
  try {
    const body = getSanitizedBody(req);
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!content) {
      return res.status(400).json({ error: "Journal content is required." });
    }

    const systemInstruction = `You are a mindful personal coach for "Personal Gemini Journal".
Extract actionable, realistic, and gentle next steps from the user's thoughts. Format as a neat Markdown checklist with priority indications.`;

    const prompt = `Journal entry:
"""
${content}
"""

Please extract actionable steps and gentle recommendations.`;

    const result = await generateContentWithFallback(prompt, systemInstruction, 0.4);
    res.json({ success: true, actionItems: result });
  } catch (error: any) {
    console.error("Error in /api/ai/action-items:", error?.message || error);
    res.status(500).json({ error: "Unable to extract action items." });
  }
});

// 8. AI Deep Coaching Questions
app.post("/api/ai/questions", async (req: Request, res: Response) => {
  try {
    const body = getSanitizedBody(req);
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!content) {
      return res.status(400).json({ error: "Journal content is required." });
    }

    const systemInstruction = `You are a deep, philosophical, and introspective journaling coach.
Provide 4-5 probing, beautiful, and reflective questions that help the writer unwrap layers of meaning, emotional clarity, and self-discovery.`;

    const prompt = `Journal entry:
"""
${content}
"""

Provide 4-5 introspective coaching questions for deeper self-reflection.`;

    const result = await generateContentWithFallback(prompt, systemInstruction, 0.7);
    res.json({ success: true, questions: result });
  } catch (error: any) {
    console.error("Error in /api/ai/questions:", error?.message || error);
    res.status(500).json({ error: "Unable to generate questions at this moment." });
  }
});


// Vite Integration / Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Personal Gemini Journal server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
