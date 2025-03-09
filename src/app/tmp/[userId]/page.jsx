
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import Pagination from './Pagination';
import { Toaster, toast } from 'react-hot-toast';
import DebtorForm from '../../client/assignment/_components/dialogs/DebtorForm';

const COPY_MESSAGE_TEMPLATE = `안녕하십니까, 채권관리 담당자 박준영입니다.

당사는 귀하가 보유하고 계신 ABC채권을 인수하였으며, 관련하여 채무 상환 안내를 드립니다.

정확한 납부 금액 안내를 위해 본 메시지를 확인하신 후 회신 부탁드립니다. 회신을 주시면 금액을 안내드리겠습니다.

[📌납부 계좌 정보]
은행: 신한은행
계좌번호: 110-401-411058
예금주: 황현기

만약 본 채권에 대한 이의사항이 있으시거나 반대 채권을 보유하신 경우, 반드시 본 메시지로 회신 부탁드립니다.

기한 내 추가적인 변제가 이루어지지 않을 경우, 법적 절차가 진행될 수 있으며, 이에 따른 법적 비용 발생 및 신용상 불이익이 발생할 수 있음을 안내드립니다.

원만한 처리를 위해 신속한 회신을 부탁드립니다.

감사합니다.
`

// 현재 날짜를 "YY. M. D" 형식으로 반환하는 헬퍼 함수
const getCurrentDateFormatted = () => {
	const now = new Date();
	const year = now.getFullYear().toString().slice(-2);
	const month = now.getMonth() + 1;
	const day = now.getDate();
	return `${year}. ${month}. ${day}`;
};

function Modal({ isOpen, onClose, title, children }) {
	// ESC 키 눌림 시 모달 닫기
	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.key === "Escape") {
				onClose();
			}
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [onClose]);

	if (!isOpen) return null;
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
			<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-lg w-full">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
					<button onClick={onClose} className="text-2xl text-gray-900 dark:text-white">
						&times;
					</button>
				</div>
				<div>{children}</div>
			</div>
		</div>
	);
}


