import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/utils/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 임베딩 생성 함수
async function createEmbedding(text) {
  const { data } = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  });
  return data[0].embedding;
}

// 대화 기록 검색 함수 - 1) 현재 대화 불러오기
async function fetchConversationMessages(conversationId, limit = 10) {
  if (!conversationId) return [];

  const { data } = await supabase
    .from('rag_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return data || [];
}

// 대화 기록 검색 함수 - 2) 의미적으로 유사한 메시지 검색
async function searchSimilarMessages(embedding, userId, limit = 5) {
  try {
    const { data } = await supabase.rpc('match_rag_messages', {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: limit,
    });

    // 사용자 ID로 필터링
    return (data || []).filter((msg) => msg.user_id === userId);
  } catch (error) {
    console.error('벡터 검색 오류:', error);
    // 오류 시 디버깅 정보 추가
    console.error('오류 상세 정보:', error.message, error.details, error.hint);
    return [];
  }
}

// 컨텍스트 구성 함수
function buildContext(conversationMessages, similarMessages) {
  let contextText = '';

  // 1. 현재 대화 컨텍스트
  if (conversationMessages && conversationMessages.length > 0) {
    // 시간순 정렬
    const sortedMessages = [...conversationMessages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    contextText += '== 현재 대화 내용 ==\n';
    sortedMessages.forEach((msg) => {
      const role = msg.role === 'user' ? '사용자' : '법률 전문가';
      contextText += `${role}: ${msg.content}\n`;
    });
    contextText += '\n';
  }

  // 2. 유사한 과거 대화 컨텍스트
  if (similarMessages && similarMessages.length > 0) {
    // 대화 ID별로 그룹화
    const conversationGroups = {};
    similarMessages.forEach((msg) => {
      if (!conversationGroups[msg.conversation_id]) {
        conversationGroups[msg.conversation_id] = [];
      }
      conversationGroups[msg.conversation_id].push(msg);
    });

    contextText += '== 관련된 과거 대화 내용 ==\n';
    let groupCount = 0;

    Object.values(conversationGroups).forEach((messages) => {
      if (groupCount >= 3) return; // 최대 3개 대화만 포함

      // 각 대화 그룹 정렬
      const sortedGroupMessages = [...messages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      contextText += `[대화 ${groupCount + 1}]\n`;
      sortedGroupMessages.forEach((msg) => {
        const role = msg.role === 'user' ? '사용자' : '법률 전문가';
        contextText += `${role}: ${msg.content}\n`;
      });
      contextText += '\n';

      groupCount++;
    });
  }

  return contextText;
}

// 대화 ID 생성 또는 가져오기
async function getOrCreateConversation(userId, conversationId) {
  if (conversationId) {
    // 기존 대화 ID가 있으면 검증
    const { data } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (data) return conversationId;
  }

  // 새 대화 ID 생성
  const { data } = await supabase.from('conversations').insert({ user_id: userId }).select('id').single();

  return data?.id;
}

export async function POST(request) {
  try {
    const { message, userId, conversationId } = await request.json();

    if (!message || !userId) {
      return NextResponse.json({ error: '메시지와 사용자 ID가 필요합니다.' }, { status: 400 });
    }

    // 1. 메시지 임베딩 생성
    let messageEmbedding;
    try {
      messageEmbedding = await createEmbedding(message);
    } catch (error) {
      console.error('임베딩 생성 오류:', error);
      // 임베딩 실패해도 계속 진행
    }

    // 2. 대화 ID 가져오기 또는 새로 생성
    const activeConversationId = await getOrCreateConversation(userId, conversationId);

    // 3. 현재 대화 메시지 가져오기
    const conversationMessages = await fetchConversationMessages(activeConversationId);

    // 4. 유사한 메시지 검색 (임베딩이 있는 경우)
    let similarMessages = [];
    if (messageEmbedding) {
      similarMessages = await searchSimilarMessages(messageEmbedding, userId);
    }

    // 5. 컨텍스트 구성
    const context = buildContext(conversationMessages, similarMessages);

    // 6. OpenAI API 호출
    const systemPrompt = `당신은 대한민국의 20년 경력 변호사입니다. 
법을 잘 모르는 일반인에게 법률 문서나 계약서의 내용을 설명하는 것이 당신의 역할입니다.

다음 지침을 따라 설명해주세요:
1. 법률 용어는 반드시 쉬운 말로 풀어서 설명해주세요.
2. 일반인의 권리와 의무에 관련된 중요한 내용은 특히 강조해서 설명해주세요.
3. 해당 내용이 실생활에서 어떤 의미를 갖는지 구체적인 예시를 들어 설명해주세요.
4. 주의해야 할 사항이나 불이익이 발생할 수 있는 부분은 별도로 강조해주세요.
5. 가능한 경우, 관련된 판례나 법률 조항을 일반인이 이해하기 쉽게 언급해주세요.`;

    const messages = [{ role: 'system', content: systemPrompt }];

    if (context) {
      messages.push({
        role: 'system',
        content: context,
      });
    }

    messages.push({ role: 'user', content: message });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
    });

    const assistantResponse = completion.choices[0].message.content;

    // 7. 사용자 메시지 저장 (임베딩 포함)
    await supabase.from('rag_messages').insert({
      user_id: userId,
      conversation_id: activeConversationId,
      role: 'user',
      content: message,
      embedding: messageEmbedding,
    });

    // 8. 어시스턴트 메시지 저장 (임베딩 포함)
    let assistantEmbedding;
    try {
      assistantEmbedding = await createEmbedding(assistantResponse);
    } catch (error) {
      console.error('응답 임베딩 생성 오류:', error);
      // 임베딩 실패해도 계속 진행
    }

    await supabase.from('rag_messages').insert({
      user_id: userId,
      conversation_id: activeConversationId,
      role: 'assistant',
      content: assistantResponse,
      embedding: assistantEmbedding,
    });

    // 9. 응답 반환
    return NextResponse.json({
      response: assistantResponse,
      conversationId: activeConversationId,
    });
  } catch (error) {
    console.error('챗봇 API 오류:', error);
    return NextResponse.json({ error: '처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
