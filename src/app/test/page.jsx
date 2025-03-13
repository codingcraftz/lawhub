'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import { readHwp } from 'hwp.js';
import Mammoth from 'mammoth';
import { Loader2, FileUp, Copy, Download, FileText, Trash2 } from 'lucide-react';

// PDF.js 워커 설정
GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const BUCKET_NAME = 'test';

export default function FileExtractorPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');

  // 지원되는 확장자 목록
  const allowedExtensions = ['pdf', 'docx', 'hwp'];

  // 파일 목록 가져오기
  const fetchFiles = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: fileList, error: listError } = await supabase.storage.from(BUCKET_NAME).list();
      if (listError) throw listError;

      const validFiles = fileList.filter((file) => {
        const ext = file.name.split('.').pop().toLowerCase();
        return allowedExtensions.includes(ext);
      });

      const filesWithMetadata = await Promise.all(
        validFiles.map(async (file) => {
          try {
            const { data: metadata } = await supabase.storage.from(BUCKET_NAME).getMetadata(file.name);
            let originalName = metadata?.customMetadata?.originalFileName || file.name.split('-').slice(1).join('-');
            return { ...file, originalName };
          } catch {
            return { ...file, originalName: file.name.split('-').slice(1).join('-') };
          }
        })
      );

      setFiles(filesWithMetadata);
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
      const originalFileName = file.name;
      const timestamp = new Date().getTime();
      const safeFileName = originalFileName.replace(/[^\w.-]/g, '_');
      const fileName = `${timestamp}-${safeFileName}`;

      const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        fileMetadata: { originalFileName },
      });

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

  // 파일 선택 시 텍스트 추출
  const handleFileSelect = async (file) => {
    setSelectedFile(file);
    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'pdf') {
      await extractTextFromPDF(file.name);
    } else if (ext === 'docx') {
      await extractTextFromDOCX(file);
    } else if (ext === 'hwp') {
      await extractTextFromHWP(file);
    }
  };

  // PDF에서 텍스트 추출
  const extractTextFromPDF = async (fileName) => {
    setExtractedText('');
    setExtracting(true);
    setError(null);

    try {
      const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
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
    } catch (err) {
      setError(`텍스트 추출 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setExtracting(false);
    }
  };

  // DOCX에서 텍스트 추출
  const extractTextFromDOCX = async (file) => {
    setExtracting(true);
    setExtractedText('');
    setError(null);

    const reader = new FileReader();
    reader.readAsArrayBuffer(file);

    reader.onload = async () => {
      try {
        const { value: text } = await Mammoth.extractRawText({ arrayBuffer: reader.result });
        setExtractedText(text);
      } catch (err) {
        setError(`DOCX 처리 중 오류 발생: ${err.message}`);
      } finally {
        setExtracting(false);
      }
    };
  };

  // HWP에서 텍스트 추출
  const extractTextFromHWP = async (file) => {
    setExtracting(true);
    setExtractedText('');
    setError(null);

    const reader = new FileReader();
    reader.readAsArrayBuffer(file);

    reader.onload = async () => {
      try {
        const hwpData = new Uint8Array(reader.result);
        const text = await readHwp(hwpData);
        setExtractedText(text);
      } catch (err) {
        setError(`HWP 처리 중 오류 발생: ${err.message}`);
      } finally {
        setExtracting(false);
      }
    };
  };

  return (
    <div className='container mx-auto p-6 max-w-6xl'>
      <h1 className='text-2xl font-bold mb-4'>파일 텍스트 추출기</h1>
      <input id='file-input' type='file' accept='.pdf,.docx,.hwp' onChange={handleFileUpload} />
      {error && <div className='text-red-500'>{error}</div>}
      <pre className='border p-4 mt-4'>{extractedText || '파일을 선택하세요.'}</pre>
    </div>
  );
}
