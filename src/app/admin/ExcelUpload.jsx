'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useDropzone } from 'react-dropzone';
import readXlsxFile from 'read-excel-file';
import { Button, Card, CardContent, Spinner } from '@/components/Ui';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function ExcelUploader() {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { getRootProps, getInputProps } = useDropzone({
    accept: '.xlsx',
    onDrop: (acceptedFiles) => {
      setFile(acceptedFiles[0]);
      handleFileRead(acceptedFiles[0]);
    },
  });

  const handleFileRead = async (file) => {
    try {
      const rows = await readXlsxFile(file);
      const headers = rows[0].map((col) => col.trim());
      const dataRows = rows.slice(1);

      setTotalRows(dataRows.length);
      setPreviewData(
        dataRows.slice(0, 5).map((row) => Object.fromEntries(headers.map((header, i) => [header, row[i]])))
      );
    } catch (error) {
      console.error('파일 읽기 오류:', error);
      setMessage('파일을 읽는 중 오류가 발생했습니다.');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('파일을 선택하세요.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const rows = await readXlsxFile(file);
      const headers = rows[0].map((col) => col.trim());
      const dataRows = rows.slice(1);

      const assignments = [];
      const assignmentGroups = [];
      const assignmentCreditors = [];
      const assignmentDebtors = [];
      const bonds = [];

      for (const row of dataRows) {
        const rowData = Object.fromEntries(headers.map((header, i) => [header, row[i]]));
        const assignment_id = crypto.randomUUID();

        assignments.push({
          id: assignment_id,
          type: rowData['assignments.type'],
          status: rowData['assignments.status'],
          description: rowData['assignments.description'] || '',
          civil_litigation_status: rowData['assignments.civil_litigation_status'],
          asset_declaration_status: rowData['assignments.asset_declaration_status'],
          creditor_attachment_status: rowData['assignments.creditor_attachment_status'],
          created_at: new Date().toISOString(),
        });

        assignmentGroups.push({
          assignment_id,
          group_id: rowData['assignment_groups.group_id'],
          type: 'default',
          created_at: new Date().toISOString(),
        });
        assignmentCreditors.push({
          id: crypto.randomUUID(),
          assignment_id,
          name: rowData['assignment_creditors.name'],
          phone_number: rowData['assignment_creditors.phone_number'],
          created_at: new Date().toISOString(),
        });
        assignmentDebtors.push({
          id: crypto.randomUUID(),
          assignment_id,
          name: rowData['assignment_debtors.name'],
          created_at: new Date().toISOString(),
        });
        bonds.push({
          id: crypto.randomUUID(),
          assignment_id,
          principal: rowData['bonds.principal'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      await supabase.from('assignments').insert(assignments);
      await supabase.from('assignment_groups').insert(assignmentGroups);
      await supabase.from('assignment_creditors').insert(assignmentCreditors);
      await supabase.from('assignment_debtors').insert(assignmentDebtors);
      await supabase.from('bonds').insert(bonds);

      setMessage('업로드가 완료되었습니다.');
    } catch (error) {
      console.error('업로드 오류:', error);
      setMessage('업로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='p-4 max-w-2xl mx-auto'>
      <div {...getRootProps()} className='border-2 border-dashed p-6 text-center cursor-pointer rounded-lg'>
        <input {...getInputProps()} />
        <p className='text-gray-600'>여기로 파일을 드래그하거나 클릭하여 업로드하세요.</p>
      </div>

      {file && (
        <Card className='mt-4'>
          <CardContent>
            <p className='font-semibold'>파일명: {file.name}</p>
            <p className='text-gray-600'>총 {totalRows} 개의 데이터</p>
            {previewData.length > 0 && (
              <div className='mt-2 overflow-auto max-h-40 border-t pt-2'>
                {previewData.map((row, i) => (
                  <div key={i} className='text-sm text-gray-700 border-b py-1'>
                    {Object.values(row).join(' | ')}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Button onClick={handleUpload} className='mt-4' disabled={loading}>
        {loading ? <Spinner className='mr-2' /> : '데이터베이스에 올리기'}
      </Button>
      {message && <p className='mt-2 text-sm text-gray-700'>{message}</p>}
    </div>
  );
}
