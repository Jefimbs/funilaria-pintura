import { GoogleGenAI } from "@google/genai";
import { Job, Photo } from "../types";

const getClient = () => {
  // In a real app, check if key exists.
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeCarImage = async (base64Image: string): Promise<string> => {
  try {
    const ai = getClient();
    // Remove header if present (data:image/jpeg;base64,)
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Efficient for image + text
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: "Você é um especialista em funilaria e pintura automotiva. Analise esta imagem. Descreva brevemente o dano visível (se houver) ou o estado da peça. Seja técnico mas conciso (máx 2 frases)."
          }
        ]
      }
    });

    return response.text || "Não foi possível analisar a imagem.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Erro ao conectar com a IA.";
  }
};

export const generateUpdateMessage = async (job: Job, latestPhoto: Photo | null): Promise<string> => {
  try {
    const ai = getClient();
    const prompt = `
      Aja como um assistente profissional de uma oficina de funilaria chamada "AutoColor".
      Escreva uma mensagem curta e educada para WhatsApp para o cliente ${job.client.name}.
      O carro é um ${job.vehicle.model} (${job.vehicle.color}).
      O status atual do serviço é: ${job.status}.
      ${latestPhoto ? `Acabamos de adicionar uma nova foto da etapa: ${latestPhoto.stage}.` : ''}
      Convide o cliente para ver o progresso no link (use apenas [LINK] como placeholder).
      Não use hashtags. Use emojis moderados.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    return response.text || `Olá ${job.client.name}, atualização sobre seu ${job.vehicle.model}. Status: ${job.status}. Veja a foto nova no sistema!`;
  } catch (error) {
    console.error("Gemini Text Error:", error);
    return `Olá ${job.client.name}, o status do seu ${job.vehicle.model} mudou para ${job.status}.`;
  }
};