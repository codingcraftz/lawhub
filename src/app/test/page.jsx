'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import { Loader2, FileUp, Copy, Download, FileText, Trash2, ClipboardCopy } from 'lucide-react';

// PDF.js 워커 설정
GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const BUCKET_NAME = 'test';
const SUPABASE_FUNCTION_URL = 'https://aftoetywijtlqzavhnaq.supabase.co/functions/v1/convert-file';

export default function FileExtractorPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [extractedTexts, setExtractedTexts] = useState({});
  const [summaries, setSummaries] = useState({});
  const [summary, setSummary] = useState('');
  const [summarizing, setSummarizing] = useState(false);

  // 지원되는 확장자 목록
  const allowedExtensions = ['pdf', 'docx', 'hwp'];

  // 파일 목록 가져오기
  const fetchFiles = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: fileList, error: listError } = await supabase.storage.from(BUCKET_NAME).list();
      if (listError) throw listError;

      // metadata 없이 파일 목록만 저장
      setFiles(fileList);
    } catch (err) {
      setError(`파일 목록을 불러오는 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // 파일 업로드 처리
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setError('지원하지 않는 파일 형식입니다. (PDF, DOCX, HWP만 가능)');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(file.name, file);
      if (uploadError) throw uploadError;

      await fetchFiles();
    } catch (err) {
      setError(`파일 업로드 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // 파일 삭제 처리
  const handleFileDelete = async (fileName) => {
    if (!confirm(`"${fileName}" 파일을 삭제하시겠습니까?`)) return;

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.storage.from(BUCKET_NAME).remove([fileName]);
      if (error) throw error;

      if (selectedFile?.name === fileName) {
        setSelectedFile(null);
        setExtractedText('');
      }

      await fetchFiles();
    } catch (err) {
      setError(`파일 삭제 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 파일 선택 시 텍스트 추출 및 캐시된 데이터 로드
  const handleFileSelect = async (file) => {
    setSelectedFile(file);
    setSummary(''); // 요약 초기화

    // 캐시된 텍스트가 있는지 확인
    if (extractedTexts[file.name]) {
      setExtractedText(extractedTexts[file.name]);
      // 캐시된 요약본이 있다면 표시
      if (summaries[file.name]) {
        setSummary(summaries[file.name]);
      }
      return;
    }

    // 없으면 새로 추출
    setExtracting(true);
    setExtractedText('');
    setError(null);

    try {
      const ext = file.name.split('.').pop().toLowerCase();

      if (ext === 'pdf') {
        const {
          data: { publicUrl },
        } = supabase.storage.from(BUCKET_NAME).getPublicUrl(file.name);
        const loadingTask = getDocument(publicUrl);
        const pdf = await loadingTask.promise;

        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const textItems = textContent.items.map((item) => item.str);

          if (textItems.length === 0) {
            fullText = '이 PDF는 지원하지 않습니다.';
            break;
          }

          fullText += `--- 페이지 ${i} ---\n`;
          fullText += textItems.join(' ') + '\n\n';
        }

        setExtractedText(fullText);
        // 추출된 텍스트 캐싱
        setExtractedTexts((prev) => ({
          ...prev,
          [file.name]: fullText,
        }));
      } else {
        const {
          data: { publicUrl },
        } = supabase.storage.from(BUCKET_NAME).getPublicUrl(file.name);

        const response = await fetch(SUPABASE_FUNCTION_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, fileUrl: publicUrl }),
        });

        if (!response.ok) throw new Error(await response.text());

        const { text } = await response.json();
        setExtractedText(text);
        // 추출된 텍스트 캐싱
        setExtractedTexts((prev) => ({
          ...prev,
          [file.name]: text,
        }));
      }
    } catch (err) {
      setError(`텍스트 추출 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setExtracting(false);
    }
  };

  // 텍스트 복사 기능
  const handleCopyText = () => {
    if (!extractedText) return;

    navigator.clipboard
      .writeText(extractedText)
      .then(() => {
        // 복사 성공 알림
        alert('텍스트가 클립보드에 복사되었습니다.');
      })
      .catch((err) => {
        setError(`텍스트 복사 중 오류가 발생했습니다: ${err.message}`);
      });
  };

  // 텍스트 요약 처리
  const handleSummarize = async () => {
    if (!extractedText || !selectedFile) return;

    // 캐시된 요약본이 있는지 확인
    if (summaries[selectedFile.name]) {
      setSummary(summaries[selectedFile.name]);
      return;
    }

    setSummarizing(true);
    setError(null);

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: extractedText,
        }),
      });

      if (!response.ok) throw new Error(await response.text());

      const data = await response.json();
      setSummary(data.summary);

      // 요약본 캐싱
      setSummaries((prev) => ({
        ...prev,
        [selectedFile.name]: data.summary,
      }));
    } catch (err) {
      setError(`요약 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setSummarizing(false);
    }
  };

  // 파일명 표시를 위한 함수
  const truncateFileName = (fileName, maxLength = 25) => {
    if (fileName.length <= maxLength) return fileName;
    const extension = fileName.split('.').pop();
    const nameWithoutExt = fileName.substring(0, fileName.length - extension.length - 1);
    const truncatedName = nameWithoutExt.substring(0, maxLength - 3 - extension.length) + '...';
    return `${truncatedName}.${extension}`;
  };

  return (
    <div className='min-h-screen bg-gray-2 py-8'>
      <div className='container mx-auto p-6 max-w-6xl'>
        <h1 className='text-2xl font-bold mb-6 text-gray-12'>파일 텍스트 추출기</h1>

        {/* 파일 업로드 */}
        <div className='mb-8 border-2 border-dashed border-gray-6 p-8 text-center rounded-lg bg-gray-1 shadow-sm hover:border-blue-7 transition-colors'>
          <input id='file-input' type='file' accept='.pdf,.docx,.hwp' className='hidden' onChange={handleFileUpload} />
          <label htmlFor='file-input' className='cursor-pointer block'>
            <div className='flex flex-col items-center'>
              <FileUp size={48} className='text-blue-9 mb-4' />
              <p className='mb-2 font-medium text-gray-12'>파일 업로드</p>
              <p className='text-sm text-gray-11'>PDF, DOCX, HWP 파일 지원</p>
            </div>
          </label>
          {uploading && (
            <div className='mt-4 flex items-center justify-center'>
              <Loader2 size={20} className='animate-spin text-blue-9 mr-2' />
              <span className='text-gray-11'>업로드 중...</span>
            </div>
          )}
        </div>

        {error && (
          <div className='mb-6 p-4 bg-red-3 text-red-11 rounded-md border border-red-7'>
            <p>{error}</p>
          </div>
        )}

        {/* 파일 목록 및 내용 */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='border border-gray-6 p-5 bg-gray-3 rounded-lg shadow-sm'>
            <h2 className='text-lg font-semibold mb-4 text-gray-12 flex items-center'>
              <FileText size={18} className='mr-2 text-blue-9' />
              업로드된 파일
            </h2>

            {loading ? (
              <div className='flex items-center justify-center p-8'>
                <Loader2 size={24} className='animate-spin text-blue-9' />
              </div>
            ) : (
              <ul className='space-y-3'>
                {files.length === 0 ? (
                  <li className='text-center p-6 text-gray-10'>
                    <p>업로드된 파일이 없습니다</p>
                  </li>
                ) : (
                  files.map((file) => (
                    <li
                      key={file.name}
                      className={`p-3 flex items-center justify-between rounded-md hover:bg-gray-4 transition-colors ${
                        selectedFile?.name === file.name ? 'bg-blue-3 border border-blue-6' : ''
                      }`}
                    >
                      <button
                        className='flex items-center flex-1 text-left'
                        onClick={() => handleFileSelect(file)}
                        title={file.name}
                      >
                        <FileText
                          size={20}
                          className={`mr-2 ${selectedFile?.name === file.name ? 'text-blue-10' : 'text-blue-9'}`}
                        />
                        <span className='truncate max-w-[150px]'>{truncateFileName(file.name)}</span>
                      </button>
                      <button
                        onClick={() => handleFileDelete(file.name)}
                        className='ml-2 p-1.5 text-gray-9 hover:text-red-9 hover:bg-red-3 rounded-full transition-colors'
                        title='파일 삭제'
                      >
                        <Trash2 size={16} />
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>

          {/* 텍스트 추출 결과 */}
          <div className='border border-gray-6 p-5 rounded-lg col-span-2 bg-gray-3 shadow-sm'>
            <h2 className='text-lg font-semibold mb-4 text-gray-12'>추출된 텍스트</h2>

            {selectedFile && (
              <div className='mb-5 space-x-3 flex items-center'>
                {/* 텍스트 복사 버튼 */}
                {extractedText ? (
                  <button
                    onClick={handleCopyText}
                    className='px-4 py-2 bg-blue-9 text-gray-1 rounded-md hover:bg-blue-10 transition-colors shadow-sm flex items-center'
                  >
                    <ClipboardCopy size={16} className='mr-2' />
                    <span>텍스트 복사</span>
                  </button>
                ) : (
                  <button
                    className='px-4 py-2 bg-blue-9 text-gray-1 rounded-md hover:bg-blue-10 transition-colors shadow-sm flex items-center'
                    disabled={extracting}
                    onClick={() => handleFileSelect(selectedFile)}
                  >
                    {extracting ? (
                      <>
                        <Loader2 size={16} className='animate-spin mr-2' />
                        <span>추출 중...</span>
                      </>
                    ) : (
                      <>
                        <FileText size={16} className='mr-2' />
                        <span>텍스트 추출</span>
                      </>
                    )}
                  </button>
                )}

                {/* AI 요약 버튼 */}
                {extractedText && (
                  <button
                    onClick={handleSummarize}
                    className='px-4 py-2 bg-green-9 text-gray-1 rounded-md hover:bg-green-10 transition-colors shadow-sm flex items-center'
                    disabled={summarizing}
                  >
                    {summarizing ? (
                      <>
                        <Loader2 size={16} className='animate-spin mr-2' />
                        <span>요약 중...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          className='h-4 w-4 mr-2'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
                          />
                        </svg>
                        <span>AI 요약</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            <div className='space-y-4'>
              {/* 선택된 파일 정보 */}
              {selectedFile && (
                <div className='bg-gray-4 px-4 py-3 rounded-md border border-gray-6 flex items-center justify-between'>
                  <div className='flex items-center'>
                    <FileText size={16} className='text-blue-9 mr-2' />
                    <span className='font-medium'>{selectedFile.name}</span>
                  </div>
                </div>
              )}

              {/* AI 요약 결과 */}
              {summary && (
                <div className='mb-4'>
                  <h3 className='font-semibold mb-2 flex items-center text-gray-12'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-5 w-5 mr-2 text-green-9'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
                      />
                    </svg>
                    AI 요약
                  </h3>
                  <div className='whitespace-pre-wrap text-sm bg-gray-2 p-4 rounded-lg border border-gray-5 max-h-[400px] overflow-y-auto'>
                    {summary}
                  </div>
                </div>
              )}

              {/* 추출된 텍스트 */}
              <div className='whitespace-pre-wrap text-sm bg-gray-2 p-4 rounded-lg border border-gray-5 max-h-[500px] overflow-y-auto'>
                {extractedText ? (
                  extractedText
                ) : (
                  <div className='text-gray-10 text-center py-20'>
                    <FileText size={40} className='mx-auto mb-4 text-gray-8' />
                    <p>{selectedFile ? '텍스트 추출 버튼을 클릭하세요' : '파일을 선택하세요'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
