"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/utils/supabase"; // 이미 설정된 supabase client
import { useUser } from "@/hooks/useUser";
import DatePicker from "react-datepicker";
import { ko } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import { Table, Button, Box } from "@radix-ui/themes";
import { PlusIcon, Cross2Icon } from "@radix-ui/react-icons";

// DatePicker 스타일 오버라이드를 위한 스타일 추가
const datePickerStyles = `
  .react-datepicker-popper {
    z-index: 9999 !important;
  }
  .react-datepicker-wrapper {
    width: 100%;
  }
  .react-datepicker__input-container {
    width: 100%;
  }
`;

// 질문 유형 정의
const QUESTION_TYPES = {
	TEXT: "text",
	DATE: "date",
	DATE_RANGE: "date_range",
	NUMBER: "number",
	TRANSACTIONS_TABLE: "TRANSACTIONS_TABLE",
};

// 질문 시나리오 정의
const scenarios = {
	// --- 대여금 ---
	loan: [
		{
			id: "transactions",
			type: QUESTION_TYPES.TRANSACTIONS_TABLE,
			question:
				"대여금 거래 내역을 입력해 주세요.\n각 거래별로 거래일, 금액(부가가치세 제외), 변제약정일을 입력해 주세요.",
		},
		{
			id: "confirm",
			type: QUESTION_TYPES.TEXT,
			question: "입력하신 내용이 맞나요? (예/아니오)",
		},
	],
	// --- 물품대금 ---
	goods: [
		{
			id: "itemName",
			type: QUESTION_TYPES.TEXT,
			question:
				"어떤 물품을 거래하셨나요?\n(예: 건축자재, 가구, 전자제품 등 구체적으로 적어주세요)",
		},
		{
			id: "transactions",
			type: QUESTION_TYPES.TRANSACTIONS_TABLE,
			question:
				"물품 거래 내역을 입력해 주세요.\n각 거래별로 거래일, 금액(부가가치세 제외), 지급약정일을 입력해 주세요.",
		},
		{
			id: "confirm",
			type: QUESTION_TYPES.TEXT,
			question: "입력하신 내용이 맞나요? (예/아니오)",
		},
	],
	// --- 공사대금 ---
	construction: [
		{
			id: "location",
			type: QUESTION_TYPES.TEXT,
			question:
				"공사 현장은 어디인가요?\n(시군구까지만 입력해 주세요. 예: 서울시 강남구)",
		},
		{
			id: "transactions",
			type: QUESTION_TYPES.TRANSACTIONS_TABLE,
			question:
				"공사 기간과 대금을 입력해 주세요.\n각 공사별로 시작일, 종료일, 금액(부가가치세 제외), 지급약정일을 입력해 주세요.",
		},
		{
			id: "confirm",
			type: QUESTION_TYPES.TEXT,
			question: "입력하신 내용이 맞나요? (예/아니오)",
		},
	],
};

// DatePicker 커스텀 입력 컴포넌트
const CustomDateInput = React.forwardRef(
	({ value, onClick, placeholder }, ref) => (
		<button
			type="button"
			className="w-full text-left px-4 py-2 bg-gray-3 text-gray-12 placeholder-gray-11 rounded-lg border border-gray-6 focus:outline-none focus:ring-2 focus:ring-blue-8"
			onClick={onClick}
			ref={ref}
		>
			{value || placeholder}
		</button>
	),
);
CustomDateInput.displayName = "CustomDateInput";

