import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Box, Flex, Button, Text } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";
import InputMask from "react-input-mask";
import { supabase } from "@/utils/supabase";

export default function DebtorForm({ onOpenChange, onSubmit, initialData = null }) {
	const [formData, setFormData] = useState({
		name: "",
		birth_date: "",
		phone_number: "",
		address: "",
	});
	const [errors, setErrors] = useState({});
	const [isSearchMode, setIsSearchMode] = useState(false);
	const [userSearchTerm, setUserSearchTerm] = useState("");
	const [userSearchResults, setUserSearchResults] = useState([]);
	const [isSearching, setIsSearching] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (initialData) {
			setFormData({
				name: initialData.name || null,
				birth_date: initialData.birth_date || null,
				phone_number: initialData.phone_number || null,
				address: initialData.address || null,
			});
		}
	}, [initialData]);

	const validate = () => {
		const newErrors = {};
		if (!formData.name.trim()) {
			newErrors.name = "이름은 필수입니다.";
		}
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleChangeRaw = (name, value) => {
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!validate()) return;
		if (isSubmitting) return;
		setIsSubmitting(true);
		onSubmit(formData);
		setIsSubmitting(false);
	};

	const handleUserSearch = async () => {
		if (!userSearchTerm.trim()) return;
		setIsSearching(true);
		const { data, error } = await supabase
			.from("users")
			.select("name, birth_date, phone_number")
			.ilike("name", `%${userSearchTerm}%`);

		if (error) {
			console.error("유저 검색 오류:", error);
		} else {
			const formattedResults = data.map((user) => ({
				...user,
				phone_number: user.phone_number?.startsWith("+82")
					? user.phone_number.replace("+82 ", "0")
					: user.phone_number,
			}));
			setUserSearchResults(formattedResults || []);
		}
		setIsSearching(false);
	};


	const handleUserSelect = (user) => {
		setFormData({
			name: user.name,
			birth_date: user.birth_date || "",
			phone_number: user.phone_number || "",
			address: "", // 주소는 공란으로 유지
		});
		setIsSearchMode(false); // 검색 모드 종료
	};

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Overlay className="fixed inset-0 bg-black opacity-50 z-40" />
			<Dialog.Content
				className="
          fixed left-1/2 top-1/2 max-h-[85vh] min-w-[450px] max-w-[650px]
          -translate-x-1/2 -translate-y-1/2 rounded-md p-6
          bg-gray-2 border border-gray-6 shadow-md shadow-gray-7
          focus:outline-none z-50 overflow-y-auto text-gray-12
        "
			>
				<Flex justify="between" align="center" className="mb-3">
					<Dialog.Title className="font-bold text-xl flex gap-4">
						<p>
							{initialData ? "채무자 수정" : "채무자 추가"}
						</p>
						{!isSearchMode ? (
							<Button variant="soft" onClick={() => setIsSearchMode(true)}>
								고객 검색
							</Button>
						) : (
							<Button variant="soft" onClick={() => setIsSearchMode(false)}>
								직접 입력
							</Button>
						)}
					</Dialog.Title>
					<Dialog.Close asChild>
						<Button variant="ghost" color="gray">
							<Cross2Icon width={20} height={20} />
						</Button>
					</Dialog.Close>
				</Flex>

				<form onSubmit={handleSubmit}>
					{isSearchMode ? (
						<>
							{/* 유저 검색 UI */}
							<Box mb="3">
								<Text size="2" color="gray" className="mb-1">
									유저 이름 검색
								</Text>
								<Flex className="items-center" gap="2" mb="2">
									<input
										type="text"
										value={userSearchTerm}
										onChange={(e) => setUserSearchTerm(e.target.value)}
										placeholder="예) 홍길동"
										className="
                      flex-1 p-2 border border-gray-6 rounded text-gray-12
                      focus:outline-none focus:border-gray-8
                    "
									/>
									<Button onClick={handleUserSearch} disabled={isSearching}>
										검색
									</Button>
								</Flex>
								<Box style={{ maxHeight: "150px", overflowY: "auto" }}>
									{userSearchResults.map((user, index) => (
										<Flex
											key={index}
											justify="between"
											align="center"
											className="p-2 border-b border-gray-6"
										>
											<Text>{user.name} / {user.phone_number}</Text>
											<Button size="2" onClick={() => handleUserSelect(user)}>
												선택
											</Button>
										</Flex>
									))}
								</Box>
							</Box>
						</>
					) : (
						<>
							{/* 일반 입력 UI */}
							<Box mb="3">
								<Text size="2" color="gray" className="mb-1">
									이름
								</Text>
								<input
									name="name"
									value={formData.name}
									onChange={(e) => handleChangeRaw("name", e.target.value)}
									className="
                    w-full p-2 border border-gray-6 rounded text-gray-12
                    focus:outline-none focus:border-gray-8
                  "
								/>
								{errors.name && (
									<Text color="red" size="2">
										{errors.name}
									</Text>
								)}
							</Box>

							{/* 생년월일 */}
							<Box mb="3">
								<Text size="2" color="gray" className="mb-1">
									생년월일
								</Text>
								<InputMask
									mask="9999-99-99"
									maskChar={null}
									value={formData.birth_date}
									onChange={(e) => handleChangeRaw("birth_date", e.target.value)}
								>
									{(inputProps) => (
										<input
											{...inputProps}
											className="
                        w-full p-2 border border-gray-6 rounded text-gray-12
                        focus:outline-none focus:border-gray-8
                      "
										/>
									)}
								</InputMask>
							</Box>

							{/* 전화번호 */}
							<Box mb="3">
								<Text size="2" color="gray" className="mb-1">
									전화번호
								</Text>
								<InputMask
									mask="999-9999-9999"
									maskChar={null}
									value={formData.phone_number}
									onChange={(e) => handleChangeRaw("phone_number", e.target.value)}
								>
									{(inputProps) => (
										<input
											{...inputProps}
											className="
                        w-full p-2 border border-gray-6 rounded text-gray-12
                        focus:outline-none focus:border-gray-8
                      "
										/>
									)}
								</InputMask>
							</Box>

							{/* 주소 */}
							<Box mb="3">
								<Text size="2" color="gray" className="mb-1">
									주소
								</Text>
								<input
									name="address"
									value={formData.address}
									onChange={(e) => handleChangeRaw("address", e.target.value)}
									className="
                    w-full p-2 border border-gray-6 rounded text-gray-12
                    focus:outline-none focus:border-gray-8
                  "
								/>
							</Box>
						</>
					)}

					{
						!isSearchMode &&
						<Flex justify="end" gap="2">
							<Button variant="soft" color="gray" onClick={() => onOpenChange(false)}>
								닫기
							</Button>
							<Button variant="solid" type="submit" disabled={isSubmitting}>
								{isSubmitting ? "저장 중..." : "저장"}
							</Button>
						</Flex>
					}
				</form>
			</Dialog.Content>
		</Dialog.Root>
	);
}

