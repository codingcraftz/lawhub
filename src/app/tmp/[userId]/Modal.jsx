'use client'

import React, { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children }) {
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

