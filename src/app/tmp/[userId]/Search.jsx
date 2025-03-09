
// src/components/SearchPage.jsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { Toaster, toast } from 'react-hot-toast';
import Pagination from './Pagination';
import PartyModal from './PartyModal';
import TimelineModal from './TimelineModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import AssignmentEditModal from './AssignmentEditModal';
import DebtorForm from '../../client/assignment/_components/dialogs/DebtorForm';
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

	// 모달 및 상세보기 상태
	const [expanded, setExpanded] = useState({});
	const [showPartyModal, setShowPartyModal] = useState(false);
	const [selectedParty, setSelectedParty] = useState(null);
	const [partyType, setPartyType] = useState('');

	const [showTimelineModal, setShowTimelineModal] = useState(false);
	const [timelineModalMode, setTimelineModalMode] = useState('edit'); // 'edit' or 'add'
	const [selectedTimeline, setSelectedTimeline] = useState(null);
	const [timelineAssignmentId, setTimelineAssignmentId] = useState(null);
	const [timelineInput, setTimelineInput] = useState('');

	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [timelineToDelete, setTimelineToDelete] = useState(null);

	const [showAssignmentEditModal, setShowAssignmentEditModal] = useState(false);
	const [showAssignmentDeleteModal, setShowAssignmentDeleteModal] = useState(false);
	const [selectedAssignment, setSelectedAssignment] = useState(null);
	const [assignmentEditForm, setAssignmentEditForm] = useState({
		description: '',
		status: '',
	});

	const [showDebtorEditModal, setShowDebtorEditModal] = useState(false);

	// 검색 결과 fetch 함수 – debtor_name 컬럼 기준으로 검색
	const fetchSearchResults = useCallback(async () => {
		setLoading(true);
		try {
			const { data, count, error } = await supabase
				.from('assignment_clients_with_debtor')
				.select('*', { count: 'exact' })
				.eq('client_id', userId)
				.ilike('debtor_name', `%${searchInput}%`)
				.order('debtor_name', { ascending: true })
				.range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);
			if (error) throw error;
			setTotalPages(Math.ceil(count / itemsPerPage));

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
	}, [userId, searchInput, currentPage, itemsPerPage]);

	// 검색 버튼 클릭 시
	const handleSearch = () => {
		setCurrentPage(1); // 새로운 검색은 첫 페이지부터 시작
		fetchSearchResults();
	};

	// 페이지네이션 변경 시 검색 결과 재호출
	const handlePageChange = (page) => {
		setCurrentPage(page);
		fetchSearchResults();
	};

	const toggleExpand = (assignmentId) => {
		setExpanded((prev) => ({ ...prev, [assignmentId]: !prev[assignmentId] }));
	};

	// 모달 핸들러 (AssignmentPage와 동일)
	const handleEditParty = (type, record) => {
		setSelectedParty(record);
		setPartyType(type);
		setShowPartyModal(true);
	};

	const handleEditTimeline = (assignmentId, timelineData) => {
		setTimelineAssignmentId(assignmentId);
		setTimelineModalMode('edit');
		setSelectedTimeline(timelineData);
		setTimelineInput(timelineData?.description || '');
		setShowTimelineModal(true);
	};

	const handleAddTimeline = (assignmentId) => {
		setTimelineAssignmentId(assignmentId);
		setTimelineModalMode('add');
		setSelectedTimeline(null);
		setTimelineInput('');
		setShowTimelineModal(true);
	};

	const handleDeleteTimeline = async (timelineData) => {
		setLoading(true);
		const { error } = await supabase
			.from('assignment_timelines')
			.delete()
			.eq('id', timelineData.id);
		if (error) {
			toast.error('진행 상황 삭제 실패');
		} else {
			toast.success('진행 상황이 삭제되었습니다.');
		}
		await fetchSearchResults();
		setShowDeleteModal(false);
		setLoading(false);
	};

	const handleSubmitTimeline = async () => {
		setLoading(true);
		if (timelineModalMode === 'edit') {
			const { error } = await supabase
				.from('assignment_timelines')
				.update({ description: timelineInput })
				.eq('id', selectedTimeline.id);
			if (error) {
				toast.error('진행 상황 수정 실패');
			} else {
				toast.success('진행 상황이 수정되었습니다.');
			}
		} else {
			const { error } = await supabase
				.from('assignment_timelines')
				.insert({ assignment_id: timelineAssignmentId, description: timelineInput });
			if (error) {
				toast.error('진행 상황 등록 실패');
			} else {
				toast.success('진행 상황이 등록되었습니다.');
			}
		}
		await fetchSearchResults();
		setShowTimelineModal(false);
		setLoading(false);
	};

	const handleEditAssignment = (assignmentData) => {
		setSelectedAssignment(assignmentData);
		setAssignmentEditForm({
			description: assignmentData.description,
			status: assignmentData.status,
		});
		setShowAssignmentEditModal(true);
	};

	const handleSubmitAssignmentEdit = async () => {
		setLoading(true);
		const { error } = await supabase
			.from('assignments')
			.update({
				description: assignmentEditForm.description,
				status: assignmentEditForm.status,
			})
			.eq('id', selectedAssignment.id);
		if (error) {
			toast.error('의뢰 수정 실패');
		} else {
			toast.success('의뢰가 수정되었습니다.');
		}
		setShowAssignmentEditModal(false);
		await fetchSearchResults();
		setLoading(false);
	};

	const handleDeleteAssignment = (assignmentData) => {
		setSelectedAssignment(assignmentData);
		setShowAssignmentDeleteModal(true);
	};

	const confirmDeleteAssignment = async () => {
		setLoading(true);
		const { error } = await supabase
			.from('assignments')
			.delete()
			.eq('id', selectedAssignment.id);
		if (error) {
			toast.error('의뢰 삭제 실패');
		} else {
			toast.success('의뢰가 삭제되었습니다.');
		}
		setShowAssignmentDeleteModal(false);
		await fetchSearchResults();
		setLoading(false);
	};

	const handleUpdateDebtor = async (updatedData) => {
		try {
			const { error } = await supabase
				.from('assignment_debtors')
				.update(updatedData)
				.eq('id', selectedParty.id);
			if (error) {
				toast.error('채무자 정보 수정 실패');
			} else {
				toast.success('채무자 정보가 수정되었습니다.');
				fetchSearchResults();
			}
		} catch (error) {
			toast.error('채무자 정보 수정 중 오류 발생');
		}
		setShowDebtorEditModal(false);
	};

	const formatAmount = (amount) =>
		typeof amount === 'number' ? amount.toLocaleString() : amount;

	return (
		<div className="p-4 dark:bg-gray-900 dark:text-white">
			<Toaster />
			<h1 className="text-2xl font-bold mb-4">채무자 검색</h1>
			{/* 검색 폼 */}
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
										return (
											<React.Fragment key={assignment.id}>
												<tr className="hover:bg-gray-600">
													<td className="p-2 border border-gray-600">
														<div>
															<strong>채권자:</strong>
															<ul>
																{creditors?.map((cred) => (
																	<li key={cred.id} className="flex items-center gap-2">
																		<span>{cred.name}</span>
																		<button
																			className="text-blue-400 underline text-sm"
																			onClick={() => handleEditParty('채권자', cred)}
																		>
																			상세보기
																		</button>
																	</li>
																))}
															</ul>
														</div>
														<div className="mt-2">
															<strong>채무자:</strong>
															<ul>
																{debtors?.map((deb) => (
																	<li key={deb.id} className="flex items-center gap-2">
																		<p>{deb.name}</p>
																		<p>{deb.status || '등록된 상태가 없습니다.'}</p>
																		<button
																			className="ml-2 text-blue-400 underline text-sm"
																			onClick={() => handleEditParty('채무자', deb)}
																		>
																			상세보기
																		</button>
																		<button
																			onClick={() => handleCopyName(deb.name)}
																			className="ml-2 text-blue-400 underline text-sm"
																		>
																			복사
																		</button>
																	</li>
																))}
															</ul>
														</div>
													</td>
													<td className="p-2 border border-gray-600">
														{timeline ? (
															<div>
																<div>{timeline.description}</div>
																<button
																	className="text-blue-400 underline text-sm mt-1"
																	onClick={() => handleEditTimeline(assignment.id, timeline)}
																>
																	상세보기
																</button>
																<div className="mt-2 flex space-x-2">
																	<button
																		className="bg-green-600 text-white px-2 py-1 text-sm rounded"
																		onClick={() => handleAddTimeline(assignment.id)}
																	>
																		등록
																	</button>
																	<button
																		className="bg-yellow-600 text-white px-2 py-1 text-sm rounded"
																		onClick={() => handleEditTimeline(assignment.id, timeline)}
																	>
																		수정
																	</button>
																	<button
																		className="bg-red-600 text-white px-2 py-1 text-sm rounded"
																		onClick={() => {
																			setTimelineToDelete(timeline);
																			setShowDeleteModal(true);
																		}}
																	>
																		삭제
																	</button>
																</div>
															</div>
														) : (
															<button
																className="text-blue-400 underline text-sm"
																onClick={() => handleAddTimeline(assignment.id)}
															>
																진행 상황 등록
															</button>
														)}
													</td>
													<td className="p-2 border border-gray-600">
														{bonds ? (
															<div>
																<span>{Number(bonds.principal).toLocaleString()}</span>
																<button
																	onClick={() => handleCopy(bonds.principal)}
																	className="ml-2 text-blue-400 underline text-sm"
																>
																	복사하기
																</button>
															</div>
														) : (
															'-'
														)}
													</td>
													<td className="p-2 border border-gray-600">
														{Number(totalEnforcement).toLocaleString()}
													</td>
													<td className="p-2 border border-gray-600">
														<div className="flex flex-col gap-1">
															<button
																className="text-blue-400 underline text-sm"
																onClick={() => toggleExpand(assignment.id)}
															>
																{expanded[assignment.id] ? '숨기기' : '상세보기'}
															</button>
															<button
																className="text-green-400 underline text-sm"
																onClick={() => handleEditAssignment(assignment)}
															>
																의뢰 수정
															</button>
															<button
																className="text-red-400 underline text-sm"
																onClick={() => handleDeleteAssignment(assignment)}
															>
																의뢰 삭제
															</button>
														</div>
													</td>
												</tr>
												{expanded[assignment.id] && (
													<tr>
														<td colSpan="5" className="p-4 bg-gray-800">
															<div className="space-y-4">
																<div>
																	<h3 className="font-bold mb-1">의뢰 설명</h3>
																	<div className="ml-4">
																		{assignment.description || '등록된 설명이 없습니다.'}
																	</div>
																</div>
																<div>
																	<h3 className="font-bold mb-1">채권자 상세</h3>
																	<ul className="list-disc ml-6">
																		{creditors?.map((cred) => (
																			<li key={cred.id}>
																				이름: {cred.name}, 전화: {cred.phone_number}, 주소: {cred.address}, 등록번호: {cred.registration_number}, 직장: {cred.workplace_name}, 직장주소: {cred.workplace_address}
																			</li>
																		))}
																	</ul>
																</div>
																<div>
																	<h3 className="font-bold mb-1">채무자 상세</h3>
																	<ul className="list-disc ml-6">
																		{debtors?.map((deb) => (
																			<li key={deb.id}>
																				<div>
																					이름: {deb.name}
																					{deb.phone_number && <span>, 전화: {deb.phone_number}</span>}
																					{deb.phone_number_2 && <span>, 추가 전화 1: {deb.phone_number_2}</span>}
																					{deb.phone_number_3 && <span>, 추가 전화 2: {deb.phone_number_3}</span>}
																				</div>
																				<div>
																					{deb.address && <>주소: {deb.address}, </>}
																					{deb.registration_number && <>등록번호: {deb.registration_number}, </>}
																					{deb.workplace_name && <>직장: {deb.workplace_name}, </>}
																					{deb.workplace_address && <>직장주소: {deb.workplace_address}</>}
																				</div>
																			</li>
																		))}
																	</ul>
																</div>
																<div>
																	<h3 className="font-bold mt-4 mb-2">최근 진행 상황</h3>
																	{timeline ? (
																		<div className="ml-4">
																			<div>내용: {timeline.description}</div>
																			<div>등록일: {new Date(timeline.created_at).toLocaleString()}</div>
																		</div>
																	) : (
																		<div className="ml-4">진행 상황이 등록되지 않았습니다.</div>
																	)}
																</div>
															</div>
														</td>
													</tr>
												)}
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
			<Toaster />
			{/* 모달들 */}
			<PartyModal
				isOpen={showPartyModal}
				onClose={() => setShowPartyModal(false)}
				title={`${partyType} 상세 정보`}
				partyType={partyType}
				partyData={selectedParty}
				onOpenDebtorEdit={() => setShowDebtorEditModal(true)}
			/>
			{showDebtorEditModal && (
				<DebtorForm
					isSubmitting={loading}
					initialData={selectedParty}
					onOpenChange={setShowDebtorEditModal}
					onSubmit={handleUpdateDebtor}
				/>
			)}
			<TimelineModal
				isOpen={showTimelineModal}
				onClose={() => setShowTimelineModal(false)}
				mode={timelineModalMode}
				timelineInput={timelineInput}
				setTimelineInput={setTimelineInput}
				onSubmitTimeline={handleSubmitTimeline}
			/>
			<DeleteConfirmModal
				isOpen={showDeleteModal}
				onClose={() => setShowDeleteModal(false)}
				title="진행 상황 삭제 확인"
				message="정말 삭제하시겠습니까?"
				onConfirm={() => handleDeleteTimeline(timelineToDelete)}
			/>
			<AssignmentEditModal
				isOpen={showAssignmentEditModal}
				onClose={() => setShowAssignmentEditModal(false)}
				assignmentEditForm={assignmentEditForm}
				setAssignmentEditForm={setAssignmentEditForm}
				onSubmit={handleSubmitAssignmentEdit}
			/>
			<DeleteConfirmModal
				isOpen={showAssignmentDeleteModal}
				onClose={() => setShowAssignmentDeleteModal(false)}
				title="의뢰 삭제 확인"
				message="정말 이 의뢰를 삭제하시겠습니까?"
				onConfirm={confirmDeleteAssignment}
			/>
		</div>
	);
}