export default function UserAssignmentsPage() {
	const { userId } = useParams();
	const [assignments, setAssignments] = useState([]);
	const [loading, setLoading] = useState(false);
	const [expanded, setExpanded] = useState({});

	// 페이지네이션 상태
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;
	const [totalPages, setTotalPages] = useState(1);

	// 컴포넌트 마운트 시 localStorage에서 현재 페이지 복원
	useEffect(() => {
		const savedPage = localStorage.getItem('currentPage');
		if (savedPage) {
			setCurrentPage(parseInt(savedPage, 10));
		}
	}, []);

	// currentPage 변경 시 localStorage에 저장
	useEffect(() => {
		localStorage.setItem('currentPage', currentPage);
	}, [currentPage]);

	// 모달 관련 상태들
	const [showPartyModal, setShowPartyModal] = useState(false);
	const [selectedParty, setSelectedParty] = useState(null);
	const [partyType, setPartyType] = useState('');

	const [showTimelineModal, setShowTimelineModal] = useState(false);
	const [timelineModalMode, setTimelineModalMode] = useState('edit'); // 'edit' 또는 'add'
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
		status: ''
	});

	// 추가: 채무자 정보 수정 모달 상태
	const [showDebtorEditModal, setShowDebtorEditModal] = useState(false);

	// 클립보드 복사 함수
	const handleCopy = async (amount) => {
		const formattedAmount = typeof amount === 'number' ? amount.toLocaleString() : amount;
		const message = COPY_MESSAGE_TEMPLATE.replace('{금액}', formattedAmount);
		try {
			await navigator.clipboard.writeText(message);
			toast.success("메시지가 복사되었습니다.");
		} catch (error) {
			toast.error("메시지 복사에 실패했습니다.");
		}
	};

	const handleCopyName = async (value) => {
		try {
			await navigator.clipboard.writeText(value);
			toast.success("메시지가 복사되었습니다.");
		} catch (error) {
			toast.error("메시지 복사에 실패했습니다.");
		}
	};


	// 전체 데이터를 불러오는 함수
	const fetchData = useCallback(async () => {
		setLoading(true);
		try {
			const { data: clientAssignments, count, error: clientError } =
				await supabase
					.from('assignment_clients_with_debtor')
					.select('*', { count: 'exact' })
					.eq('client_id', userId)
					.order('debtor_name', { ascending: true })
					.range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

			if (clientError) throw clientError;
			if (!clientAssignments) {
				setAssignments([]);
				setTotalPages(1);
				setLoading(false);
				return;
			}
			setTotalPages(Math.ceil(count / itemsPerPage));

			const assignmentsData = await Promise.all(
				clientAssignments.map(async (clientAssignment) => {
					const assignmentId = clientAssignment.assignment_id;
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
						totalEnforcement
					};
				})
			);
			setAssignments(assignmentsData);
			if (currentPage > 1 && assignmentsData.length === 0) {
				setCurrentPage(currentPage - 1);
			}
		} catch (error) {
			console.error('Error fetching assignments:', error);
		}
		setLoading(false);
	}, [userId, currentPage]);

	useEffect(() => {
		if (userId) fetchData();
	}, [userId, currentPage, fetchData]);

	const toggleExpand = (assignmentId) => {
		setExpanded((prev) => ({
			...prev,
			[assignmentId]: !prev[assignmentId],
		}));
	};

	const handleEditParty = (type, record) => {
		setSelectedParty(record);
		setPartyType(type);
		setShowPartyModal(true);
	};

	// 진행 상황 작업
	const handleEditTimeline = async (assignmentId, timelineData) => {
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
		await fetchData();
		setShowDeleteModal(false);
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
		await fetchData();
		setShowTimelineModal(false);
		setLoading(false);
	};

	const handleEditAssignment = (assignmentData) => {
		setSelectedAssignment(assignmentData);
		setAssignmentEditForm({
			description: assignmentData.description,
			status: assignmentData.status
		});
		setShowAssignmentEditModal(true);
	};

	const handleDeleteAssignment = (assignmentData) => {
		setSelectedAssignment(assignmentData);
		setShowAssignmentDeleteModal(true);
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
		await fetchData();
		setLoading(false);
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
		await fetchData();
		setLoading(false);
	};

	// 채무자 정보 수정 함수
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
				fetchData();
			}
		} catch (error) {
			toast.error('채무자 정보 수정 중 오류 발생');
		}
		setShowDebtorEditModal(false);
	};

	const formatAmount = (amount) =>
		typeof amount === 'number' ? amount.toLocaleString() : amount;

	if (loading) {
		return <div className="p-4 dark:bg-gray-900 dark:text-white">Loading...</div>;
	}

	return (
		<div className="p-4 dark:bg-gray-900 dark:text-white min-h-screen">
			<Toaster />
			<h1 className="text-2xl font-bold mb-4">의뢰 목록</h1>
			<table className="min-w-full border border-gray-600">
				<thead className="bg-gray-700">
					<tr>
						<th className="p-2 border border-gray-600">설명</th>
						<th className="p-2 border border-gray-600">당사자 (채권자/채무자)</th>
						<th className="p-2 border border-gray-600">진행 상황</th>
						<th className="p-2 border border-gray-600">채권금</th>
						<th className="p-2 border border-gray-600">회수금</th>
						<th className="p-2 border border-gray-600">액션</th>
					</tr>
				</thead>
				<tbody>
					{assignments.map((item) => {
						const { assignment, creditors, debtors, timeline, bonds, totalEnforcement } = item;
						if (!assignment) return null;
						return (
							<React.Fragment key={assignment.id}>
								<tr className="hover:bg-gray-600">
									<td className="p-2 border border-gray-600">{assignment.description}</td>
									<td className="p-2 border border-gray-600">
										<div>
											<strong>채권자:</strong>
											<ul>
												{creditors?.map((cred) => (
													<li key={cred.id} className="flex items-center">
														{cred.name}
														<button
															className="ml-2 text-blue-400 underline text-sm"
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
														{deb.name}
														<button
															className="ml-2 text-blue-400 underline text-sm"
															onClick={() => handleEditParty('채무자', deb)}
														>
															상세보기
														</button>
														<button onClick={() => handleCopyName(deb.name)} className="ml-2 text-blue-400 underline text-sm"
														>복사</button>
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
														onClick={() => handleDeleteTimeline(timeline)}
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
												<span>{formatAmount(Number(bonds.principal))}</span>
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
										{formatAmount(Number(totalEnforcement))}
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
										<td colSpan="6" className="p-4 bg-gray-800">
											<div>
												<h3 className="font-bold mb-2">당사자 상세 정보</h3>
												<div>
													<strong>채권자:</strong>
													<ul className="list-disc ml-4">
														{creditors?.map((cred) => (
															<li key={cred.id}>
																이름: {cred.name}, 전화: {cred.phone_number}, 주소: {cred.address}, 등록번호: {cred.registration_number}, 직장: {cred.workplace_name}, 직장주소: {cred.workplace_address}
															</li>
														))}
													</ul>
												</div>
												<div className="mt-2">
													<strong>채무자:</strong>
													<ul className="list-disc ml-4">
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
												<h3 className="font-bold mt-4 mb-2">진행 상황 상세 정보</h3>
												{timeline ? (
													<div>
														<div>내용: {timeline.description}</div>
														<div>등록일: {new Date(timeline.created_at).toLocaleString()}</div>
													</div>
												) : (
													<div>진행 상황이 등록되지 않았습니다.</div>
												)}
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
					onPageChange={(page) => setCurrentPage(page)}
				/>
			)}

			<Modal
				isOpen={showPartyModal}
				onClose={() => setShowPartyModal(false)}
				title={`${partyType} 상세 정보`}
			>
				{selectedParty && (
					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">이름</label>
							<div className="mt-1 text-gray-900 dark:text-white">{selectedParty.name}</div>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">전화번호</label>
							<div className="mt-1 text-gray-900 dark:text-white">{selectedParty.phone_number}</div>
						</div>
						{partyType === '채무자' && selectedParty.phone_number_2 && (
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">추가 전화번호 1</label>
								<div className="mt-1 text-gray-900 dark:text-white">{selectedParty.phone_number_2}</div>
							</div>
						)}
						{partyType === '채무자' && selectedParty.phone_number_3 && (
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">추가 전화번호 2</label>
								<div className="mt-1 text-gray-900 dark:text-white">{selectedParty.phone_number_3}</div>
							</div>
						)}
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">주소</label>
							<div className="mt-1 text-gray-900 dark:text-white">{selectedParty.address}</div>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">등록번호</label>
							<div className="mt-1 text-gray-900 dark:text-white">{selectedParty.registration_number}</div>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">직장</label>
							<div className="mt-1 text-gray-900 dark:text-white">{selectedParty.workplace_name}</div>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">직장 주소</label>
							<div className="mt-1 text-gray-900 dark:text-white">{selectedParty.workplace_address}</div>
						</div>
						{/* 채무자일 경우 수정 버튼 추가 */}
						{partyType === '채무자' && (
							<div className="flex justify-end">
								<button
									className="bg-green-600 text-white px-4 py-2 rounded mr-2"
									onClick={() => setShowDebtorEditModal(true)}
								>
									채무자 정보 수정
								</button>
							</div>
						)}
						<div className="flex justify-end">
							<button
								className="bg-blue-600 text-white px-4 py-2 rounded"
								onClick={() => setShowPartyModal(false)}
							>
								닫기
							</button>
						</div>
					</div>
				)}
			</Modal>

			{/* DebtorForm 모달: 채무자 정보 수정 */}
			{showDebtorEditModal && (
				<DebtorForm
					isSubmitting={loading}
					initialData={selectedParty}
					onOpenChange={setShowDebtorEditModal}
					onSubmit={handleUpdateDebtor}
				/>
			)}

			{/* 진행상황 등록/수정 모달 */}
			<Modal
				isOpen={showTimelineModal}
				onClose={() => setShowTimelineModal(false)}
				title={`진행 상황 ${timelineModalMode === 'edit' ? '수정' : '등록'}`}
			>
				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">내용</label>
						<textarea
							className="mt-1 w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:text-white"
							rows="4"
							value={timelineInput}
							onChange={(e) => setTimelineInput(e.target.value)}
						/>
					</div>
					{/* 프리셋 버튼들 */}
					<div className="flex flex-col gap-2 mb-2">
						<div className="flex gap-2">
							<button
								type="button"
								className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
								onClick={() =>
									setTimelineInput(`변제 카톡 발송 - ${getCurrentDateFormatted()}`)
								}
							>
								변제 카톡 발송
							</button>
							<button
								type="button"
								className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
								onClick={() =>
									setTimelineInput(`변제 문자 발송 - ${getCurrentDateFormatted()}`)
								}
							>
								변제 문자 발송
							</button>
							<button
								type="button"
								className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
								onClick={() =>
									setTimelineInput(`변제 카톡 발송(이름 상이) - ${getCurrentDateFormatted()}`)
								}
							>
								변제 카톡 발송(이름 상이)
							</button>
						</div>
						<div className="flex gap-2">
							<button
								type="button"
								className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
								onClick={() =>
									setTimelineInput(`연락 불가(카톡 이름 상이) - ${getCurrentDateFormatted()}`)
								}
							>
								연락 불가(카톡 이름 상이)
							</button>
							<button
								type="button"
								className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
								onClick={() =>
									setTimelineInput(`연락 불가(번호 없음) - ${getCurrentDateFormatted()}`)
								}
							>
								연락 불가(번호 없음)
							</button>
						</div>
					</div>
					<div className="flex justify-end space-x-2">
						<button
							className="bg-green-600 text-white px-4 py-2 rounded"
							onClick={handleSubmitTimeline}
						>
							{timelineModalMode === 'edit' ? '수정' : '등록'}
						</button>
						<button
							className="bg-gray-600 text-white px-4 py-2 rounded"
							onClick={() => setShowTimelineModal(false)}
						>
							취소
						</button>
					</div>
				</div>
			</Modal>

			<Modal
				isOpen={showDeleteModal}
				onClose={() => setShowDeleteModal(false)}
				title="진행 상황 삭제 확인"
			>
				<div className="space-y-4">
					<div>정말 삭제하시겠습니까?</div>
					<div className="flex justify-end space-x-2">
						<button
							className="bg-red-600 text-white px-4 py-2 rounded"
							onClick={() => handleDeleteTimeline(timelineToDelete)}
						>
							예
						</button>
						<button
							className="bg-gray-600 text-white px-4 py-2 rounded"
							onClick={() => setShowDeleteModal(false)}
						>
							취소
						</button>
					</div>
				</div>
			</Modal>

			<Modal
				isOpen={showAssignmentEditModal}
				onClose={() => setShowAssignmentEditModal(false)}
				title="의뢰 수정"
			>
				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">설명</label>
						<input
							type="text"
							className="mt-1 w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:text-white"
							value={assignmentEditForm.description}
							onChange={(e) =>
								setAssignmentEditForm((prev) => ({ ...prev, description: e.target.value }))
							}
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">상태</label>
						<input
							type="text"
							className="mt-1 w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:text-white"
							value={assignmentEditForm.status}
							onChange={(e) =>
								setAssignmentEditForm((prev) => ({ ...prev, status: e.target.value }))
							}
						/>
					</div>
					<div className="flex justify-end space-x-2">
						<button
							className="bg-green-600 text-white px-4 py-2 rounded"
							onClick={handleSubmitAssignmentEdit}
						>
							수정
						</button>
						<button
							className="bg-gray-600 text-white px-4 py-2 rounded"
							onClick={() => setShowAssignmentEditModal(false)}
						>
							취소
						</button>
					</div>
				</div>
			</Modal>

			<Modal
				isOpen={showAssignmentDeleteModal}
				onClose={() => setShowAssignmentDeleteModal(false)}
				title="의뢰 삭제 확인"
			>
				<div className="space-y-4">
					<div>정말 이 의뢰를 삭제하시겠습니까?</div>
					<div className="flex justify-end space-x-2">
						<button
							className="bg-red-600 text-white px-4 py-2 rounded"
							onClick={confirmDeleteAssignment}
						>
							예
						</button>
						<button
							className="bg-gray-600 text-white px-4 py-2 rounded"
							onClick={() => setShowAssignmentDeleteModal(false)}
						>
							취소
						</button>
					</div>
				</div>
			</Modal>
		</div>
	);
}
