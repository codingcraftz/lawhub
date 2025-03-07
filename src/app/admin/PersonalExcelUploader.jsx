'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useDropzone } from 'react-dropzone';
import readXlsxFile from 'read-excel-file';
import { Button, Card, CardContent, Spinner } from '@/components/Ui';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function PersonalExcelUploader() {
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
      const assignmentClients = [];
      const assignmentCreditors = [];
      const assignmentDebtors = [];
      const bonds = [];

      for (const row of dataRows) {
        const rowData = Object.fromEntries(headers.map((header, i) => [header, row[i]]));

        const assignment_id = crypto.randomUUID();

        assignments.push({
          id: assignment_id,
          type: rowData['assignments.type'] || null,
          status: rowData['assignments.status'] || null,
          description: rowData['assignments.description'] || null,
          civil_litigation_status: rowData['assignments.civil_litigation_status'] || null,
          asset_declaration_status: rowData['assignments.asset_declaration_status'] || null,
          creditor_attachment_status: rowData['assignments.creditor_attachment_status'] || null,
          created_at: rowData['assignments.created_at'] || new Date().toISOString(),
        });

        assignmentClients.push({
          assignment_id,
          client_id: rowData['assignment_clients.client_id'] || null,
          type: 'default',
          created_at: new Date().toISOString(),
        });

        assignmentCreditors.push({
          id: crypto.randomUUID(),
          assignment_id,
          name: rowData['assignment_creditors.name'] || null,
          phone_number: rowData['assignment_creditors.phone_number'] || null,
          address: rowData['assignment_creditors.address'] || null,
          registration_number: rowData['assignment_creditors.registration_number'] || null,
          workplace_name: rowData['assignment_creditors.workplace_name'] || null,
          workplace_address: rowData['assignment_creditors.workplace_address'] || null,
          created_at: new Date().toISOString(),
        });

        assignmentDebtors.push({
          id: crypto.randomUUID(),
          assignment_id,
          name: rowData['assignment_debtors.name'] || null,
          registration_number: rowData['assignment_debtors.registration_number'] || null,
          phone_number: rowData['assignment_debtors.phone_number'] || null,
          phone_number_2: rowData['assignment_debtors.phone_number2'] || null,
          phone_number_3: rowData['assignment_debtors.phone_number3'] || null,
          workplace_address: rowData['assignment_debtors.workplace_address'] || null,
          created_at: new Date().toISOString(),
        });

        // 🔹 `bonds.principal` 값 숫자로 변환 (쉼표 제거 후 `parseFloat`)
        const principal = rowData['bonds.principal']
          ? parseFloat(rowData['bonds.principal'].toString().replace(/,/g, ''))
          : 0;

        if (isNaN(principal)) {
          console.warn('🚨 bonds.principal 값이 숫자가 아님:', rowData['bonds.principal']);
        }

        bonds.push({
          id: crypto.randomUUID(),
          assignment_id,
          principal: isNaN(principal) ? 0 : principal, // 🔹 변환된 숫자 적용
          interest_1_start_date: rowData['bonds.interest_1_start_date'] || null,
          interest_1_end_date: rowData['bonds.interest_1_end_date'] || null,
          interest_1_rate: rowData['bonds.interest_1_rate'] || null,
          interest_2_start_date: rowData['bonds.interest_2_start_date'] || null,
          interest_2_end_date: rowData['bonds.interest_2_end_date'] || null,
          interest_2_rate: rowData['bonds.interest_2_rate'] || null,
          expenses: [
            {
              item: '서기료',
              amount: rowData['bonds.expenses[서기료]'] || 0,
            },
            {
              item: '인지액',
              amount: rowData['bonds.expenses[인지액]'] || 0,
            },
            {
              item: '송달료',
              amount: rowData['bonds.expenses[송달료]'] || 0,
            },
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      console.log('📌 bonds 데이터 미리보기:', bonds);

      if (assignments.length > 0) await supabase.from('assignments').insert(assignments);
      if (assignmentClients.length > 0) await supabase.from('assignment_clients').insert(assignmentClients);
      if (assignmentCreditors.length > 0) await supabase.from('assignment_creditors').insert(assignmentCreditors);
      if (assignmentDebtors.length > 0) await supabase.from('assignment_debtors').insert(assignmentDebtors);
      if (bonds.length > 0) await supabase.from('bonds').insert(bonds);

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
