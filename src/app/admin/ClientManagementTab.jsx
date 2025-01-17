"use client";

import React, { useState } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Button, Flex, Text } from "@radix-ui/themes";
import InputMask from "react-input-mask";

import ClientSearchBar from "./ClientSearchBar";

export default function ClientManagementTab({ users, onRefresh }) {
	const roles = ["admin", "staff", "client"];

	const [searchTerm, setSearchTerm] = useState("");
	const [editingUserId, setEditingUserId] = useState(null);
	const [formData, setFormData] = useState({
		name: "",
		phone_number: "",
		birth_date: "",
	});

	// 고객만 (role === 'client')
	const clientList = users.filter((u) => u.role === "client");

	// 이름 검색
	const filteredClients = clientList.filter((c) =>
		(c.name || "").toLowerCase().includes(searchTerm.toLowerCase())
	);

	// 편집 시작
	const handleStartEdit = (user) => {
		setEditingUserId(user.id);
		setFormData({
			name: user.name || "",
			phone_number: (user.phone_number || "").replace("+82 ", "0"),
			birth_date: user.birth_date || "",
		});
	};

	// 취소
	const handleCancelEdit = () => {
		setEditingUserId(null);
		setFormData({ name: "", phone_number: "", birth_date: "" });
	};

	// 저장
	const handleSaveEdit = async (userId) => {
		const formattedPhone =
			formData.phone_number.startsWith("0")
				? `+82 ${formData.phone_number.slice(1)}`
				: formData.phone_number;

		const { error } = await supabase
			.from("users")
			.update({
				name: formData.name,
				role: formData.role,
				phone_number: formattedPhone,
				birth_date: formData.birth_date,
			})
			.eq("id", userId);

		if (error) {
			console.error("Error updating client:", error);
			alert("업데이트 중 오류가 발생했습니다.");
			return;
		}
		alert("고객 정보가 업데이트되었습니다.");
		setEditingUserId(null);
		onRefresh();
	};

	// 입력변경
	const handleChange = (field, value) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	return (
		<Box>
			<Flex justify="between" align="center" className="mb-4">
				<Text size="5" weight="bold">
					고객 관리
				</Text>
				<ClientSearchBar
					searchTerm={searchTerm}
					setSearchTerm={setSearchTerm}
					placeholder="고객 이름 검색"
				/>
			</Flex>

			<div className="overflow-x-auto">
				<table className="w-full border-collapse">
					<thead className="bg-gray-3">
						<tr>
							<th className="p-3 text-left border-b border-gray-6">이름</th>
							<th className="p-3 text-left border-b border-gray-6">이메일</th>
							<th className="p-3 text-left border-b border-gray-6">전화번호</th>
							<th className="p-3 text-left border-b border-gray-6">생년월일</th>
							<th className="p-3 text-left border-b border-gray-6">역할</th>
							<th className="p-3 text-left border-b border-gray-6">수정</th>
						</tr>
					</thead>
					<tbody>
						{filteredClients.map((user) => {
							const isEditing = editingUserId === user.id;
							return (
								<tr key={user.id} className="border-b border-gray-6">
									{/* 이름 */}
									<td className="p-2">
										{isEditing ? (
											<input
												value={formData.name}
												onChange={(e) => handleChange("name", e.target.value)}
												className="border border-gray-6 rounded px-2 py-1 w-full"
											/>
										) : (
											user.name || "-"
										)}
									</td>

									{/* 이메일 */}
									<td className="p-2">{user.email || "-"}</td>

									{/* 전화번호 */}
									<td className="p-2">
										{isEditing ? (
											<InputMask
												mask="010-9999-9999"
												value={formData.phone_number}
												onChange={(e) => handleChange("phone_number", e.target.value)}
											>
												{(inputProps) => (
													<input
														{...inputProps}
														className="border border-gray-6 rounded px-2 py-1 w-full"
													/>
												)}
											</InputMask>
										) : user.phone_number ? (
											user.phone_number.replace("+82 ", "0")
										) : (
											"-"
										)}
									</td>

									{/* 생년월일 */}
									<td className="p-2">
										{isEditing ? (
											<InputMask
												mask="9999-99-99"
												value={formData.birth_date}
												onChange={(e) => handleChange("birth_date", e.target.value)}
											>
												{(inputProps) => (
													<input
														{...inputProps}
														placeholder="예) 1990-01-01"
														className="border border-gray-6 rounded px-2 py-1 w-full"
													/>
												)}
											</InputMask>
										) : (
											user.birth_date || "-"
										)}
									</td>

									<td className="p-2">
										{isEditing ? (
											<>
												<select
													value={user.role || ""}
													onChange={(e) => handleChange("role", e.target.value)}
												>
													{roles.map((r) => (
														<option key={r} value={r}>
															{r}
														</option>
													))}
												</select>

											</>
										) : (
											user.role || "-"
										)}
									</td>

									{/* 수정/저장/취소 버튼 */}
									<td className="p-2">
										{isEditing ? (
											<div className="flex gap-2">
												<Button
													type="button"
													onClick={() => handleSaveEdit(user.id)}
												>
													저장
												</Button>
												<Button
													type="button"
													color="gray"
													onClick={handleCancelEdit}
												>
													취소
												</Button>
											</div>
										) : (
											<Button
												type="button"
												onClick={() => handleStartEdit(user)}
											>
												수정
											</Button>
										)}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</Box>
	);
}

