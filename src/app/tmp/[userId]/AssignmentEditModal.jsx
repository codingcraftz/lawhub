// src/components/AssignmentEditModal.jsx
'use client';
import React from 'react';
import Modal from './Modal';

export default function AssignmentEditModal({
	isOpen,
	onClose,
	assignmentEditForm,
	setAssignmentEditForm,
	onSubmit,
}) {
	if (!isOpen) return null;

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="의뢰 수정">
			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium">설명</label>
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
					<label className="block text-sm font-medium">상태</label>
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
					<button className="bg-green-600 text-white px-4 py-2 rounded" onClick={onSubmit}>
						수정
					</button>
					<button className="bg-gray-600 text-white px-4 py-2 rounded" onClick={onClose}>
						취소
					</button>
				</div>
			</div>
		</Modal>
	);
}

