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

다음 지침을 따라 설명해주세요:
1. 법률 용어는 반드시 쉬운 말로 풀어서 설명해주세요.
2. 일반인의 권리와 의무에 관련된 중요한 내용은 특히 강조해서 설명해주세요.
3. 해당 내용이 실생활에서 어떤 의미를 갖는지 구체적인 예시를 들어 설명해주세요.
4. 주의해야 할 사항이나 불이익이 발생할 수 있는 부분은 별도로 강조해주세요.
5. 가능한 경우, 관련된 판례나 법률 조항을 일반인이 이해하기 쉽게 언급해주세요.

설명 형식:
[문서의 핵심 요약]
- 일반인의 관점에서 이 문서가 의미하는 바

[주요 내용 설명]
- 중요한 내용들을 쉽게 풀어서 설명

[실생활 적용]
- 실제 생활에서 어떻게 적용되는지 예시

[주의사항]
- 특별히 주의해야 할 점들

[조언]
- 법률 전문가로서의 조언이나 추천사항`,
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