// 거래 내역 입력 Form + 테이블
function TransactionsTable({ transactions, setTransactions, type }) {
	// 입력 Form 상태
	const [transactionDate, setTransactionDate] = useState(null);
	const [startDate, setStartDate] = useState(null);
	const [endDate, setEndDate] = useState(null);
	const [amount, setAmount] = useState("");
	const [dueDate, setDueDate] = useState(null);

	// 추가하기
	const handleAdd = () => {
		// 유효성 검사
		if (type === "construction") {
			if (!amount) {
				alert("금액(부가가치세 제외)을 입력해주세요");
				return;
			}
		} else {
			if (!amount) {
				alert("금액(부가가치세 제외)을 입력해주세요.");
				return;
			}
		}

		setTransactions((prev) => [
			...prev,
			{
				transactionDate: transactionDate
					? transactionDate.toISOString().split("T")[0]
					: null,
				startDate: startDate ? startDate.toISOString().split("T")[0] : null,
				endDate: endDate ? endDate.toISOString().split("T")[0] : null,
				amount: parseFloat(amount),
				dueDate: dueDate ? dueDate.toISOString().split("T")[0] : null,
			},
		]);

		// 입력 필드 초기화
		setTransactionDate(null);
		setStartDate(null);
		setEndDate(null);
		setAmount("");
		setDueDate(null);
	};

	// 삭제하기
	const handleDelete = (index) => {
		setTransactions(transactions.filter((_, i) => i !== index));
	};

	// 열 개수
	const columnCount = type === "construction" ? 5 : 4;
	// 테이블 전체를 'table-fixed'로 설정해 열너비가 균등하게 유지되도록
	// (Tailwind 예시: w-1/5 * columnCount)
	return (
		<Box className="space-y-6">
			{/* 입력 Form */}
			<div className="p-3 border border-gray-6 rounded-lg bg-gray-3 space-y-4">
				<div className="text-sm font-semibold">거래 내역 추가</div>
				{type === "construction" ? (
					// 공사대금 입력 폼 (2x2 그리드)
					<div className="grid grid-cols-1 gap-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block mb-1 text-sm text-gray-12">
									시작일
								</label>
								<DatePicker
									selected={startDate}
									onChange={(date) => setStartDate(date)}
									dateFormat="yyyy-MM-dd"
									locale={ko}
									placeholderText="시작일 선택"
									customInput={<CustomDateInput />}
								/>
							</div>
							<div>
								<label className="block mb-1 text-sm text-gray-12">
									종료일
								</label>
								<DatePicker
									selected={endDate}
									onChange={(date) => setEndDate(date)}
									dateFormat="yyyy-MM-dd"
									locale={ko}
									placeholderText="종료일 선택"
									customInput={<CustomDateInput />}
								/>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block mb-1 text-sm text-gray-12">
									금액(원)
								</label>
								<input
									type="number"
									value={amount}
									onChange={(e) => setAmount(e.target.value)}
									className="w-full px-4 py-2 bg-gray-2 text-gray-12 rounded-lg border border-gray-6"
									placeholder="금액 입력"
								/>
							</div>
							<div>
								<label className="block mb-1 text-sm text-gray-12">
									지급약정일
								</label>
								<DatePicker
									selected={dueDate}
									onChange={(date) => setDueDate(date)}
									dateFormat="yyyy-MM-dd"
									locale={ko}
									placeholderText="지급약정일 선택"
									customInput={<CustomDateInput />}
								/>
							</div>
						</div>
					</div>
				) : (
					// 일반 거래 입력 폼 (1:1:1)
					<div className="grid grid-cols-3 gap-4">
						<div>
							<label className="block mb-1 text-sm text-gray-12">거래일</label>
							<DatePicker
								selected={transactionDate}
								onChange={(date) => setTransactionDate(date)}
								dateFormat="yyyy-MM-dd"
								locale={ko}
								placeholderText="거래일 선택"
								customInput={<CustomDateInput />}
							/>
						</div>
						<div>
							<label className="block mb-1 text-sm text-gray-12">
								금액(원)
							</label>
							<input
								type="number"
								value={amount}
								onChange={(e) => setAmount(e.target.value)}
								className="w-full px-4 py-2 bg-gray-2 text-gray-12 rounded-lg border border-gray-6"
								placeholder="금액 입력"
							/>
						</div>
						<div>
							<label className="block mb-1 text-sm text-gray-12">
								지급약정일
							</label>
							<DatePicker
								selected={dueDate}
								onChange={(date) => setDueDate(date)}
								dateFormat="yyyy-MM-dd"
								locale={ko}
								placeholderText="지급약정일 선택"
								customInput={<CustomDateInput />}
							/>
						</div>
					</div>
				)}
				<Button
					variant="soft"
					color="blue"
					className="w-full"
					onClick={handleAdd}
				>
					<PlusIcon className="mr-1" />
					추가하기
				</Button>
			</div>

			{/* 표시용 테이블 */}
			<Table.Root className="table-fixed w-full">
				<Table.Header>
					<Table.Row>
						{type === "construction" ? (
							<>
								<Table.ColumnHeaderCell className="w-1/4">
									시작일
								</Table.ColumnHeaderCell>
								<Table.ColumnHeaderCell className="w-1/4">
									종료일
								</Table.ColumnHeaderCell>
								<Table.ColumnHeaderCell className="w-1/4">
									금액
								</Table.ColumnHeaderCell>
								<Table.ColumnHeaderCell className="w-1/4">
									지급약정일
								</Table.ColumnHeaderCell>
							</>
						) : (
							<>
								<Table.ColumnHeaderCell className="w-1/3">
									거래일
								</Table.ColumnHeaderCell>
								<Table.ColumnHeaderCell className="w-1/3">
									금액
								</Table.ColumnHeaderCell>
								<Table.ColumnHeaderCell className="w-1/3">
									지급약정일
								</Table.ColumnHeaderCell>
							</>
						)}
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{transactions.map((transaction, index) => (
						<Table.Row key={index}>
							{type === "construction" ? (
								<>
									<Table.Cell>{transaction.startDate}</Table.Cell>
									<Table.Cell>{transaction.endDate}</Table.Cell>
									<Table.Cell>
										{transaction.amount.toLocaleString()}원
									</Table.Cell>
									<Table.Cell>{transaction.dueDate}</Table.Cell>
								</>
							) : (
								<>
									<Table.Cell>{transaction.transactionDate}</Table.Cell>
									<Table.Cell>
										{transaction.amount.toLocaleString()}원
									</Table.Cell>
									<Table.Cell>{transaction.dueDate}</Table.Cell>
								</>
							)}
							<Table.Cell>
								<Button
									variant="ghost"
									color="red"
									onClick={() => handleDelete(index)}
								>
									<Cross2Icon />
								</Button>
							</Table.Cell>
						</Table.Row>
					))}
				</Table.Body>
			</Table.Root>
		</Box>
	);
}

