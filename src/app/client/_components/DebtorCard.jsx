"use client";

import React from "react";

const DebtorCard = ({ group = false, description, createdAt, debtors, creditors }) => {
	return (
		<div className="bg-gray-3 shadow-md rounded-md p-4 flex flex-col gap-3 hover:shadow-lg transition-shadow cursor-pointer">
			<div className="flex justify-between">
				<h3 className="font-semibold">채권자: {creditors?.join(", ")}</h3>
				{group ? <p>단체</p> : <p>개인</p>}
			</div>
			<h3 className="font-semibold">채무자: {debtors?.join(", ")}</h3>
			<p className="text-sm">
				<span className="font-medium">{description} </span>
			</p>
			<p className="text-sm">
				생성일: {new Date(createdAt).toLocaleDateString("ko-KR")}
			</p>
		</div>
	);
};

export default DebtorCard;
