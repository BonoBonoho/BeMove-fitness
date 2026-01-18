
import { GoogleGenAI } from "@google/genai";

// Helper to safely access env vars in various environments (Vite, Node, etc.)
const getEnv = (key: string) => {
  try {
    // Check for Vite-style env vars
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key] || import.meta.env[`VITE_${key}`];
    }
  } catch (e) {}
  
  try {
    // Check for Node-style env vars (process.env)
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {}
  
  return undefined;
};

// Initialize with safe key retrieval. If no key is found, it won't crash the app immediately.
const apiKey = getEnv('API_KEY') || "";
const ai = new GoogleGenAI({ apiKey });

export const analyzeFoodImage = async (base64Image: string): Promise<{
  calories: number;
  macros: { protein: string; carbs: string; fat: string };
  description: string;
}> => {
  try {
    // Remove header if present (e.g., "data:image/jpeg;base64,")
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: `Analyze this food image. Identify the main dish.
            Return a purely JSON object (no markdown formatting) with the following structure:
            {
              "calories": number (estimated total calories),
              "protein": string (e.g., "20g"),
              "carbs": string (e.g., "50g"),
              "fat": string (e.g., "10g"),
              "description": string (short Korean description of the food)
            }`
          }
        ]
      }
    });

    const text = response.text || "{}";
    // Clean up any potential markdown code blocks if the model adds them despite instructions
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const data = JSON.parse(jsonString);

    return {
      calories: data.calories || 0,
      macros: {
        protein: data.protein || "0g",
        carbs: data.carbs || "0g",
        fat: data.fat || "0g"
      },
      description: data.description || "음식 인식 실패"
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      calories: 0,
      macros: { protein: "?", carbs: "?", fat: "?" },
      description: "AI 분석에 실패했습니다."
    };
  }
};

export const generateEncouragement = async (memberName: string, dietDescription: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a professional fitness trainer. Your client ${memberName} just ate ${dietDescription}.
      Write a short, encouraging, yet professional feedback comment in Korean (1-2 sentences). 
      If it looks healthy, praise them. If it looks unhealthy, gently suggest moderation.`
    });
    return response.text || "식단 기록 감사합니다! 오늘도 화이팅하세요.";
  } catch (error) {
    return "식단 기록이 완료되었습니다.";
  }
};

export const generateHomework = async (
  memberName: string, 
  historyContext: string, 
  targetParts: string[] 
): Promise<string> => {
  try {
    const partsString = targetParts.join(', ');
    const prompt = `
      You are a personal trainer. Create a "Solo Homework Workout" for your client, ${memberName}.
      
      Target Body Parts: ${partsString}
      
      Context (Past Exercises Taught):
      ${historyContext || "No specific history available. Suggest basic, safe bodyweight exercises."}
      
      Instructions:
      1. Recommend 3-5 exercises covering the selected target parts (${partsString}).
      2. Prioritize exercises from their history if they match the target parts (for safety).
      3. If no history matches, suggest safe alternatives suitable for solo training.
      4. Format the output as a friendly KakaoTalk message in Korean.
      5. Include specific sets and reps.
      6. Tone: Encouraging, caring, professional.
      
      Example Output Format:
      [💪 ${memberName}님을 위한 오늘의 숙제!]
      (Target: ${partsString})
      
      1. 첫번째 운동 이름 (부위)
      - 15회 x 4세트
      - 주의: 무릎이 모이지 않게 신경써주세요.
      
      2. 두번째 운동 이름 (부위)
      ...
      
      혼자서도 할 수 있어요! 화이팅!
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });

    return response.text || "운동 추천 생성에 실패했습니다.";
  } catch (error) {
    console.error("Homework Gen Error:", error);
    return `[운동 추천]\nAI 연결 상태를 확인해주세요. 기본 스쿼트/푸쉬업을 추천합니다.`;
  }
};

export const analyzeInBodyImage = async (base64Image: string): Promise<{
  weight: number;
  muscleMass: number;
  bodyFat: number;
  score: number;
}> => {
  try {
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: `Analyze this InBody result sheet (or body composition paper).
            Extract the following numbers:
            1. Weight (체중) in kg
            2. Skeletal Muscle Mass (골격근량) in kg
            3. Percent Body Fat (체지방률) in %
            4. InBody Score (인바디 점수)

            Return a purely JSON object with numeric values only (no units):
            {
              "weight": number,
              "muscleMass": number,
              "bodyFat": number,
              "score": number
            }
            If a value is not found, return 0.`
          }
        ]
      }
    });

    const text = response.text || "{}";
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(jsonString);

    return {
      weight: parseFloat(data.weight) || 0,
      muscleMass: parseFloat(data.muscleMass) || 0,
      bodyFat: parseFloat(data.bodyFat) || 0,
      score: parseFloat(data.score) || 0
    };

  } catch (error) {
    console.error("InBody Analysis Error:", error);
    return { weight: 0, muscleMass: 0, bodyFat: 0, score: 0 };
  }
};

