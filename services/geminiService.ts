
import { GoogleGenAI, Type } from "@google/genai";
import { Question, Banca, Materia } from "../types";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateQuestion = async (banca: Banca, materia: Materia): Promise<Question> => {
  // Use gemini-3-pro-preview for complex reasoning tasks like generating questions
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Gere uma questão de múltipla escolha inédita no estilo da banca ${banca} para a matéria de ${materia}. 
    A questão deve ter 5 alternativas (A-E). Retorne no formato JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          statement: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                text: { type: Type.STRING }
              }
            }
          },
          correctAnswerId: { type: Type.STRING },
          explanation: { type: Type.STRING }
        }
      }
    }
  });

  const data = JSON.parse(response.text || '{}');
  return {
    ...data,
    id: Math.random().toString(36).substr(2, 9),
    banca,
    materia
  };
};

export const chatWithTutor = async (history: {role: string, parts: any[]}[], message: string) => {
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: 'Você é um tutor especializado em concursos públicos no Brasil. Ajude o aluno a entender conceitos de Direito, Português e outras matérias. Seja didático e incentive o estudo.',
    }
  });
  
  const response = await chat.sendMessage({ message });
  return response.text;
};

export const findStudyPlaces = async (lat: number, lng: number) => {
  // Maps grounding is only supported in Gemini 2.5 series models.
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Quais são as melhores bibliotecas, salas de estudo ou cursinhos preparatórios perto de mim?",
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: {
            latitude: lat,
            longitude: lng
          }
        }
      }
    },
  });

  const places = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  return {
    text: response.text,
    places: places.map((chunk: any) => ({
      title: chunk.maps?.title || 'Local de Estudo',
      uri: chunk.maps?.uri || '#'
    }))
  };
};

export const editStudyImage = async (base64Image: string, prompt: string) => {
  // Use gemini-2.5-flash-image for image editing tasks
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/png' } },
        { text: `Edite esta imagem de material de estudo: ${prompt}` }
      ]
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const getLatestNews = async (query: string) => {
  // Use gemini-3-flash-preview for basic text tasks with search grounding
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Traga notícias recentes e editais abertos sobre: ${query}`,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};
