import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: '텍스트가 제공되지 않았습니다.' }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `당신은 대한민국의 20년 경력 변호사입니다. 
법을 잘 모르는 일반인에게 법률 문서나 계약서의 내용을 설명하는 것이 당신의 역할입니다.
거짓으로 지어내는 내용 같은거 없이 객관적 사실만을 토대로 말해줘.
`,
        },
        {
          role: 'user',
          content: `다음 법률 문서를 일반인이 이해하기 쉽게 설명해주세요:\n\n${text}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return NextResponse.json({ summary: completion.choices[0].message.content });
  } catch (error) {
    console.error('OpenAI API 오류:', error);
    return NextResponse.json({ error: '요약 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
