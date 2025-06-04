import { GoogleGenAI } from "@google/genai";
import { 
    CV_FORM_DATA_TRANSLATION_PROMPT_TEMPLATE_ID,
    CV_REGENERATION_FROM_REVIEW_PROMPT_TEMPLATE,
    FORMAL_ATS_CV_GENERATION_PROMPT_TEMPLATE_ID
} from '../../constants.js'; // Adjusted path to root constants.js


const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn(
    "Gemini API key is not set in process.env.API_KEY. CV review and generation will not work."
  );
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "MISSING_API_KEY" }); 
const model = 'gemini-2.5-flash-preview-04-17';

const callGeminiAPI = async (prompt, operation, isJsonOutput = false) => {
  if (!API_KEY || API_KEY === "MISSING_API_KEY") {
    throw new Error(
      `API Key for Gemini not configured. Cannot perform ${operation}. Please set the API_KEY environment variable.`
    );
  }

  try {
    console.log(`Calling Gemini for ${operation}. Prompt:`, prompt.substring(0, 500) + "..."); 
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
      }
    });
    
    let textResponse = response.text;
    if (!textResponse) {
        throw new Error(`Received an empty response from the AI for ${operation}. Please try again.`);
    }

    if (isJsonOutput) {
        let jsonStr = textResponse.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }
        try {
            JSON.parse(jsonStr); 
            return jsonStr; 
        } catch (e) {
            console.warn(`AI response for ${operation} was not valid JSON, despite expectation. Falling back to text. Error: ${e}. Raw response: ${textResponse}`);
        }
    }
    return textResponse;

  } catch (error) {
    console.error(`Error calling Gemini API for ${operation}:`, error);
    if (error instanceof Error) {
        if (error.message.includes("API key not valid")) {
             throw new Error("The provided API Key is not valid. Please check your environment configuration.");
        }
         throw new Error(`Gemini API request for ${operation} failed: ${error.message}`);
    }
    throw new Error(`An unknown error occurred while fetching ${operation} from Gemini API.`);
  }
};

export const getCVReview = async (prompt) => {
  return callGeminiAPI(prompt, "CV review");
};

export const generateCvFromFormData = async (
    cvData, 
    language
  ) => {
    const langString = language === 'id' ? 'Bahasa Indonesia formal' : 'English formal';
    const prompt = FORMAL_ATS_CV_GENERATION_PROMPT_TEMPLATE_ID
      .replace("[CV_FORM_DATA_JSON_HERE]", JSON.stringify(cvData, null, 2))
      .replace(/\[TARGET_LANGUAGE_HERE\]/g, langString);
    return callGeminiAPI(prompt, `Formal ATS CV generation in ${langString}`);
  };

export const refineCvSectionText = async (prompt) => {
  return callGeminiAPI(prompt, "CV text section refinement");
};

export const generateOptimizedCvFromReview = async (
    originalCvText,
    reviewText,
    language
  ) => {
    const langString = language === 'id' ? 'Bahasa Indonesia formal' : 'English formal';
    const prompt = CV_REGENERATION_FROM_REVIEW_PROMPT_TEMPLATE
      .replace("[CV_TEXT_HERE]", originalCvText)
      .replace("[CV_REVIEW_HERE]", reviewText)
      .replace(/\[TARGET_LANGUAGE_HERE\]/g, langString);
    return callGeminiAPI(prompt, `Optimized CV generation from review in ${langString}`);
  };

export const translateCvFormDataToEnglish = async (formData) => {
    const prompt = CV_FORM_DATA_TRANSLATION_PROMPT_TEMPLATE_ID.replace(
      "[CV_FORM_DATA_JSON_HERE]",
      JSON.stringify(formData, null, 2)
    );
    const translatedJsonString = await callGeminiAPI(prompt, "CV form data translation to English", true); 
    try {
      return JSON.parse(translatedJsonString);
    } catch (e) {
      console.error("Failed to parse translated CV form data JSON:", e, "Raw string from AI:", translatedJsonString);
      throw new Error("Gagal mem-parsing data CV yang sudah diterjemahkan dari AI. Respons AI tidak valid JSON.");
    }
  };