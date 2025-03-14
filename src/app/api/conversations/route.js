import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

// 대화 목록 가져오기
export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: '사용자 ID가 필요합니다.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ conversations: data || [] });
  } catch (error) {
    console.error('대화 목록 조회 오류:', error);
    return NextResponse.json({ error: '대화 목록을 불러오는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 대화 생성
export async function POST(request) {
  try {
    const { userId, title } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: '사용자 ID가 필요합니다.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        title: title || '새 대화',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ conversation: data });
  } catch (error) {
    console.error('대화 생성 오류:', error);
    return NextResponse.json({ error: '대화를 생성하는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 대화 정보 수정 (PATCH 메소드 사용)
export async function PATCH(request) {
  try {
    const { conversationId, title } = await request.json();

    if (!conversationId) {
      return NextResponse.json({ error: '대화 ID가 필요합니다.' }, { status: 400 });
    }

    const updates = {};
    if (title !== undefined) updates.title = title;

    // 업데이트할 내용이 없으면 바로 성공 반환
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true });
    }

    const { error } = await supabase
      .from('conversations')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('대화 수정 오류:', error);
    return NextResponse.json({ error: '대화를 수정하는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 대화 삭제
export async function DELETE(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const conversationId = searchParams.get('id');

    if (!conversationId) {
      return NextResponse.json({ error: '대화 ID가 필요합니다.' }, { status: 400 });
    }

    const { error } = await supabase.from('conversations').delete().eq('id', conversationId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('대화 삭제 오류:', error);
    return NextResponse.json({ error: '대화를 삭제하는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
