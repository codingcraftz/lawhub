"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Text, Avatar, Button } from "@radix-ui/themes";
import { useUser } from "@/hooks/useUser";
import InputMask from "react-input-mask";

const MyPage = () => {
	const router = useRouter();
	const { user, setUser } = useUser();
	const [isEditing, setIsEditing] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		nickname: "",
		phone_number: "",
		birth_date: "",
	});
	const [isLoading, setIsLoading] = useState(true);

	// 초기 데이터 로드
	useEffect(() => {
		if (user) {
			setFormData({
				name: user.name || "",
				nickname: user.nickname || "",
				phone_number: user.phone_number?.replace("+82 ", "0") || "",
				birth_date: user.birth_date || "",
			});
			setIsLoading(false);
		}
	}, [user]);

	// 로그아웃 핸들러
	const handleLogout = async () => {
		await supabase.auth.signOut();
		setUser(null);
		router.push("/");
	};

	// 입력값 변경 핸들러
	const handleInputChange = (field, value) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	// 정보 저장 핸들러
	const handleSaveChanges = async () => {
		// 전화번호에 +82 추가
		const formattedPhoneNumber =
			formData.phone_number.startsWith("0")
				? `+82 ${formData.phone_number.slice(1)}`
				: formData.phone_number;

		const { error } = await supabase
			.from("users")
			.update({
				name: formData.name,
				phone_number: formattedPhoneNumber,
				birth_date: formData.birth_date,
			})
			.eq("id", user.id);

		if (error) {
			console.error("Error updating user:", error.message);
			alert("정보 수정 중 오류가 발생했습니다.");
		} else {
			alert("정보가 성공적으로 수정되었습니다.");
			setUser((prev) => ({
				...prev,
				...formData,
				phone_number: formattedPhoneNumber,
			}));
			setIsEditing(false);
		}
	};

	if (isLoading) return <p>로딩 중...</p>;

	return (
		<Box className="my-auto flex flex-col w-full px-6 max-w-sm">
			<Flex className="flex-col gap-2 items-center">
				<Avatar
					src={user?.profile_image || ""}
					fallback={user?.name ? user.name[0] : "U"}
					size="6"
					radius="full"
				/>
				{/* 정보 카드 */}
				<Box width="100%" border="1px solid var(--gray-5)" p="4" rounded="md">
					<Flex direction="column" gap="3">
						{/* 이메일 */}
						<Flex justify="between" align="center">
							<Text weight="bold">이메일:</Text>
							<Text>{user.email || "이메일 정보 없음"}</Text>
						</Flex>

						{/* 이름 */}
						<Flex justify="between" align="center">
							<Text weight="bold">이름:</Text>
							{isEditing ? (
								<input
									name="name"
									value={formData.name}
									onChange={(e) =>
										handleInputChange("name", e.target.value)
									}
									placeholder="이름을 입력하세요"
									className="border border-gray-300 rounded px-2 py-1"
								/>
							) : (
								<Text>{formData.name || "이름 정보 없음"}</Text>
							)}
						</Flex>

						{/* 전화번호 */}
						<Flex justify="between" align="center">
							<Text weight="bold">전화번호:</Text>
							{isEditing ? (
								<InputMask
									mask="010-9999-9999"
									value={formData.phone_number}
									onChange={(e) =>
										handleInputChange("phone_number", e.target.value)
									}
								>
									{(inputProps) => (
										<input
											{...inputProps}
											name="phone_number"
											placeholder="010-1234-5678"
											className="border border-gray-300 rounded px-2 py-1"
										/>
									)}
								</InputMask>
							) : (
								<Text>{formData.phone_number || "전화번호 정보 없음"}</Text>
							)}
						</Flex>

						{/* 생년월일 */}
						<Flex justify="between" align="center">
							<Text weight="bold">생년월일:</Text>
							{isEditing ? (
								<InputMask
									mask="9999-99-99"
									value={formData.birth_date}
									onChange={(e) =>
										handleInputChange("birth_date", e.target.value)
									}
								>
									{(inputProps) => (
										<input
											{...inputProps}
											name="birth_date"
											placeholder="예) 1990-12-25"
											className="border border-gray-300 rounded px-2 py-1"
										/>
									)}
								</InputMask>
							) : (
								<Text>{formData.birth_date || "생년월일 정보 없음"}</Text>
							)}
						</Flex>

						{/* 권한 */}
						<Flex justify="between" align="center">
							<Text weight="bold">권한:</Text>
							<Text>
								{user.role === "admin"
									? "관리자"
									: user.role === "staff"
										? "직원"
										: "고객"}
							</Text>
						</Flex>

						{/* 가입일 */}
						<Flex justify="between" align="center">
							<Text weight="bold">가입일:</Text>
							<Text>
								{new Date(user.created_at).toLocaleDateString("ko-KR") ||
									"가입일 정보 없음"}
							</Text>
						</Flex>
					</Flex>
				</Box>

				{/* 버튼 */}
				<Flex gap="3" justify="center">
					{isEditing ? (
						<>
							<Button
								variant="solid"
								color="green"
								size="large"
								onClick={handleSaveChanges}
							>
								저장
							</Button>
							<Button
								variant="soft"
								color="gray"
								size="large"
								onClick={() => setIsEditing(false)}
							>
								취소
							</Button>
						</>
					) : (
						<Button
							variant="solid"
							color="blue"
							size="large"
							onClick={() => setIsEditing(true)}
						>
							정보 수정
						</Button>
					)}
					<Button
						variant="solid"
						color="red"
						size="large"
						onClick={handleLogout}
					>
						로그아웃
					</Button>
				</Flex>
			</Flex>
			{/* 경고 문구 */}
			<Text
				className="text-center text-red-9 text-sm my-2"
				style={{
					padding: "8px",
					borderRadius: "8px",
				}}
			>
				정확한 정보를 입력해주세요.
				<br />
				잘못된 정보는 서비스 이용에 불편을 초래할 수 있습니다.
			</Text>


		</Box>
	);
};

export default MyPage;

