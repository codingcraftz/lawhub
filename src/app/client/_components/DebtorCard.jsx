"use client";

import React from "react";

const DebtorCard = ({ type = "개인", description, createdAt, debtors, creditors }) => {
	return (
		<div className="bg-gray-3 shadow-md rounded-lg p-6 flex flex-col gap-4 hover:shadow-lg transition-shadow cursor-pointer border border-gray-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<span
					className={`text-xs font-medium py-1 px-2 rounded-md ${type === "개인" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
						}`}
				>
					{type === "개인" ? "개인" : `${type}`}
				</span>
				<span className="text-sm text-gray-10">
					{new Date(createdAt).toLocaleDateString("ko-KR")}
				</span>
			</div>

			{/* Content */}
			<div>
				<h3 className="font-semibold text-lg mb-2 text-gray-11">{description}</h3>
				{/* 채권자 */}
				<div className="mb-2">
					<h4 className="text-sm font-medium">채권자:</h4>
					<p className="text-sm">{creditors?.join(", ") || "없음"}</p>
				</div>
				{/* 채무자 */}
				<div>
					<h4 className="text-sm font-medium">채무자:</h4>
					<p className="text-sm">{debtors?.join(", ") || "없음"}</p>
				</div>
			</div>
		</div>
	);
};

export default DebtorCard;

