"use client";

import React from "react";

export default function StaffTable({ staffList, onUpdateUser }) {
	const roles = ["admin", "staff", "client"];
	const positions = ["변호사", "법무사", "사무직원"];
	const employeeTypes = ["internal", "external"];

	return (
		<div className="overflow-x-auto">
			<table className="w-full border-collapse">
				<thead className="bg-gray-3">
					<tr>
						<th className="p-3 text-left border-b border-gray-6">이름</th>
						<th className="p-3 text-left border-b border-gray-6">이메일</th>
						<th className="p-3 text-left border-b border-gray-6">Role</th>
						<th className="p-3 text-left border-b border-gray-6">직책</th>
						<th className="p-3 text-left border-b border-gray-6">유형</th>
					</tr>
				</thead>
				<tbody>
					{staffList.map((user) => (
						<tr key={user.id} className="border-b border-gray-6">
							<td className="p-2">{user.name || "-"}</td>
							<td className="p-2">{user.email || "-"}</td>
							<td className="p-2">
								<select
									value={user.role || ""}
									onChange={(e) => onUpdateUser(user.id, { role: e.target.value })}
									className="border border-gray-6 rounded px-2 py-1 w-full"
								>
									{roles.map((r) => (
										<option key={r} value={r}>
											{r}
										</option>
									))}
								</select>
							</td>
							<td className="p-2">
								<select
									value={user.position || ""}
									onChange={(e) => onUpdateUser(user.id, { position: e.target.value })}
									className="border border-gray-6 rounded px-2 py-1 w-full"
								>
									<option value="">직책 선택</option>
									{positions.map((pos) => (
										<option key={pos} value={pos}>
											{pos}
										</option>
									))}
								</select>
							</td>
							<td className="p-2">
								<select
									value={user.employee_type || ""}
									onChange={(e) =>
										onUpdateUser(user.id, { employee_type: e.target.value })
									}
									className="border border-gray-6 rounded px-2 py-1 w-full"
								>
									<option value="">유형 선택</option>
									{employeeTypes.map((etype) => (
										<option key={etype} value={etype}>
											{etype === "internal" ? "내부 직원" : "외부 직원"}
										</option>
									))}
								</select>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

