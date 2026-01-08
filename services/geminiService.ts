
import { GoogleGenAI, Type } from "@google/genai";
import { Question, Banca, Materia, Nivel, MnemonicResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateQuestion = async (banca: Banca, materia: Materia, nivel: Nivel): Promise<Question> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Gere uma questão de múltipla escolha inédita.
    BANCA: "${banca}"
    MATÉRIA: "${materia}"
    NÍVEL: "${nivel}"
    
    Estilo: Fiel à banca. 5 alternativas (A-E). Responda apenas JSON puro.`,
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
        },
        required: ["statement", "options", "correctAnswerId", "explanation"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("IA não retornou dados.");
  const data = JSON.parse(text);
  
  return {
    ...data,
    id: `Q-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    banca,
    materia,
    nivel
  };
};

export const generateEssayTheme = async (banca: Banca): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Gere um tema de redação inédito e atualizado, típico da banca "${banca}". O tema deve ser relevante para concursos de nível médio ou superior. Retorne apenas o título/frase temática.`,
  });
  return response.text || "Importância da ética no serviço público";
};

export const getEssayTips = async (theme: string, banca: Banca) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Como professor especialista na banca ${banca}, forneça 4 dicas muito simples, claras e fáceis de entender para o tema: "${theme}".
    Use uma linguagem "pé no chão", sem termos técnicos complicados. Explique como se estivesse conversando com um amigo que está começando agora.
    As dicas devem ser:
    1. Como começar o texto (Introdução) de um jeito simples.
    2. O que colocar no meio do texto (Desenvolvimento) para ganhar pontos.
    3. Como terminar o texto (Conclusão) sem erro.
    4. Troca de palavras: 3 exemplos de palavras comuns que podem ser trocadas por outras mais bonitas de forma fácil.
    
    Retorne apenas um array JSON com 4 strings curtas e diretas.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });
  return JSON.parse(response.text || "[]");
};

export const evaluateEssayImage = async (base64Image: string, theme: string, banca: Banca) => {
  const mimeTypeMatch = base64Image.match(/^data:(image\/[a-z]+);base64,/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
  const pureBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: pureBase64, mimeType } },
        { text: `Você é um avaliador de redações nível mestre para a banca ${banca}. 
        Analise a foto da redação manuscrita para o tema: "${theme}".
        Dê um feedback honesto e técnico no formato JSON.
        
        Campos obrigatórios:
        - grade: Nota de 0 a 100 baseada nos critérios da banca.
        - pros: Array de pontos fortes (ex: boa estruturação, vocabulário).
        - cons: Array de erros e melhorias (ex: erros gramaticais, fuga parcial do tema).
        - tips: Uma dica matadora para a próxima.
        - fullAnalysis: Texto detalhado explicando a nota.` }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          grade: { type: Type.STRING },
          pros: { type: Type.ARRAY, items: { type: Type.STRING } },
          cons: { type: Type.ARRAY, items: { type: Type.STRING } },
          tips: { type: Type.STRING },
          fullAnalysis: { type: Type.STRING }
        },
        required: ["grade", "pros", "cons", "tips", "fullAnalysis"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("A IA não retornou uma análise válida.");
  return JSON.parse(text);
};

export const generateMnemonic = async (materia: Materia): Promise<MnemonicResponse> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Crie um mnemônico criativo e eficaz para ajudar a memorizar um conceito fundamental da matéria "${materia}" em concursos públicos. 
    A resposta deve conter:
    1. A frase mnemônica (ex: LIMPE).
    2. O que cada letra ou parte significa.
    3. Uma explicação breve do conceito.
    Retorne apenas JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          phrase: { type: Type.STRING },
          meaning: { type: Type.STRING },
          explanation: { type: Type.STRING }
        },
        required: ["phrase", "meaning", "explanation"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Falha ao gerar mnemônico.");
  return JSON.parse(text);
};

export const getLatestNews = async (query: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Pesquise e organize as informações mais recentes e editais oficiais sobre: ${query}. 
    A sua resposta DEVE ser estritamente organizada em duas seções principais usando títulos Markdown (##):
    1. ## Concursos Abertos
    2. ## Concursos Solicitados
    
    Para cada concurso, seja objetivo e destaque a banca (se houver), vagas e salários. Use listas com marcadores. 
    Mantenha o tom profissional e direto.`,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  return {
    text: response.text,
    // Extract website URLs from groundingMetadata as per guidelines
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const editStudyImage = async (base64Image: string, prompt: string) => {
  const mimeTypeMatch = base64Image.match(/^data:(image\/[a-z]+);base64,/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';
  const pureBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: pureBase64, mimeType } },
        { text: `Aprimore esta imagem de estudo: ${prompt}. Retorne a imagem editada.` }
      ]
    }
  });

  // Find the image part explicitly as per guidelines
  const part = response.candidates?.[0]?.content?.parts.find((p: any) => p.inlineData);
  return part ? `data:${mimeType};base64,${part.inlineData.data}` : null;
};

export const generateMindMapFromDescription = async (prompt: string): Promise<string | null> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: `Crie um mapa mental profissional, limpo e didático em português sobre: ${prompt}. O mapa deve ter cores sóbrias, ser organizado e fácil de ler. Use fontes legíveis.` }
      ]
    }
  });

  // Find the image part explicitly as per guidelines
  const part = response.candidates?.[0]?.content?.parts.find((p: any) => p.inlineData);
  return part ? `data:image/png;base64,${part.inlineData.data}` : null;
};

export const transcribeAndSummarizeAudio = async (base64Audio: string): Promise<string> => {
  // Using the recommended { parts: [...] } structure for contents
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Audio,
            mimeType: 'audio/webm'
          }
        },
        {
          text: "Transcreva este áudio e organize os pontos principais em um resumo estruturado para criar um mapa mental."
        }
      ]
    }
  });
  return response.text || "Conteúdo não processado.";
};
