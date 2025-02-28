'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { usePathname } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useUser } from '@/hooks/useUser';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function FeedbackWidget() {
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [selectedElementPath, setSelectedElementPath] = useState(null);
  const [modalId, setModalId] = useState(null);
  const [comment, setComment] = useState('');
  const [feedbacks, setFeedbacks] = useState([]);
  const [openFeedbackId, setOpenFeedbackId] = useState(null);
  const [newFeedbackModalOpen, setNewFeedbackModalOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();

  const [iconPositions, setIconPositions] = useState({});

  const inputRef = useRef(null);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      comment: ''
    }
  });

  useEffect(() => {
    loadFeedbacks();
  }, [pathname]);

  useEffect(() => {
    const handleScrollOrResize = () => {
      if (feedbackMode) {
        updateFeedbackIconPositions();
      }
    };

    let timeoutId;
    const debouncedHandler = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScrollOrResize, 100);
    };

    window.addEventListener('scroll', debouncedHandler);
    window.addEventListener('resize', debouncedHandler);

    return () => {
      window.removeEventListener('scroll', debouncedHandler);
      window.removeEventListener('resize', debouncedHandler);
      clearTimeout(timeoutId);
    };
  }, [feedbackMode, feedbacks]);

  useEffect(() => {
    if (newFeedbackModalOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [newFeedbackModalOpen]);

  // 요소 경로 생성 함수 수정
  const generateElementPath = (element) => {
    const path = [];
    let currentElement = element;

    while (currentElement && currentElement !== document.body) {
      let selector = currentElement.tagName.toLowerCase();
      
      if (currentElement.id) {
        selector += `#${currentElement.id}`;
      } else if (currentElement.className && typeof currentElement.className === 'string') {
        // 클래스명 처리 개선
        const classes = currentElement.className
          .split(' ')
          .filter(c => c && !c.includes(':') && !c.includes('.'))
          .map(c => c.trim())
          .filter(Boolean)
          .map(c => c.replace(/[^\w-]/g, '\\$&')) // 특수문자 이스케이프
          .join('.');
          
        if (classes) {
          selector += `.${classes}`;
        }
      }
      
      path.unshift(selector);
      currentElement = currentElement.parentElement;
    }

    return path.join(' > ').trim();
  };

  // 피드백 로드 함수 수정
  const loadFeedbacks = async () => {
    const { data } = await supabase
      .from('admin_feedbacks')
      .select('*')
      .eq('page_url', pathname)
      .eq('is_resolved', false);

    setFeedbacks(data || []);
    // 피드백 로드 후 즉시 위치 업데이트
    updateFeedbackIconPositions();
  };

  // 페이지 로드 시 최초 1회만 실행
  useEffect(() => {
    if (feedbackMode) {
      loadFeedbacks();
    }
  }, [pathname, feedbackMode]);

  // 요소 클릭 핸들러 수정
  useEffect(() => {
    if (!feedbackMode) return;

    const handleDocumentClick = (e) => {
      // 피드백 컨트롤 요소나 input/textarea인 경우 무시
      if (
        e.target.closest('.feedback-controls') || 
        e.target.tagName.toLowerCase() === 'input' ||
        e.target.tagName.toLowerCase() === 'textarea'
      ) {
        return;
      }

      // 모달이 열려있을 때는 클릭 이벤트 처리하지 않음
      if (newFeedbackModalOpen || openFeedbackId !== null) return;

      e.preventDefault();
      e.stopPropagation();

      const clickedElement = e.target;
      const targetModalId = clickedElement.closest('[data-dialog-id]')?.getAttribute('data-dialog-id');
      const path = generateElementPath(clickedElement);

      setSelectedElementPath(path);
      setModalId(targetModalId || null);
      setNewFeedbackModalOpen(true);
    };

    document.addEventListener('click', handleDocumentClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleDocumentClick, { capture: true });
    };
  }, [feedbackMode, newFeedbackModalOpen, openFeedbackId]);

  // 호버 효과 핸들러
  useEffect(() => {
    if (!feedbackMode) return;

    const handleMouseOver = (e) => {
      if (e.target.closest('.feedback-controls')) return;
      e.target.style.outline = '2px solid #3B82F6';
      e.target.style.cursor = 'pointer';
    };

    const handleMouseOut = (e) => {
      if (e.target.closest('.feedback-controls')) return;
      e.target.style.outline = '';
      e.target.style.cursor = '';
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, [feedbackMode]);

  // 아이콘 위치 업데이트 함수 수정
  const updateFeedbackIconPositions = () => {
    if (!feedbackMode) return;

    requestAnimationFrame(() => {
      const positions = {};
      feedbacks.forEach((feedback) => {
        try {
          // 선택자를 단순화하여 마지막 요소만 찾기
          const pathParts = feedback.element_path.split(' > ');
          const lastElement = pathParts[pathParts.length - 1];
          const elements = document.querySelectorAll(lastElement);
          
          // 여러 요소 중 원래 경로와 가장 잘 매칭되는 요소 찾기
          const element = Array.from(elements).find(el => {
            const currentPath = generateElementPath(el);
            return currentPath.includes(lastElement);
          });

          if (element) {
            const rect = element.getBoundingClientRect();
            positions[feedback.id] = {
              top: rect.top + window.scrollY,
              left: rect.right + window.scrollX + 8,
            };
          }
        } catch (error) {
          console.warn('Failed to find element:', feedback.element_path);
        }
      });
      
      setIconPositions(positions);
    });
  };

  // 피드백 제출 함수 수정
  const submitFeedback = async (commentText) => {
    console.log("submitFeedback called with:", commentText); // 제출 함수 호출 확인

    if (!selectedElementPath || !commentText?.trim()) {
      console.log("Invalid input:", { selectedElementPath, commentText }); // 유효성 검사 실패 확인
      return;
    }

    const { data, error } = await supabase
      .from('admin_feedbacks')
      .insert([{
        page_url: pathname,
        element_path: selectedElementPath,
        comment: commentText,
        author: 'admin',
        modal_id: modalId
      }])
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error); // 에러 확인
      return;
    }

    alert("피드백이 성공적으로 저장되었습니다."); // 저장 성공 확인
    setFeedbacks(prev => [...prev, data]);
    setNewFeedbackModalOpen(false);
  };

  // 피드백 해결 함수
  const resolveFeedback = async (feedbackId) => {
    const { error } = await supabase
      .from('admin_feedbacks')
      .update({ 
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: 'admin'
      })
      .eq('id', feedbackId);

    if (!error) {
      setFeedbacks(prev => prev.filter(fb => fb.id !== feedbackId));
      setOpenFeedbackId(null);
    }
  };

  // 모달 컴포넌트 수정
  const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    // 모달 내부 클릭 이벤트가 상위로 전파되지 않도록
    const handleModalClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    return (
      <div 
        className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-30 flex items-center justify-center z-[9999] feedback-controls"
        onClick={onClose}
      >
        <div 
          className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg max-w-lg w-full mx-4 feedback-controls"
          onClick={handleModalClick}
        >
          {children}
        </div>
      </div>
    );
  };

  // 피드백을 요소별로 그룹화하는 함수 추가
  const groupFeedbacksByElement = (feedbacks) => {
    return feedbacks.reduce((groups, feedback) => {
      const key = feedback.element_path;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(feedback);
      return groups;
    }, {});
  };

  // 피드백 상세 모달 컴포넌트 수정
  const FeedbackDetailModal = ({ feedbacks, onClose, onResolve }) => {
    return (
      <div className="space-y-4">
        {feedbacks.map((feedback) => (
          <div key={feedback.id} className="border-b pb-4 last:border-b-0">
            <div className="text-sm mb-2">
              <span className="font-bold">{feedback.author}</span>
              <span className="text-gray-500 ml-2">
                {new Date(feedback.created_at).toLocaleString()}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{feedback.comment}</p>
            <button
              className="mt-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
              onClick={() => onResolve(feedback.id)}
            >
              피드백 해결
            </button>
          </div>
        ))}
      </div>
    );
  };

  // 새 피드백 작성 모달 수정
  const NewFeedbackModal = () => {
    const onSubmit = async (data) => {
      await submitFeedback(data.comment);
      reset(); // 폼 초기화
      setNewFeedbackModalOpen(false); // 모달 닫기
    };

    const handleSaveClick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleSubmit(onSubmit)();
    };

    return (
      <Modal
        isOpen={newFeedbackModalOpen}
        onClose={() => {
          setNewFeedbackModalOpen(false);
          setSelectedElementPath(null);
          setModalId(null);
          reset(); // 모달 닫을 때도 폼 초기화
        }}
      >
        <h2 className="text-lg font-semibold mb-4">새 피드백 남기기</h2>
        <form 
          className="feedback-controls"
          onSubmit={handleSubmit(onSubmit)}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
            <textarea
              {...register('comment', { required: true })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 min-h-[100px]"
              placeholder="피드백을 입력하세요..."
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              onClick={handleSaveClick}
            >
              저장
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setNewFeedbackModalOpen(false);
              }}
            >
              취소
            </button>
          </div>
        </form>
      </Modal>
    );
  };

  // 그룹화된 피드백 렌더링
  const groupedFeedbacks = groupFeedbacksByElement(feedbacks);

  // 피드백 모드 토글 함수 추출
  const toggleFeedbackMode = async () => {
    const newMode = !feedbackMode;
    setFeedbackMode(newMode);
    
    // 피드백 모드 켤 때만 데이터 새로 로드
    if (newMode) {
      await loadFeedbacks();
    }
    
    // 모드 끌 때는 상태 초기화
    if (!newMode) {
      setSelectedElementPath(null);
      setOpenFeedbackId(null);
      setNewFeedbackModalOpen(false);
    }
  };

            if (user?.role !=="admin") return null;
  return (
    <div className="feedback-widget">
      {/* 피드백 모드 토글 버튼 수정 */}
      <div className="feedback-controls fixed bottom-5 right-5 z-[100]">
        <button
          onClick={toggleFeedbackMode}
          className="p-3 bg-blue-600 text-white rounded shadow-lg hover:bg-blue-700"
        >
          {feedbackMode ? '피드백 모드 종료' : '피드백 모드 시작'}
        </button>
      </div>

      {/* 피드백 아이콘들은 feedbackMode가 true일 때만 표시 */}
      {feedbackMode && Object.entries(groupedFeedbacks).map(([elementPath, feedbackGroup]) => {
        const pos = iconPositions[feedbackGroup[0].id];
        if (!pos) return null;

        return (
          <div
            key={elementPath}
            className="feedback-controls"
            style={{
              position: 'absolute',
              top: pos.top,
              left: pos.left,
              zIndex: 98
            }}
          >
            <button
              className="bg-yellow-200 p-2 rounded-full shadow-lg hover:bg-yellow-300 relative"
              onClick={(e) => {
                e.stopPropagation();
                setOpenFeedbackId(elementPath);
              }}
            >
              💬
              {feedbackGroup.length > 1 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {feedbackGroup.length}
                </span>
              )}
            </button>
          </div>
        );
      })}

      {/* 피드백 상세 모달 수정 */}
      {Object.entries(groupedFeedbacks).map(([elementPath, feedbackGroup]) => (
        <Modal
          key={elementPath}
          isOpen={elementPath === openFeedbackId}
          onClose={() => setOpenFeedbackId(null)}
        >
          <FeedbackDetailModal
            feedbacks={feedbackGroup}
            onClose={() => setOpenFeedbackId(null)}
            onResolve={resolveFeedback}
          />
        </Modal>
      ))}

      <NewFeedbackModal />
    </div>
  );
}