"use client";

import React from "react";

const DebtorCard = ({
	type = "개인",
	description,
	createdAt,
	debtors,
	creditors,
	clientType,
	name
}) => {
	return (
		<div className="bg-gray-2 shadow-md rounded-lg p-6 flex flex-col gap-4 hover:shadow-lg transition-shadow cursor-pointer border border-gray-7">
			{/* Header */}
			<div className="flex justify-between items-center border-b pb-3">
				<div className="flex items-center gap-2">
					<span className="font-semibold">{name}</span>
					{clientType &&
						<span
							className={`text-sm font-semibold py-1 px-3 rounded-full ${type === "개인"
								? "bg-blue-200 text-blue-800"
								: "bg-green-200 text-green-800"
								}`}
						>
							{clientType}
						</span>
					}
				</div>
				<span className="text-xs text-gray-12">
					{new Date(createdAt).toLocaleDateString("ko-KR", {
						year: "numeric",
						month: "long",
						day: "numeric",
					})}
				</span>
			</div>

			{/* Content */}
			<div className="flex flex-col gap-3">
				<h3 className="font-bold text-md text-gray-11">{description}</h3>
				{/* 채권자 */}
				<div>
					<h4 className="text-sm font-medium">채권자:</h4>
					<p className="text-sm" >
						{creditors?.join(", ") || <span className="text-gray-10">없음</span>}
					</p>
				</div>
				{/* 채무자 */}
				<div>
					<h4 className="text-sm font-medium">채무자:</h4>
					<p className="text-sm">
						{debtors?.join(", ") || <span className="text-gray-10">없음</span>}
					</p>
				</div>
			</div>
		</div>
	);
};

export default DebtorCard;

