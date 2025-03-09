// src/components/DeleteConfirmModal.jsx
'use client';
import React from 'react';
import Modal from './Modal';

export default function DeleteConfirmModal({
	isOpen,
	onClose,
	title,
	message,
	onConfirm,
}) {
	if (!isOpen) return null;

	return (
		<Modal isOpen={isOpen} onClose={onClose} title={title}>
			<div className="space-y-4">
				<div>{message}</div>
				<div className="flex justify-end space-x-2">
					<button
						className="bg-red-600 text-white px-4 py-2 rounded"
						onClick={onConfirm}
					>
						예
					</button>
					<button
						className="bg-gray-600 text-white px-4 py-2 rounded"
						onClick={onClose}
					>
						취소
					</button>
				</div>
			</div>
		</Modal>
	);
}

