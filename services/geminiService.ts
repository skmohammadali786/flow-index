<change>
<file>services/geminiService.ts</file>
<description>Update Gemini API key with fallback for deployment stability.</description>
<content><![CDATA[import { GoogleGenAI } from "@google/genai";
import { DailyLog, Cycle, ChatMessage } from '../types';

// Use process.env if available, otherwise fallback to the provided key for Netlify deployment stability
const API_KEY = process.env.API_KEY || "AIzaSyBfk-7HzvitKLySkFnXjrWs5CkhsTVl5HU";
const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateHealthInsight = async (
  logs: DailyLog[],
  latestCycle: Cycle,
  today: string,
  name: string
) => {
  // Filter recent logs (last 7 days)
  const recentLogs = logs.filter(l => {
    const logDate = new Date(l.date);
    const todayDate = new Date(today);
    const diff = (todayDate.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
    return diff >= 0 && diff <= 7;
  });

  const prompt = `
    You are Flow, a warm, empathetic, and knowledgeable women's health assistant for the app "Flow Index".
    User Name: ${name}
    Current Date: ${today}
    Last Period Start: ${latestCycle.startDate}
    
    Recent Logs (Last 7 days):
    ${JSON.stringify(recentLogs.map(l => ({
        date: l.date,
        symptoms: l.symptoms,
        moods: l.moods,
        water: l.water,
        sleep: l.sleep,
        flow: l.flow
    })), null, 2)}
    
    Task:
    Provide a short, 2-3 sentence personalized health insight. 
    IMPORTANT: Start the response with "Hi ${name}!". 
    Focus on where they likely are in their cycle (follicular, ovulation, luteal, menstrual).
    Acknowledge specific data logged (e.g. "Great job on water intake!", "Rest up for those cramps") with comforting advice.
    Do not give medical diagnosis. Keep it friendly, concise, and energizing.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
          systemInstruction: "You are a helpful, empathetic period tracker assistant named Flow. Always start with 'Hi [Name]!'. Keep responses short and supportive.",
      }
    });
    return response.text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Handle Quota Exceeded (429) gracefully
    const errorMsg = error?.message || JSON.stringify(error);
    if (error?.status === 429 || errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
        return `Hi ${name}! I've reached my daily energy limit (API Quota). I'll be back with more insights tomorrow!`;
    }
    
    return `Hi ${name}, I'm having trouble connecting right now. Remember to listen to your body today!`;
  }
};

export const chatWithLuna = async (history: ChatMessage[], newMessage: string, contextInfo: string) => {
     try {
        const historyText = history.slice(-6).map(msg => `${msg.role === 'user' ? 'User' : 'Flow'}: ${msg.text}`).join('\n');
        
        const prompt = `
        Context Information:
        ${contextInfo}

        Conversation History:
        ${historyText}

        User: ${newMessage}
        
        Flow (You):
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                // Explicitly instructed to use the name from context
                systemInstruction: "You are Flow, a knowledgeable and kind women's health expert for Flow Index. The user's name is provided in the Context Information. Address the user by their name to establish a personal connection. Answer questions about periods, ovulation, PMS, and sexual health. Be brief, accurate, and empathetic. If it's a medical emergency, advise seeing a doctor.",
            }
        });
        return response.text;
     } catch (e: any) {
         console.error(e);
         
         // Handle Quota Exceeded (429) gracefully
         const errorMsg = e?.message || JSON.stringify(e);
         if (e?.status === 429 || errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
             return "I've reached my daily thinking limit. Please check back tomorrow!";
         }
         
         return "I'm having a bit of trouble thinking right now. Could you ask me that again?";
     }
}]]></content>
</change>
