// src/components/SearchPage.jsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { Toaster, toast } from 'react-hot-toast';
import Pagination from './Pagination';
import AssignmentRow from './AssignmentRow';
import { handleCopy, handleCopyName, getCurrentDateFormatted } from './utils';

export default function SearchPage() {
	const { userId } = useParams();
	const [searchInput, setSearchInput] = useState('');
	const [results, setResults] = useState([]);
	const [loading, setLoading] = useState(false);

	// 페이지네이션 상태
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;
	const [totalPages, setTotalPages] = useState(1);

	// 검색 결과 fetch 함수
	const fetchSearchResults = useCallback(async () => {
		setLoading(true);
		try {
			// debtor_name 컬럼을 기준으로 검색
			const { data, count, error } = await supabase
				.from('assignment_clients_with_debtor')
				.select('*', { count: 'exact' })
				.eq('client_id', userId)
				.ilike('debtor_name', `%${searchInput}%`)
				.order('debtor_name', { ascending: true })
				.range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

			if (error) throw error;
			setTotalPages(Math.ceil(count / itemsPerPage));

			// 각 항목의 세부 데이터 불러오기
			const detailedResults = await Promise.all(
				data.map(async (item) => {
					const assignmentId = item.assignment_id;
					const { data: assignment } = await supabase
						.from('assignments')
						.select('*')
						.eq('id', assignmentId)
						.single();
					const { data: creditors } = await supabase
						.from('assignment_creditors')
						.select('*')
						.eq('assignment_id', assignmentId);
					const { data: debtors } = await supabase
						.from('assignment_debtors')
						.select('*')
						.eq('assignment_id', assignmentId)
						.order('id', { ascending: true });
					const { data: timeline } = await supabase
						.from('assignment_timelines')
						.select('*')
						.eq('assignment_id', assignmentId)
						.order('created_at', { ascending: false })
						.limit(1)
						.maybeSingle();
					const { data: bonds } = await supabase
						.from('bonds')
						.select('*')
						.eq('assignment_id', assignmentId)
						.single();
					const { data: enforcements } = await supabase
						.from('enforcements')
						.select('*')
						.eq('assignment_id', assignmentId)
						.eq('status', 'closed');
					const totalEnforcement = enforcements
						? enforcements.reduce((sum, en) => sum + (en.amount || 0), 0)
						: 0;
					return {
						assignment,
						creditors,
						debtors,
						timeline,
						bonds,
						totalEnforcement,
					};
				})
			);
			setResults(detailedResults);
		} catch (error) {
			console.error('Error fetching search results:', error);
			toast.error('검색 결과를 불러오는 중 오류가 발생했습니다.');
		}
		setLoading(false);
	}, [userId, searchInput, currentPage]);

	// 검색 버튼 클릭 시 호출
	const handleSearch = () => {
		setCurrentPage(1); // 새로운 검색은 첫 페이지부터 시작
		fetchSearchResults();
	};

	// 페이지네이션 변경 시 검색 결과 재호출
	const handlePageChange = (page) => {
		setCurrentPage(page);
		fetchSearchResults();
	};

	return (
		<div className="p-4 dark:bg-gray-900 dark:text-white">
			<Toaster />
			<h1 className="text-2xl font-bold mb-4">채무자 검색</h1>
			<div className="mb-4">
				<input
					type="text"
					placeholder="채무자 이름을 입력하세요..."
					value={searchInput}
					onChange={(e) => setSearchInput(e.target.value)}
					className="w-full p-2 border rounded"
				/>
				<button
					onClick={handleSearch}
					className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
				>
					검색
				</button>
			</div>
			{loading ? (
				<div>Loading...</div>
			) : (
				<>
					{results.length > 0 ? (
						<>
							<table className="min-w-full border border-gray-600 mb-6">
								<thead className="bg-gray-700">
									<tr>
										<th className="p-2 border border-gray-600">당사자 (채권자/채무자)</th>
										<th className="p-2 border border-gray-600">진행 상황</th>
										<th className="p-2 border border-gray-600">채권금</th>
										<th className="p-2 border border-gray-600">회수금</th>
										<th className="p-2 border border-gray-600">액션</th>
									</tr>
								</thead>
								<tbody>
									{results.map((item) => {
										const { assignment, creditors, debtors, timeline, bonds, totalEnforcement } = item;
										if (!assignment) return null;
										// 검색 결과에서는 상세보기 토글 없이 간단하게 AssignmentRow 사용
										return (
											<React.Fragment key={assignment.id}>
												<AssignmentRow
													assignment={item}
													expanded={false}
													onToggleExpand={() => { }}
													onEditAssignment={() => { }}
													onDeleteAssignment={() => { }}
													onEditParty={(type, record) => {
														// 필요한 경우 상세보기 모달 호출
													}}
													onAddTimeline={() => { }}
													onEditTimeline={() => { }}
													onDeleteTimeline={() => { }}
													handleCopy={handleCopy}
													handleCopyName={handleCopyName}
												/>
											</React.Fragment>
										);
									})}
								</tbody>
							</table>
							{totalPages > 1 && (
								<Pagination
									currentPage={currentPage}
									totalPages={totalPages}
									onPageChange={handlePageChange}
								/>
							)}
						</>
					) : (
						<div>검색 결과가 없습니다.</div>
					)}
				</>
			)}
		</div>
	);
}

