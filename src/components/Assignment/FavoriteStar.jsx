"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase"; // 프로젝트별 Supabase 초기화 경로에 맞춰 수정
import { Button } from "@radix-ui/themes"; // (UI 라이브러리는 원하는 대로 교체 가능)
import { AiFillStar, AiOutlineStar } from "react-icons/ai"; // react-icons 사용 (별 아이콘)
import { useDebouncedCallback } from "use-debounce"; // npm install use-debounce

/**
 * @param {string} userId        - 현재 로그인 사용자 ID (Supabase에선 uuid)
 * @param {number} assignmentId  - 즐겨찾기할 사건 ID (assignments PK)
 */
export default function FavoriteStar({ userId, assignmentId }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1) 현재 (userId, assignmentId)가 favorites 테이블에 있는지 조회
  useEffect(() => {
    if (!userId || !assignmentId) return;

    let isMounted = true;
    const checkFavorite = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("assignment_favorites")
          .select("id")
          .eq("user_id", userId)
          .eq("assignment_id", assignmentId)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116: single() no rows returned
          throw error;
        }
        // 데이터가 있으면 즐겨찾기O, 없으면 즐겨찾기X
        if (isMounted) {
          setIsFavorite(!!data); // data가 null이면 false
        }
      } catch (err) {
        console.error("checkFavorite error:", err);
      } finally {
        setLoading(false);
      }
    };
    checkFavorite();

    return () => {
      isMounted = false;
    };
  }, [userId, assignmentId]);

  // 2) 즐겨찾기 등록/해제 토글
  const debouncedToggle = useDebouncedCallback(async (nextVal) => {
    if (!userId || !assignmentId) return;

    try {
      if (nextVal) {
        // 즐겨찾기 추가 (insert)
        const { error } = await supabase
          .from("assignment_favorites")
          .insert({ user_id: userId, assignment_id: assignmentId });
        if (error) throw error;
      } else {
        // 즐겨찾기 제거 (delete)
        const { error } = await supabase
          .from("assignment_favorites")
          .delete()
          .eq("user_id", userId)
          .eq("assignment_id", assignmentId);
        if (error) throw error;
      }
    } catch (err) {
      console.error("toggleFavorite error:", err);
    }
  }, 500);

  const handleToggleFavorite = () => {
    // 즉시 로컬 상태만 변경 → 디바운스된 DB 업데이트 실행
    setIsFavorite((prev) => {
      const nextVal = !prev;
      debouncedToggle(nextVal);
      return nextVal;
    });
  };

  // 로딩 상태거나 userId, assignmentId가 없으면 버튼 비활성화
  const disabled = loading || !userId || !assignmentId;

  return (
    <Button
      variant="ghost"
      size="2"
      onClick={handleToggleFavorite}
      disabled={disabled}
    >
      {isFavorite ? (
        <AiFillStar size={20} color="#f5c518" /> // 노란색 별
      ) : (
        <AiOutlineStar size={20} />
      )}
    </Button>
  );
}
