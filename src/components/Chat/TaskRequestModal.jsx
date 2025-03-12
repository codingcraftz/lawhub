import React, { useState, useRef } from 'react';
import { X, Search, Upload, X as XIcon } from 'lucide-react';
import { supabase } from '@/utils/supabase';
import FileUploadDropZone from '@/components/FileUploadDropZone';
import { useUser } from '@/hooks/useUser';

export default function TaskRequestModal({ isOpen, onClose, receiverId }) {
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasReference, setHasReference] = useState(true);
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);

  // 파일 드롭/선택 처리
  const handleFileDrop = (droppedFiles) => {
    setFiles((prevFiles) => [...prevFiles, ...droppedFiles]);
  };

  // 파일 제거
  const handleFileRemove = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[index];
      return newProgress;
    });
  };

  // 파일 업로드
  const uploadFiles = async () => {
    const uploadedFiles = [];

    for (const [index, file] of files.entries()) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      try {
        const { error: uploadError, data } = await supabase.storage.from('tasks').upload(filePath, file, {
          onUploadProgress: (progress) => {
            setUploadProgress((prev) => ({
              ...prev,
              [index]: (progress.loaded / progress.total) * 100,
            }));
          },
        });

        if (uploadError) throw uploadError;

        uploadedFiles.push({
          name: file.name,
          path: filePath,
          type: file.type,
          size: file.size,
        });
      } catch (error) {
        console.error('파일 업로드 오류:', error);
        throw error;
      }
    }

    return uploadedFiles;
  };

  // 의뢰 검색
  const searchAssignments = async () => {
    if (!searchTerm.trim()) {
      setAssignments([]);
      return;
    }

    setSearchLoading(true);

    try {
      // 채권자 이름으로 검색
      const { data: creditorAssignments, error: creditorError } = await supabase
        .from('assignment_creditors')
        .select(
          `
          id,
          name,
          assignment_id
        `
        )
        .ilike('name', `%${searchTerm}%`);

      if (creditorError) throw creditorError;

      // 채무자 이름으로 검색
      const { data: debtorAssignments, error: debtorError } = await supabase
        .from('assignment_debtors')
        .select(
          `
          id,
          name,
          assignment_id
        `
        )
        .ilike('name', `%${searchTerm}%`);

      if (debtorError) throw debtorError;

      // 의뢰 ID 목록 생성 (중복 제거)
      const assignmentIds = [
        ...new Set([
          ...creditorAssignments.map((c) => c.assignment_id),
          ...debtorAssignments.map((d) => d.assignment_id),
        ]),
      ];

      if (assignmentIds.length === 0) {
        setAssignments([]);
        setSearchLoading(false);
        return;
      }

      // 의뢰 정보 조회 (채권자, 채무자 정보 포함)
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(
          `
          id,
          description,
          creditors:assignment_creditors(id, name),
          debtors:assignment_debtors(id, name)
        `
        )
        .in('id', assignmentIds);

      if (assignmentsError) throw assignmentsError;

      // 검색 결과 가공 (채권자, 채무자 정보 포함)
      const processedAssignments = assignmentsData.map((assignment) => {
        const creditorNames = assignment.creditors?.map((c) => c.name).join(', ') || '채권자 정보 없음';
        const debtorNames = assignment.debtors?.map((d) => d.name).join(', ') || '채무자 정보 없음';

        return {
          ...assignment,
          creditorNames,
          debtorNames,
        };
      });

      setAssignments(processedAssignments);
    } catch (error) {
      console.error('의뢰 검색 오류:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // 검색어 입력 처리
  const handleSearchTermChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // 검색 버튼 클릭 처리
  const handleSearchClick = () => {
    searchAssignments();
  };

  // 엔터 키 처리
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchAssignments();
    }
  };

  // 업무 요청 전송
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || (hasReference && !selectedAssignment)) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      let uploadedFiles = [];
      if (files.length > 0) {
        uploadedFiles = await uploadFiles();
      }

      const { error } = await supabase.from('tasks').insert({
        assignment_id: hasReference ? selectedAssignment.id : null,
        description: description.trim(),
        assignee_id: receiverId,
        attachments: uploadedFiles.length > 0 ? uploadedFiles : null,
        created_by: user.id,
      });

      if (error) throw error;

      onClose();
      alert('업무가 요청되었습니다.');
    } catch (error) {
      console.error('업무 요청 오류:', error);
      alert('업무 요청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 참조 의뢰 여부 변경 처리
  const handleReferenceToggle = (e) => {
    setHasReference(e.target.checked);
    if (!e.target.checked) {
      setSelectedAssignment(null);
      setSearchTerm('');
      setAssignments([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-gray-2 rounded-lg w-full max-w-lg p-6 relative'>
        {/* 모달 헤더 */}
        <div className='flex justify-between items-center mb-6'>
          <h2 className='text-lg font-semibold text-gray-12'>업무 요청</h2>
          <button onClick={onClose} className='text-gray-11 hover:text-gray-12'>
            <X size={20} />
          </button>
        </div>

        {/* 모달 컨텐츠 */}
        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* 참조 의뢰 여부 */}
          <div className='flex items-center gap-2'>
            <input
              type='checkbox'
              id='hasReference'
              checked={hasReference}
              onChange={handleReferenceToggle}
              className='w-4 h-4 text-blue-9 border-gray-6 rounded focus:ring-blue-9'
            />
            <label htmlFor='hasReference' className='text-sm font-medium text-gray-12'>
              참조 의뢰 있음
            </label>
          </div>

          {/* 의뢰 검색 (참조 의뢰가 있을 때만 표시) */}
          {hasReference && (
            <div>
              <label className='block text-sm font-medium text-gray-12 mb-1'>
                의뢰 검색 (채권자/채무자 이름) <span className='text-red-9'>*</span>
              </label>
              <div className='relative flex'>
                <div className='relative flex-grow'>
                  <input
                    type='text'
                    placeholder='이름으로 검색...'
                    value={searchTerm}
                    onChange={handleSearchTermChange}
                    onKeyDown={handleSearchKeyPress}
                    className='w-full pl-10 pr-4 py-2 bg-gray-3 border border-gray-6 rounded-l-lg text-gray-12 placeholder-gray-11'
                  />
                  <div className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-11'>
                    <Search size={16} />
                  </div>
                  {searchLoading && (
                    <div className='absolute right-3 top-1/2 transform -translate-y-1/2'>
                      <div className='animate-spin h-4 w-4 border-2 border-blue-9 border-t-transparent rounded-full'></div>
                    </div>
                  )}
                </div>
                <button
                  type='button'
                  onClick={handleSearchClick}
                  disabled={searchLoading || !searchTerm.trim()}
                  className='px-4 py-2 bg-blue-9 hover:bg-blue-10 disabled:bg-gray-6 text-gray-1 rounded-r-lg transition-colors'
                >
                  검색
                </button>
              </div>
            </div>
          )}

          {/* 검색 결과 */}
          {hasReference && assignments.length > 0 && (
            <div className='max-h-60 overflow-y-auto space-y-2 border border-gray-6 rounded-lg p-2'>
              {assignments.map((assignment) => (
                <button
                  key={assignment.id}
                  type='button'
                  onClick={() => {
                    setSelectedAssignment(assignment);
                    setSearchTerm('');
                    setAssignments([]);
                  }}
                  className='w-full p-3 text-left hover:bg-gray-4 rounded-lg transition-colors border border-gray-5'
                >
                  <div className='flex flex-col gap-1'>
                    <div className='font-medium text-gray-12'>
                      <span className='text-gray-11'>채권자:</span> {assignment.creditorNames}
                    </div>
                    <div className='font-medium text-gray-12'>
                      <span className='text-gray-11'>채무자:</span> {assignment.debtorNames}
                    </div>
                  </div>
                  {assignment.description && (
                    <div className='text-sm text-gray-11 mt-1 line-clamp-2'>{assignment.description}</div>
                  )}
                </button>
              ))}
            </div>
          )}

          {hasReference && searchTerm && assignments.length === 0 && !searchLoading && (
            <div className='p-3 bg-gray-3 rounded-lg text-gray-11 text-center'>검색 결과가 없습니다.</div>
          )}

          {/* 선택된 의뢰 표시 */}
          {hasReference && selectedAssignment && (
            <div className='p-3 bg-gray-3 rounded-lg border border-blue-9'>
              <div className='flex flex-col gap-1'>
                <div className='font-medium text-gray-12'>
                  <span className='text-gray-11'>채권자:</span> {selectedAssignment.creditorNames}
                </div>
                <div className='font-medium text-gray-12'>
                  <span className='text-gray-11'>채무자:</span> {selectedAssignment.debtorNames}
                </div>
              </div>
              {selectedAssignment.description && (
                <div className='text-sm text-gray-11 mt-1'>{selectedAssignment.description}</div>
              )}
            </div>
          )}

          {/* 업무 내용 */}
          <div>
            <label className='block text-sm font-medium text-gray-12 mb-1'>
              업무 내용 <span className='text-red-9'>*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='업무 내용을 입력하세요'
              rows={4}
              className='w-full px-4 py-2 bg-gray-3 border border-gray-6 rounded-lg text-gray-12 placeholder-gray-11'
            />
          </div>

          {/* 파일 첨부 */}
          <div>
            <label className='block text-sm font-medium text-gray-12 mb-1'>파일 첨부</label>
            <div className='space-y-2'>
              <FileUploadDropZone onDrop={handleFileDrop} />
              {files.length > 0 && (
                <div className='space-y-2 mt-2'>
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between p-2 bg-gray-3 border border-gray-6 rounded-lg'
                    >
                      <span className='text-sm text-gray-12 truncate flex-1 mr-2'>{file.name}</span>
                      <div className='flex items-center gap-2 flex-shrink-0'>
                        {uploadProgress[index] && (
                          <div className='flex items-center gap-2'>
                            <div className='h-1 w-16 bg-gray-6 rounded-full overflow-hidden'>
                              <div
                                className='h-full bg-blue-9 transition-all duration-300'
                                style={{ width: `${Math.round(uploadProgress[index])}%` }}
                              />
                            </div>
                            <span className='text-xs text-gray-11 w-8'>{Math.round(uploadProgress[index])}%</span>
                          </div>
                        )}
                        <button
                          type='button'
                          onClick={() => handleFileRemove(index)}
                          className='text-gray-11 hover:text-gray-12 p-1 hover:bg-gray-4 rounded'
                        >
                          <XIcon size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 버튼 그룹 */}
          <div className='flex justify-end gap-3 pt-4'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 bg-gray-4 hover:bg-gray-5 text-gray-12 rounded-md transition-colors'
            >
              취소
            </button>
            <button
              type='submit'
              disabled={loading || !description.trim() || (hasReference && !selectedAssignment)}
              className='px-4 py-2 bg-blue-9 hover:bg-blue-10 text-gray-1 rounded-md transition-colors disabled:opacity-50'
            >
              {loading ? '요청 중...' : '요청'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
