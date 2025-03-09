
// src/components/PartyModal.jsx
'use client';
import React from 'react';
import Modal from './Modal';

export default function PartyModal({
	isOpen,
	onClose,
	title,
	partyType,
	partyData,
	onOpenDebtorEdit, // 채무자 수정 모달 열기 버튼
}) {
	if (!isOpen || !partyData) return null;

	return (
		<Modal isOpen={isOpen} onClose={onClose} title={title}>
			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium">이름</label>
					<div className="mt-1">{partyData.name}</div>
				</div>

				<div>
					<label className="block text-sm font-medium">상태</label>
					<div className="mt-1">{partyData.status}</div>
				</div>

				<div>
					<label className="block text-sm font-medium">전화번호</label>
					<div className="mt-1">{partyData.phone_number}</div>
				</div>

				{partyType === '채무자' && partyData.phone_number_2 && (
					<div>
						<label className="block text-sm font-medium">추가 전화번호 1</label>
						<div className="mt-1">{partyData.phone_number_2}</div>
					</div>
				)}
				{partyType === '채무자' && partyData.phone_number_3 && (
					<div>
						<label className="block text-sm font-medium">추가 전화번호 2</label>
						<div className="mt-1">{partyData.phone_number_3}</div>
					</div>
				)}

				<div>
					<label className="block text-sm font-medium">주소</label>
					<div className="mt-1">{partyData.address}</div>
				</div>
				<div>
					<label className="block text-sm font-medium">등록번호</label>
					<div className="mt-1">{partyData.registration_number}</div>
				</div>
				<div>
					<label className="block text-sm font-medium">직장</label>
					<div className="mt-1">{partyData.workplace_name}</div>
				</div>
				<div>
					<label className="block text-sm font-medium">직장 주소</label>
					<div className="mt-1">{partyData.workplace_address}</div>
				</div>

				{partyType === '채무자' && (
					<div className="flex justify-end">
						<button
							className="bg-green-600 text-white px-4 py-2 rounded mr-2"
							onClick={onOpenDebtorEdit}
						>
							채무자 정보 수정
						</button>
					</div>
				)}

				<div className="flex justify-end">
					<button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={onClose}>
						닫기
					</button>
				</div>
			</div>
		</Modal>
	);
}