// 거래 내역 요약
function TransactionsSummary({ transactions, type }) {
	const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

	if (!transactions.length) {
		return (
			<div className="space-y-2 text-sm">
				<div className="font-semibold">▣ 입력하신 거래 내역이 없습니다.</div>
			</div>
		);
	}

	return (
		<div className="space-y-2 text-sm">
			<div className="font-semibold mb-2">▣ 입력하신 내용</div>
			{transactions.map((t, i) => (
				<div key={i} className="pl-2">
					{type === "construction" ? (
						<>
							• 기간: {t.startDate} ~ {t.endDate}
							<br />• 금액: {t.amount.toLocaleString()}원
							<br />• 지급약정일: {t.dueDate}
						</>
					) : (
						<>
							• 거래일: {t.transactionDate}
							<br />• 금액: {t.amount.toLocaleString()}원
							<br />• 지급약정일: {t.dueDate}
						</>
					)}
					<div className="border-b border-gray-6 my-2"></div>
				</div>
			))}
			<div className="font-semibold">
				총 금액: {totalAmount.toLocaleString()}원
			</div>
		</div>
	);
}

export default function Chatbot() {
	const { user } = useUser();

	// 챗봇 메세지
	const [messages, setMessages] = useState([
		{
			sender: "bot",
			text: "안녕하세요. LawHub 법률상담 챗봇입니다.\n먼저 의뢰하실 사건의 종류를 선택해 주세요.",
		},
	]);

	// 현재 시나리오(loan/goods/construction 등)
	const [caseType, setCaseType] = useState(null);

	// 현재 질문 인덱스
	const [questionIndex, setQuestionIndex] = useState(0);

	// 사용자 임시 답변 저장
	const [answers, setAnswers] = useState({});

	// 사용자 입력(Text)
	const [userInput, setUserInput] = useState("");

	// 거래 내역
	const [transactions, setTransactions] = useState([]);

	// 채팅 스크롤 ref
	const chatContainerRef = useRef(null);

	// 스크롤 하단 이동
	useEffect(() => {
		if (chatContainerRef.current) {
			chatContainerRef.current.scrollTop =
				chatContainerRef.current.scrollHeight;
		}
	}, [messages]);

	// 사건유형 선택 시
	useEffect(() => {
		if (caseType) {
			const firstQuestion = scenarios[caseType][0].question;
			setMessages((prev) => [...prev, { sender: "bot", text: firstQuestion }]);
			setQuestionIndex(0);
			setAnswers({});
			setTransactions([]);
		}
	}, [caseType]);

	// 현재 질문 타입
	const getCurrentQuestionType = () => {
		if (!caseType || !scenarios[caseType][questionIndex]) return null;
		return scenarios[caseType][questionIndex].type;
	};

	// 뒤로가기(이전 단계) 버튼
	const handleGoBack = () => {
		// 시나리오 첫 질문에서 뒤로가기 -> 사건 유형 선택으로 돌아감
		if (questionIndex <= 0) {
			// scenario 리셋
			setCaseType(null);
			// 채팅도 초기화
			setMessages([
				{
					sender: "bot",
					text: "안녕하세요. LawHub 법률상담 챗봇입니다.\n먼저 의뢰하실 사건의 종류를 선택해 주세요.",
				},
			]);
			return;
		}
		// 그렇지 않으면, 최근 (유저+봇) 메시지 2개 제거
		setQuestionIndex(questionIndex - 1);
		setMessages((prev) => {
			// 혹시 메시지가 너무 적으면 방어로직
			if (prev.length <= 1) return prev;
			// 마지막 2개(유저 / 봇) 제거
			return prev.slice(0, -2);
		});
	};

	// 사용자 입력 처리
	const handleUserInput = async (inputText) => {
		// TRANSACTIONS_TABLE 단계
		if (getCurrentQuestionType() === QUESTION_TYPES.TRANSACTIONS_TABLE) {
			if (transactions.length === 0) {
				alert("최소 하나의 거래 내역을 입력해주세요.");
				return;
			}
			// 거래 내역 저장
			setAnswers((prev) => ({
				...prev,
				transactions,
			}));
			// 다음 질문(확인단계) + 요약 메시지 표시
			const nextQuestion = scenarios[caseType][questionIndex + 1].question;
			setMessages((prev) => [
				...prev,
				{
					sender: "bot",
					text: "거래 내역이 입력되었습니다.",
					component: (
						<TransactionsSummary transactions={transactions} type={caseType} />
					),
				},
				{
					sender: "bot",
					text: nextQuestion,
					showConfirmButtons: true,
				},
			]);
			setQuestionIndex(questionIndex + 1);
			return;
		}

		// 날짜 선택, 날짜 범위 선택 → 자동으로 inputText가 들어온다고 가정
		// 예/아니오 확인
		if (inputText === "예") {
			handleSubmitAnswers();
			return;
		}
		if (inputText === "아니오") {
			// 이전 스텝으로
			handleGoBack();
			return;
		}

		// 일반(텍스트,숫자) 응답
		setMessages((prev) => [...prev, { sender: "user", text: inputText }]);

		const currentScenario = scenarios[caseType];
		const currentQuestionId = currentScenario[questionIndex].id;

		setAnswers((prev) => ({
			...prev,
			[currentQuestionId]: inputText,
		}));

		const nextIndex = questionIndex + 1;
		if (nextIndex < currentScenario.length) {
			// 다음 질문
			setTimeout(() => {
				setMessages((prev) => [
					...prev,
					{ sender: "bot", text: currentScenario[nextIndex].question },
				]);
			}, 500);
			setQuestionIndex(nextIndex);
		} else {
			// 시나리오 종료 → 확인단계가 없으면 여기서 저장할 수도 있음
			setTimeout(() => {
				handleSubmitAnswers();
			}, 500);
		}
	};

	// 최종적으로 DB에 저장
	const handleSubmitAnswers = async () => {
		if (!user) {
			setMessages((prev) => [
				...prev,
				{
					sender: "bot",
					text: "로그인이 필요한 서비스입니다. 로그인 후 다시 시도해주세요.",
				},
			]);
			return;
		}

		const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

		const payload = {
			case_type:
				caseType === "loan"
					? "대여금"
					: caseType === "goods"
						? "물품대금"
						: "공사대금",
			extra_info:
				caseType === "goods"
					? answers.itemName
					: caseType === "construction"
						? answers.location
						: null,
			total_amount: totalAmount,
			user_id: user.id,
		};

		try {
			const { data: caseData, error: caseError } = await supabase
				.from("chatbot_cases")
				.insert([payload])
				.select()
				.single();

			if (caseError) throw caseError;

			// 거래 내역 저장
			const transactionsPayload = transactions.map((t) => ({
				case_id: caseData.id,
				transaction_date: t.transactionDate || null,
				start_date: t.startDate || null,
				end_date: t.endDate || null,
				amount: t.amount,
				due_date: t.dueDate,
			}));

			const { error: transactionsError } = await supabase
				.from("case_transactions")
				.insert(transactionsPayload);

			if (transactionsError) throw transactionsError;

			setMessages((prev) => [
				...prev,
				{
					sender: "bot",
					text: "답변 감사합니다. 접수가 완료되었습니다.",
				},
			]);
		} catch (err) {
			console.error("Error:", err);
			setMessages((prev) => [
				...prev,
				{
					sender: "bot",
					text: "데이터 저장 중 오류가 발생했습니다. 다시 시도해주세요.",
				},
			]);
		}
	};

	// 전송 버튼 클릭
	const handleSendMessage = () => {
		if (!userInput.trim()) return;
		handleUserInput(userInput.trim());
		setUserInput("");
	};

	// 날짜 범위 선택
	const [dateRange, setDateRange] = useState([null, null]);
	const [startDateRange, endDateRange] = dateRange;
	const handleDateRangeSelect = (update) => {
		setDateRange(update);
		if (update[0] && update[1]) {
			const formattedRange = update
				.map((d) => d.toISOString().split("T")[0])
				.join("~");
			handleUserInput(formattedRange);
		}
	};
	// 단일 날짜 선택
	const handleDateSelect = (date) => {
		const formattedDate = date.toISOString().split("T")[0];
		handleUserInput(formattedDate);
	};

	// 현재 질문 타입 별 입력 UI
	const renderInput = () => {
		const questionType = getCurrentQuestionType();
		if (!questionType) return null;

		// TRANSACTIONS_TABLE
		if (questionType === QUESTION_TYPES.TRANSACTIONS_TABLE) {
			return (
				<div className="w-full p-4">
					<TransactionsTable
						transactions={transactions}
						setTransactions={setTransactions}
						type={caseType}
					/>
					{/* "입력 완료" 버튼 → handleUserInput("transactions_completed") */}
					<Button
						className="mt-4 w-full"
						variant="soft"
						color="blue"
						onClick={() => handleUserInput("transactions_completed")}
					>
						입력 완료
					</Button>
				</div>
			);
		}

		// DATE, DATE_RANGE인 경우 → 전송 버튼 없이, 달력 선택 시 자동으로 처리
		if (questionType === QUESTION_TYPES.DATE) {
			return (
				<div className="p-4">
					<DatePicker
						selected={null}
						onChange={handleDateSelect}
						dateFormat="yyyy-MM-dd"
						locale={ko}
						placeholderText="날짜를 선택하세요"
						customInput={<CustomDateInput />}
					/>
				</div>
			);
		}
		if (questionType === QUESTION_TYPES.DATE_RANGE) {
			return (
				<div className="p-4">
					<DatePicker
						selectsRange
						startDate={startDateRange}
						endDate={endDateRange}
						onChange={handleDateRangeSelect}
						dateFormat="yyyy-MM-dd"
						locale={ko}
						placeholderText="기간을 선택하세요"
						customInput={<CustomDateInput />}
					/>
				</div>
			);
		}

		// NUMBER인 경우
		if (questionType === QUESTION_TYPES.NUMBER) {
			return (
				<div className="p-4 flex gap-2">
					<input
						type="number"
						className="flex-1 px-4 py-2 bg-gray-3 text-gray-12 placeholder-gray-11 rounded-lg border border-gray-6 focus:outline-none focus:ring-2 focus:ring-blue-8"
						placeholder="숫자를 입력해 주세요..."
						value={userInput}
						onChange={(e) => setUserInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleSendMessage();
						}}
					/>
					{/* 전송 버튼 */}
					<button
						className="px-4 py-2 bg-blue-9 hover:bg-blue-10 text-gray-1 rounded-lg transition-colors"
						onClick={handleSendMessage}
					>
						전송
					</button>
				</div>
			);
		}

		// TEXT 등 기본 입력
		return (
			<div className="p-4 flex gap-2">
				<input
					type="text"
					className="flex-1 px-4 py-2 bg-gray-3 text-gray-12 placeholder-gray-11 rounded-lg border border-gray-6 focus:outline-none focus:ring-2 focus:ring-blue-8"
					placeholder="답변을 입력해 주세요..."
					value={userInput}
					onChange={(e) => setUserInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") handleSendMessage();
					}}
				/>
				{/* 전송 버튼 */}
				<button
					className="px-4 py-2 bg-blue-9 hover:bg-blue-10 text-gray-1 rounded-lg transition-colors"
					onClick={handleSendMessage}
				>
					전송
				</button>
			</div>
		);
	};

	return (
		<>
			<style>{datePickerStyles}</style>
			<div className="w-full max-w-2xl mx-auto h-[calc(100vh-6rem)] flex flex-col bg-gray-2 border border-gray-6 rounded-lg overflow-hidden">
				{/* 헤더 */}
				<div className="p-4 bg-gray-3 border-b border-gray-6">
					<h1 className="text-lg font-semibold text-gray-12">법률상담 챗봇</h1>
					<p className="text-sm text-gray-11">
						상황에 맞는 답변을 입력해 주시면 법률 상담을 도와드립니다.
					</p>
				</div>

				{/* 채팅 메세지 목록 */}
				<div
					ref={chatContainerRef}
					className="flex-1 overflow-y-auto p-4 space-y-4"
				>
					<AnimatePresence>
						{messages.map((msg, index) => (
							<motion.div
								key={index}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.3 }}
								className={`flex ${msg.sender === "bot" ? "justify-start" : "justify-end"
									}`}
							>
								<div
									className={`max-w-[80%] p-3 rounded-lg ${msg.sender === "bot"
										? "bg-gray-3 text-gray-12 rounded-tl-none"
										: "bg-blue-9 text-gray-1 rounded-tr-none"
										}`}
								>
									<pre className="whitespace-pre-wrap font-sans">
										{msg.text}
									</pre>
									{msg.component}
									{msg.showConfirmButtons && (
										<div className="flex gap-2 mt-3">
											<Button
												onClick={() => handleUserInput("예")}
												className="flex-1"
												variant="soft"
												color="green"
											>
												예
											</Button>
											<Button
												onClick={() => handleUserInput("아니오")}
												className="flex-1"
												variant="soft"
												color="red"
											>
												아니오
											</Button>
										</div>
									)}
								</div>
							</motion.div>
						))}
					</AnimatePresence>
				</div>

				{/* 사건 유형 선택 (처음 화면) */}
				{!caseType && (
					<div className="p-4 bg-gray-2 border-t border-gray-6">
						<div className="grid grid-cols-3 gap-3">
							<button
								className="p-4 bg-gray-3 hover:bg-gray-4 active:bg-gray-5 text-gray-12 rounded-lg border border-gray-6 transition-colors"
								onClick={() => setCaseType("loan")}
							>
								<span className="block text-lg mb-1">💰</span>
								대여금
							</button>
							<button
								className="p-4 bg-gray-3 hover:bg-gray-4 active:bg-gray-5 text-gray-12 rounded-lg border border-gray-6 transition-colors"
								onClick={() => setCaseType("goods")}
							>
								<span className="block text-lg mb-1">📦</span>
								물품대금
							</button>
							<button
								className="p-4 bg-gray-3 hover:bg-gray-4 active:bg-gray-5 text-gray-12 rounded-lg border border-gray-6 transition-colors"
								onClick={() => setCaseType("construction")}
							>
								<span className="block text-lg mb-1">🏗️</span>
								공사대금
							</button>
						</div>
					</div>
				)}

				{/* 입력 영역 + 뒤로가기 버튼 (시나리오 진행중) */}
				{caseType && (
					<div className="bg-gray-2 border-t border-gray-6">
						{/* 질문 타입별 입력 */}
						{renderInput()}

						{/* 뒤로가기 버튼(하단) */}
						<div className="px-4 pb-4">
							<Button
								variant="soft"
								color="gray"
								onClick={handleGoBack}
								className="w-full"
							>
								이전으로 돌아가기
							</Button>
						</div>
					</div>
				)}
			</div>
		</>
	);
}
