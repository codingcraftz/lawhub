"use client";

import React from "react";

const DebtorCard = ({
	type = "개인",
	description,
	createdAt,
	debtors,
	creditors,
	assignees,
	name,
	status,
}) => {
	const isClosed = status === "closed";

	return (
		<div
			className={`
        bg-gray-2 shadow-md rounded-lg p-4 sm:p-6 flex flex-col gap-4 h-full
        hover:shadow-lg transition-shadow cursor-pointer border border-gray-7
        ${isClosed ? "opacity-80" : ""}
      `}
		>
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-3">
				<div className="flex items-center gap-2">
					<span className="font-semibold">{name}</span>
					<span
						className={`
                text-sm font-semibold py-1 px-3 rounded-full
                ${type === "개인"
								? "bg-blue-200 text-blue-800"
								: "bg-green-200 text-green-800"
							}
              `}
					>
						{type === "개인" ? "개인" : "단체"}
					</span>
				</div>

				<span className="text-xs text-gray-12">
					{new Date(createdAt).toLocaleDateString("ko-KR", {
						year: "numeric",
						month: "long",
						day: "numeric",
					})}
				</span>
			</div>

			<div className="flex flex-col gap-3 flex-1">
				<h3 className="font-bold text-md text-gray-11 flex-1">{description}</h3>

				{isClosed && (
					<div className="text-red-9 text-sm font-semibold">[완결된 사건]</div>
				)}

				<div className="flex gap-2">
					<h4 className="text-sm font-medium">담당자:</h4>
					<p className="text-sm">
						{assignees?.join(", ") || (
							<span className="text-gray-10">미배정</span>
						)}
					</p>
				</div>

				<div className="flex gap-2">
					<h4 className="text-sm font-medium">채권자:</h4>
					<p className="text-sm">
						{creditors?.join(", ") || (
							<span className="text-gray-10">미등록</span>
						)}
					</p>
				</div>

				<div className="flex gap-2">
					<h4 className="text-sm font-medium">채무자:</h4>
					<p className="text-sm">
						{debtors?.join(", ") || (
							<span className="text-gray-10">미등록</span>
						)}
					</p>
				</div>
			</div>
		</div>
	);
};

export default DebtorCard;

