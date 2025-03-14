import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import fetch from 'node-fetch';
import mammoth from 'mammoth';
import iconv from 'iconv-lite';

export async function POST(request) {
  try {
    const { fileUrl } = await request.json();

    // 파일 다운로드
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error('파일 다운로드 실패');
    }

    const buffer = await fileResponse.buffer();
    let text = '';

    // 파일 확장자 확인
    const ext = fileUrl.split('.').pop().toLowerCase();

    if (ext === 'docx') {
      // DOCX 처리
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (ext === 'hwp') {
      // HWP 파일의 경우 임시 메시지 반환
      text = 'HWP 파일 변환은 현재 개발 중입니다.';
    } else {
      throw new Error('지원하지 않는 파일 형식입니다.');
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error('Convert API error:', error);
    return NextResponse.json({ error: `파일 변환 중 오류가 발생했습니다: ${error.message}` }, { status: 500 });
  }
}
