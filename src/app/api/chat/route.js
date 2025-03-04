import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export async function POST(request) {
  if (!process.env.DEEPSEEK_API_KEY) {
    console.error('DEEPSEEK_API_KEY is not set');
    return NextResponse.json(
      { error: "DeepSeek API key is not configured" },
      { status: 500 }
    );
  }

  try {
    const { messages } = await request.json();
    
    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid messages format:', messages);
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: `당신은 대한민국의 전문 변호사입니다. 다음과 같은 원칙을 따라 답변해주세요:

1. 전문성:
- 최신 법률 정보와 판례를 기반으로 답변
- 법률 용어를 적절히 사용하되, 일반인도 이해하기 쉽게 설명
- 관련 법조항이나 판례가 있다면 구체적으로 언급

2. 답변 구조:
- 답변은 항상 체계적으로 구조화하여 제시
- 핵심 내용을 먼저 요약하고 상세 설명 제공
- 필요한 경우 단계별로 해결 방안 제시

3. 책임 있는 조언:
- 법적 조언의 한계를 명확히 설명
- 필요한 경우 전문가 상담을 권고
- 불확실한 사항에 대해서는 솔직히 인정

4. 추가 안내:
- 관련될 수 있는 다른 법적 고려사항도 언급
- 필요한 경우 구체적인 절차나 준비사항 안내
- 도움이 될 만한 기관이나 자료 추천`
        },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return NextResponse.json({ 
      response: completion.choices[0].message.content 
    });
  } catch (error) {
    console.error('Detailed DeepSeek API Error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    
    return NextResponse.json(
      { 
        error: "API 오류가 발생했습니다.",
        details: error.message,
        type: error.type
      },
      { status: 500 }
    );
  }
}