// src/components/AssignmentRow.jsx
'use client';
import React from 'react';

export default function AssignmentRow({
	assignmentData, // { assignment, creditors, debtors, timeline, bonds, totalEnforcement }
	expanded,
	onToggleExpand,
	onEditAssignment,
	onDeleteAssignment,
	onEditParty,      // (type, record) => void; 채권자/채무자 상세보기 호출
	onAddTimeline,    // (assignmentId) => void
	onEditTimeline,   // (assignmentId, timelineData) => void
	onDeleteTimeline, // (timelineData) => void
	handleCopy,       // (amount) => void
	handleCopyName,   // (name) => void
}) {
	const { assignment, creditors, debtors, timeline, bonds, totalEnforcement } = assignmentData;

	const formatAmount = (amount) =>
		typeof amount === 'number' ? amount.toLocaleString() : amount;

	return (
		<>
			<tr className="hover:bg-gray-600">
				{/* 당사자 (채권자/채무자) */}
				<td className="p-2 border border-gray-600">
					<div>
						<strong>채권자:</strong>
						<ul>
							{creditors &&
								creditors.map((cred) => (
									<li key={cred.id} className="flex items-center gap-2">
										<span>{cred.name}</span>
										<button
											className="text-blue-400 underline text-sm"
											onClick={() => onEditParty('채권자', cred)}
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
							{debtors &&
								debtors.map((deb) => (
									<li key={deb.id} className="flex items-center gap-2">
										<span>{deb.name}</span>
										<span>{deb.status || '등록된 상태가 없습니다.'}</span>
										<button
											className="text-blue-400 underline text-sm"
											onClick={() => onEditParty('채무자', deb)}
										>
											상세보기
										</button>
										<button
											className="text-blue-400 underline text-sm"
											onClick={() => handleCopyName(deb.name)}
										>
											복사
										</button>
									</li>
								))}
						</ul>
					</div>
				</td>

				{/* 진행 상황 (최근 진행 상황) */}
				<td className="p-2 border border-gray-600">
					{timeline ? (
						<div>
							<div>{timeline.description}</div>
							<button
								className="text-blue-400 underline text-sm mt-1"
								onClick={() => onEditTimeline(assignment.id, timeline)}
							>
								상세보기
							</button>
							<div className="mt-2 flex space-x-2">
								<button
									className="bg-green-600 text-white px-2 py-1 text-sm rounded"
									onClick={() => onAddTimeline(assignment.id)}
								>
									등록
								</button>
								<button
									className="bg-yellow-600 text-white px-2 py-1 text-sm rounded"
									onClick={() => onEditTimeline(assignment.id, timeline)}
								>
									수정
								</button>
								<button
									className="bg-red-600 text-white px-2 py-1 text-sm rounded"
									onClick={() => onDeleteTimeline(timeline)}
								>
									삭제
								</button>
							</div>
						</div>
					) : (
						<button
							className="text-blue-400 underline text-sm"
							onClick={() => onAddTimeline(assignment.id)}
						>
							진행 상황 등록
						</button>
					)}
				</td>

				{/* 채권금 */}
				<td className="p-2 border border-gray-600">
					{bonds ? (
						<div>
							<span>{formatAmount(bonds.principal)}</span>
							<button
								className="ml-2 text-blue-400 underline text-sm"
								onClick={() => handleCopy(bonds.principal)}
							>
								복사하기
							</button>
						</div>
					) : (
						'-'
					)}
				</td>

				{/* 회수금 */}
				<td className="p-2 border border-gray-600">
					{formatAmount(totalEnforcement)}
				</td>

				{/* 액션 버튼들 */}
				<td className="p-2 border border-gray-600">
					<div className="flex flex-col gap-1">
						<button
							className="text-blue-400 underline text-sm"
							onClick={() => onToggleExpand(assignment.id)}
						>
							{expanded ? '숨기기' : '상세보기'}
						</button>
						<button
							className="text-green-400 underline text-sm"
							onClick={() => onEditAssignment(assignment)}
						>
							의뢰 수정
						</button>
						<button
							className="text-red-400 underline text-sm"
							onClick={() => onDeleteAssignment(assignment)}
						>
							의뢰 삭제
						</button>
					</div>
				</td>
			</tr>

			{/* 확장된 상세 정보 */}
			{expanded && (
				<tr>
					<td colSpan="6" className="p-4 bg-gray-800">
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
									{creditors &&
										creditors.map((cred) => (
											<li key={cred.id}>
												이름: {cred.name}, 전화: {cred.phone_number}, 주소: {cred.address}, 등록번호: {cred.registration_number}, 직장: {cred.workplace_name}, 직장주소: {cred.workplace_address}
											</li>
										))}
								</ul>
							</div>
							<div>
								<h3 className="font-bold mb-1">채무자 상세</h3>
								<ul className="list-disc ml-6">
									{debtors &&
										debtors.map((deb) => (
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
		</>
	);
}

