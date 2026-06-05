import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent rooms file storage helper
const ROOMS_FILE = path.join(process.cwd(), "rooms.json");

interface SupplyItem {
  id: string;
  name: string;
  category: string;
  estimatedCost: number;
  actualCost: number;
  purchased: boolean;
  addedBy: string;
  createdAt: number;
  approvals?: string[];
  storeUrl?: string;
}

interface BudgetRoom {
  id: string;
  name: string;
  totalBudget: number;
  gradeLevel: string;
  categoryLimits: Record<string, number>;
  items: SupplyItem[];
  members: Record<string, number>; // username -> lastSeen timestamp
}

let roomsCache: Record<string, BudgetRoom> = {};

function loadRooms() {
  try {
    if (fs.existsSync(ROOMS_FILE)) {
      const data = fs.readFileSync(ROOMS_FILE, "utf-8");
      roomsCache = JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading rooms.json, starting clean in-memory", err);
    roomsCache = {};
  }
}

function saveRooms() {
  try {
    fs.writeFileSync(ROOMS_FILE, JSON.stringify(roomsCache, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving rooms.json", err);
  }
}

// Initial load
loadRooms();

// Initialize Gemini client lazily
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not configured. Please add it to your environment Secrets.");
    }
    geminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return geminiClient;
}

const DEFAULT_CATEGORIES = [
  "Technology & Devices",
  "Apparel & Uniforms",
  "Core Supplies",
  "Fees & Subscriptions",
  "Other / Misc"
];

const DEFAULT_LIMITS = {
  "Technology & Devices": 150,
  "Apparel & Uniforms": 150,
  "Core Supplies": 100,
  "Fees & Subscriptions": 50,
  "Other / Misc": 50
};

// Helper: Get or initialize room
function getOrInitializeRoom(roomId: string): BudgetRoom {
  const sanitizedId = roomId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  if (!roomsCache[sanitizedId]) {
    roomsCache[sanitizedId] = {
      id: sanitizedId,
      name: roomId.toLowerCase().startsWith("evelyn") ? "Evelyn's School Budget" : (roomId.trim() ? `Room ${roomId}` : "Shared Family Budget"),
      totalBudget: 500,
      gradeLevel: "general",
      categoryLimits: { ...DEFAULT_LIMITS },
      items: [],
      members: {}
    };
    saveRooms();
  }
  return roomsCache[sanitizedId];
}

// REST API Routes

// 1. Get room state with member list
app.get("/api/rooms/:roomId", (req, res) => {
  const { roomId } = req.params;
  const room = getOrInitializeRoom(roomId);
  
  // Clean up inactive members (older than 15 seconds)
  const now = Date.now();
  const activeMembers: string[] = [];
  let updated = false;
  
  for (const [name, lastSeen] of Object.entries(room.members)) {
    if (now - lastSeen < 15000) {
      activeMembers.push(name);
    } else {
      delete room.members[name];
      updated = true;
    }
  }
  
  if (updated) {
    saveRooms();
  }
  
  res.json({
    id: room.id,
    name: room.name,
    totalBudget: room.totalBudget,
    gradeLevel: room.gradeLevel,
    categoryLimits: room.categoryLimits,
    items: room.items,
    members: activeMembers
  });
});

// 2. Register/heartbeat presence
app.post("/api/rooms/:roomId/presence", (req, res) => {
  const { roomId } = req.params;
  const { username } = req.body;
  if (!username || typeof username !== "string") {
    res.status(400).json({ error: "username is required" });
    return;
  }
  
  const room = getOrInitializeRoom(roomId);
  room.members[username.trim()] = Date.now();
  saveRooms();
  
  res.json({ success: true });
});

// 3. Update broad room settings
app.post("/api/rooms/:roomId/update", (req, res) => {
  const { roomId } = req.params;
  const { name, totalBudget, gradeLevel, categoryLimits } = req.body;
  
  const room = getOrInitializeRoom(roomId);
  
  if (name !== undefined) room.name = name;
  if (totalBudget !== undefined) room.totalBudget = Number(totalBudget) || 0;
  if (gradeLevel !== undefined) room.gradeLevel = gradeLevel;
  if (categoryLimits !== undefined) {
    room.categoryLimits = { ...room.categoryLimits, ...categoryLimits };
  }
  
  saveRooms();
  res.json({ success: true, room });
});

// 4. Add or manage items
app.post("/api/rooms/:roomId/items", (req, res) => {
  const { roomId } = req.params;
  const { action, item } = req.body; // action: 'add' | 'update' | 'delete' | 'clear-all'
  
  const room = getOrInitializeRoom(roomId);
  
  if (action === "add") {
    if (!item || !item.name) {
      res.status(400).json({ error: "Item name is required" });
      return;
    }
    const newItem: SupplyItem = {
      id: Math.random().toString(36).substring(2, 9),
      name: item.name,
      category: item.category || "Core Supplies",
      estimatedCost: Number(item.estimatedCost) || 0,
      actualCost: Number(item.actualCost) || 0,
      purchased: !!item.purchased,
      addedBy: item.addedBy || "Anonymous",
      createdAt: Date.now(),
      approvals: item.approvals || [],
      storeUrl: item.storeUrl || ""
    };
    room.items.push(newItem);
  } else if (action === "update") {
    const idx = room.items.findIndex(it => it.id === item.id);
    if (idx !== -1) {
      room.items[idx] = {
        ...room.items[idx],
        ...item,
        estimatedCost: Number(item.estimatedCost) ?? room.items[idx].estimatedCost,
        actualCost: Number(item.actualCost) ?? room.items[idx].actualCost
      };
    }
  } else if (action === "delete") {
    room.items = room.items.filter(it => it.id !== item.id);
  } else if (action === "clear-all") {
    room.items = [];
  }
  
  saveRooms();
  res.json({ success: true, items: room.items });
});

// 5. Intelligent AI planning using Gemini 3.5-flash
app.post("/api/rooms/:roomId/ai-suggest", async (req, res) => {
  const { roomId } = req.params;
  const { gradeLevel, totalBudget } = req.body;
  
  try {
    const ai = getGeminiClient();
    
    // Construct prompt
    const prompt = `Suggest back-to-school supply checklist items for a student entering ${gradeLevel || "general school"} with an overall target budget of $${totalBudget || 500}. 
    Provide typical price estimates. Each item must fit into exactly one of these five categories:
    - "Technology & Devices"
    - "Apparel & Uniforms"
    - "Core Supplies"
    - "Fees & Subscriptions"
    - "Other / Misc"

    Your output MUST be standard valid JSON featuring:
    1. "suggestions": A list of items to buy, each item containing:
       - "name" (e.g. "College-Ruled Spiral Notebook")
       - "category" (Must exactly match one of the five categories listed above)
       - "estimatedCost" (A practical number, e.g. 5.99)
       - "reason" (A brief helpful item tip under 12 words)
    2. "savingsTips": A list of exactly 3 highly specific, highly actionable cost-saving strategies for this grade level and budget.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["suggestions", "savingsTips"],
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["name", "category", "estimatedCost", "reason"],
                properties: {
                  name: { type: Type.STRING },
                  category: { 
                    type: Type.STRING,
                    enum: [
                      "Technology & Devices",
                      "Apparel & Uniforms",
                      "Core Supplies",
                      "Fees & Subscriptions",
                      "Other / Misc"
                    ]
                  },
                  estimatedCost: { type: Type.NUMBER },
                  reason: { type: Type.STRING }
                }
              }
            },
            savingsTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const bodyText = response.text;
    if (!bodyText) {
      throw new Error("No response body received from Gemini AI.");
    }
    
    // Try to parse JSON safely
    const parsedData = JSON.parse(bodyText.trim());
    res.json(parsedData);
  } catch (err: any) {
    console.error("Error generating with Gemini AI:", err);
    res.status(500).json({ error: err.message || "Failed to communicate with the Gemini AI service." });
  }
});

// Vite server integration middleware and static serving
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