export const analyzeWorkoutCalories = async (
  workoutContent: string, 
  duration: number, 
  weight?: number
): Promise<number> => {
  try {
    const userWeight = weight || 70; // Default weight if not provided
    
    const prompt = `
      Analyze the following workout routine and estimate total calories burned.
      
      Routine:
      ${workoutContent}
      
      Duration: ${duration} minutes
      User Weight: ${userWeight}kg
      
      Instructions:
      1. Estimate the METs (Metabolic Equivalent of Task) for the exercises described.
      2. Calculate total calories burned based on METs, duration, and weight.
      3. Return ONLY the integer number of estimated calories. Do not include text.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });

    const calories = parseInt(response.text.replace(/[^0-9]/g, ''));
    return isNaN(calories) ? Math.floor(duration * 5) : calories; // Fallback to 5kcal/min
  } catch (error) {
    console.error("Workout Calorie Analysis Error:", error);
    return Math.floor(duration * 5);
  }
};

export const generateWorkoutPlanFromInBody = async (
  memberData: { name: string; age: number; gender: string; goal: string; height?: number },
  inBodyData: { weight: number; muscleMass: number; bodyFat: number; score?: number }
): Promise<string> => {
  try {
    const prompt = `
      당신은 피트니스 센터의 수석 코치(Head Coach)입니다. 담당 트레이너가 회원(${memberData.name})의 인바디 데이터를 가져왔습니다.
      트레이너에게 이 회원을 어떻게 지도하면 좋을지 전문적인 조언과 맞춤형 운동 전략을 제안해주세요.

      [회원 프로필]
      - 이름: ${memberData.name}
      - 나이: ${memberData.age}세
      - 성별: ${memberData.gender === 'male' ? '남성' : '여성'}
      - 신장: ${memberData.height || '미입력'}cm
      - 운동 목표: ${memberData.goal}
      
      [인바디 측정 결과]
      - 체중: ${inBodyData.weight}kg
      - 골격근량: ${inBodyData.muscleMass}kg
      - 체지방률: ${inBodyData.bodyFat}%
      - 인바디 점수: ${inBodyData.score || '미측정'}점
      
      [작성 가이드]
      1. **회원 상태 분석 (Analysis)**: 인바디 수치를 바탕으로 이 회원의 현재 신체 특징을 트레이너에게 브리핑하듯이 분석해주세요. (예: "회원님은 현재 근육량이 표준 이하인 C자형 체형을 보이고 있습니다.")
      2. **지도 방향성 제안 (Strategy)**: 트레이너가 수업 시 어떤 점에 중점을 두어야 할지 조언하세요. (예: "초반 4주는 대근육 위주의 웨이트 트레이닝에 집중하여 기초 대사량을 높이는 방향으로 지도해주세요.")
      3. **추천 주간 루틴 (Routine Suggestion)**: 트레이너가 회원에게 적용할 수 있는 구체적인 1주일 분할 루틴 예시를 제시하세요.
      4. **식단 코칭 포인트 (Nutrition Guide)**: 트레이너가 회원과 상담할 때 강조해야 할 식단 가이드를 제시하세요.
      
      [말투 및 톤]
      - 수석 코치가 담당 트레이너에게 업무 지시/조언을 하는 듯한 **정중하고 전문적인 어조**를 사용하세요. ("~하는 것이 좋겠습니다", "~로 판단됩니다", "~에 집중해주세요")
      - 회원을 직접 부르지 말고, 반드시 **'${memberData.name} 회원님'**이라고 3인칭으로 지칭하세요.
      - **중요**: 이 글은 회원이 보는 것이 아니라, **트레이너가 보는 문서**입니다.
      - 마크다운(Markdown) 형식을 사용하여 가독성 좋게 출력하세요.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Using Pro for better reasoning and instruction following
      contents: prompt
    });

    return response.text || "분석 결과를 생성하지 못했습니다.";
  } catch (error) {
    console.error("Plan Gen Error:", error);
    return "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }
};
