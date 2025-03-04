"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { useUser } from "@/hooks/useUser";
import { HiOutlineChatBubbleLeftRight, HiOutlineUserCircle } from "react-icons/hi2";

export default function ChatBotWidget() {
	const { user } = useUser();
	
	// 모든 state 선언을 컴포넌트 최상단에 배치
	const [isOpen, setIsOpen] = useState(false);
	const [messages, setMessages] = useState([]);
	const [input, setInput] = useState("");
	const [showInquiryForm, setShowInquiryForm] = useState(false);
	const [showRequestForm, setShowRequestForm] = useState(false);
	const [currentScenario, setCurrentScenario] = useState(null);
	const [botTyping, setBotTyping] = useState(false);
	const [inquiryData, setInquiryData] = useState({
		name: "",
		phone: "",
		email: "",
		content: "",
	});
	const [requestData, setRequestData] = useState({
		name: "",
		phone: "",
		email: "",
		caseDetail: "",
		want: "",
	});

	// 상수 정의
	const typingDelay = 1000;
	const BOT_AVATAR = "";
	const USER_AVATAR = user?.profile_image || "";

	// 초기 시나리오 로드
	useEffect(() => {
		const loadInitialScenario = async () => {
			// 먼저 활성화된 모든 시나리오 조회
			const { data: scenarios, error } = await supabase
				.from('chatbot_scenarios')
				.select(`
					*,
					chatbot_messages (*)
				`)
				.eq('is_active', true);

			if (error) {
				console.error("시나리오 로드 실패:", error);
				return;
			}

			console.log("로드된 시나리오:", scenarios); // 디버깅

			if (scenarios && scenarios.length > 0) {
				const activeScenario = scenarios[0]; // 첫 번째 활성 시나리오 사용
				setCurrentScenario(activeScenario);
				
				// 초기 메시지 찾기
				const initialMessages = activeScenario.chatbot_messages.filter(
					msg => msg.message_type === 'initial'
				);

				console.log("초기 메시지:", initialMessages); // 디버깅

				if (initialMessages.length > 0) {
					setMessages([{ 
						sender: "bot", 
						text: initialMessages[0].response_text 
					}]);
				}

				// 버튼 메시지가 있다면 함께 표시
				const buttonMessages = activeScenario.chatbot_messages.filter(
					msg => msg.message_type === 'button'
				);

				console.log("버튼 메시지:", buttonMessages); // 디버깅

				if (buttonMessages.length > 0) {
					setTimeout(() => {
						setMessages(prev => [...prev, {
							sender: "bot",
							text: buttonMessages[0].response_text,
							buttons: buttonMessages[0].button_options
						}]);
					}, 500);
				}
			}
		};

		loadInitialScenario();
	}, []);

	// 사용자 정보 로드
	useEffect(() => {
		if (user) {
			setInquiryData({
				name: user.name || "",
				phone: user.phone_number || "",
				email: user.email || "",
				content: "",
			});
			setRequestData({
				name: user.name || "",
				phone: user.phone_number || "",
				email: user.email || "",
				caseDetail: "",
				want: "",
			});
		}
	}, [user]);

	// admin인 경우 early return

	const findMatchingResponse = (userInput) => {
		if (!currentScenario) return null;
		
		return currentScenario.chatbot_messages.find(msg => {
			if (msg.message_type !== 'response') return false;
			return msg.trigger_text.some(trigger => 
				userInput.toLowerCase().includes(trigger.toLowerCase())
			);
		});
	};

	const handleButtonClick = async (buttonValue) => {
		// 사용자 선택 표시
		const selectedButton = currentScenario.chatbot_messages
			.find(msg => msg.message_type === 'button')
			?.button_options.find(opt => opt.value === buttonValue);

		if (selectedButton) {
			addMessage("user", selectedButton.text);
		}

		// 해당 버튼에 대한 응답 찾기
		const responseMessage = currentScenario.chatbot_messages.find(msg => 
			msg.message_type === 'response' && 
			msg.trigger_text.includes(buttonValue)
		);

		if (responseMessage) {
			setBotTyping(true);
			setTimeout(() => {
				addMessage("bot", responseMessage.response_text);
				setBotTyping(false);
			}, typingDelay);
		}
	};

	const addMessage = (sender, text) => {
		setMessages(prev => [...prev, { sender, text }]);
	};

	const handleSend = () => {
		if (!input.trim()) return;
		
		addMessage("user", input);
		setBotTyping(true);

		// 응답 메시지 찾기
		const matchingResponse = findMatchingResponse(input);
		
		setTimeout(() => {
			if (matchingResponse) {
				addMessage("bot", matchingResponse.response_text);
				
				// 버튼 메시지가 있는 경우 추가
				const buttonMessage = currentScenario.chatbot_messages.find(
					msg => msg.message_type === 'button'
				);
				if (buttonMessage) {
					addMessage("bot", buttonMessage.response_text);
				}
			} else {
				addMessage("bot", "죄송합니다. 문의하기나 의뢰하기를 통해 상담을 진행해주세요.");
			}
			setBotTyping(false);
		}, typingDelay);

		setInput("");
	};

	const openInquiryForm = () => {
		setShowInquiryForm(true);
		setShowRequestForm(false);
		addMessage("bot", "문의하기 폼을 작성해주세요.");
	};

	const openRequestForm = () => {
		setShowRequestForm(true);
		setShowInquiryForm(false);
		addMessage("bot", "의뢰하기 폼을 작성해주세요.");
	};

	const handleInquirySubmit = async (e) => {
		e.preventDefault();
		addMessage("user", `[문의하기]\n이름: ${inquiryData.name}\n전화번호: ${inquiryData.phone}\n이메일: ${inquiryData.email}\n내용: ${inquiryData.content}`);
		
		const { error } = await supabase.from("inquiries").insert({
			user_id: user?.id || null,
			name: user?.name || inquiryData.name,
			phone: user?.phone_number || inquiryData.phone,
			email: user?.email || inquiryData.email,
			content: inquiryData.content,
		});

		if (error) {
			addMessage("bot", "문의 저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
		} else {
			addMessage("bot", "문의가 접수되었습니다. 감사합니다!");
		}
		setShowInquiryForm(false);
		setInquiryData({ name: "", phone: "", email: "", content: "" });
	};

	const handleRequestSubmit = async (e) => {
		e.preventDefault();
		addMessage("user", `[의뢰하기]\n이름: ${requestData.name}\n전화번호: ${requestData.phone}\n이메일: ${requestData.email}\n사건 경위: ${requestData.caseDetail}\n원하는 바: ${requestData.want}`);
		
		const { error } = await supabase.from("requests").insert({
			user_id: user?.id || null,
			name: user?.name || requestData.name,
			phone: user?.phone_number || requestData.phone,
			email: user?.email || requestData.email,
			case_detail: requestData.caseDetail,
			want: requestData.want,
		});

		if (error) {
			addMessage("bot", "의뢰 저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
		} else {
			addMessage("bot", "의뢰가 접수되었습니다. 감사합니다!");
		}
		setShowRequestForm(false);
		setRequestData({ name: "", phone: "", email: "", caseDetail: "", want: "" });
	};

	const renderMessage = (msg, index) => {
		const isBot = msg.sender === "bot";
		const avatarUrl = isBot ? BOT_AVATAR : USER_AVATAR;

		return (
			<div key={index}>
				<div className={`flex items-start animate-fadeIn ${isBot ? "flex-row" : "flex-row-reverse"}`}>
					{avatarUrl ? (
						<img src={avatarUrl} alt="avatar" className="w-12 h-12 rounded-full object-cover bg-gray-4" />
					) : (
						isBot ? 
							<HiOutlineChatBubbleLeftRight className="w-10 h-10 text-gray-8 border border-gray-4 rounded-full p-2" /> 
							: 
							<HiOutlineUserCircle className="w-12 h-12 text-gray-8 border border-gray-4 rounded-full p-2" />
					)}

					<div className={`mx-2 px-3 py-2 rounded-2xl max-w-[70%] whitespace-pre-wrap animate-fadeIn ${
						isBot ? "bg-gray-3 text-gray-12 rounded-tl-none" : "bg-blue-5 text-blue-12 rounded-tr-none"
					}`}>
						{msg.text}
					</div>
				</div>

				{/* 버튼 옵션이 있는 경우 표시 */}
				{isBot && msg.buttons && (
					<div className="mt-2 space-y-2">
						{msg.buttons.map((button, idx) => (
							<button
								key={idx}
								onClick={() => handleButtonClick(button.value)}
								className="w-full text-left px-3 py-2 bg-gray-4 hover:bg-gray-5 rounded-md"
							>
								{button.text}
							</button>
						))}
					</div>
				)}
			</div>
		);
	};

	return (
		<div className="z-50">
			{/* 우측 하단 아이콘 */}
			<div className="fixed bottom-5 right-5">
				{!isOpen && (
					<button
						className="bg-blue-9 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-10"
						onClick={() => setIsOpen(true)}
					>
						상담하기
					</button>
				)}
			</div>

			{/* 채팅창 */}
			{isOpen && (
				<div className="fixed bottom-5 right-5 w-80 h-[550px] bg-gray-1 shadow-lg border border-gray-6 rounded-md flex flex-col text-gray-12">
					{/* 헤더 */}
					<div className="bg-blue-9 text-white p-3 flex justify-between items-center rounded-t-md">
						<h3 className="font-semibold text-base">LawHub Chat</h3>
						<button
							className="hover:text-gray-1"
							onClick={() => setIsOpen(false)}
						>
							X
						</button>
					</div>

					{/* 메시지 영역 */}
					<div className="flex-1 p-3 overflow-y-auto space-y-3">
						{messages.map((msg, i) => renderMessage(msg, i))}

						{botTyping && (
							<div className="flex flex-row items-center animate-fadeIn">
								<HiOutlineChatBubbleLeftRight className="w-10 h-10 text-gray-8 border border-gray-4 rounded-full p-2" />
								<div className="mx-2 px-3 py-2 rounded-2xl max-w-[70%] bg-gray-3 text-gray-12 rounded-tl-none flex items-center justify-center">
									<div className="flex space-x-1">
										<span className="w-1 h-1 rounded-full bg-gray-9 animate-bounce" />
										<span className="w-1 h-1 rounded-full bg-gray-9 animate-bounce animation-delay-200" />
										<span className="w-1 h-1 rounded-full bg-gray-9 animate-bounce animation-delay-400" />
									</div>
								</div>
							</div>
						)}

						{/* 문의/의뢰 버튼 */}
						{!showInquiryForm && !showRequestForm && (
							<div className="flex space-x-2 mt-3">
								<button
									className="flex-1 bg-blue-9 text-white px-3 py-2 rounded-md hover:bg-blue-10"
									onClick={openInquiryForm}
								>
									문의하기
								</button>
								<button
									className="flex-1 bg-green-9 text-white px-3 py-2 rounded-md hover:bg-green-10"
									onClick={openRequestForm}
								>
									의뢰하기
								</button>
							</div>
						)}

						{/* 문의하기 폼 */}
						{showInquiryForm && (
							<form
								onSubmit={handleInquirySubmit}
								className="mt-3 bg-gray-2 p-2 rounded-md space-y-2 animate-fadeIn"
							>
								{!user && (
									<>
										<input
											className="border border-gray-6 px-2 py-1 rounded w-full"
											placeholder="이름"
											value={inquiryData.name}
											onChange={(e) => setInquiryData({ ...inquiryData, name: e.target.value })}
										/>
										<input
											className="border border-gray-6 px-2 py-1 rounded w-full"
											placeholder="전화번호"
											value={inquiryData.phone}
											onChange={(e) => setInquiryData({ ...inquiryData, phone: e.target.value })}
										/>
										<input
											className="border border-gray-6 px-2 py-1 rounded w-full"
											placeholder="이메일"
											value={inquiryData.email}
											onChange={(e) => setInquiryData({ ...inquiryData, email: e.target.value })}
										/>
									</>
								)}
								<textarea
									className="border border-gray-6 px-2 py-1 rounded w-full"
									placeholder="문의 내용"
									rows={3}
									value={inquiryData.content}
									onChange={(e) => setInquiryData({ ...inquiryData, content: e.target.value })}
								/>
								<div className="flex space-x-2 justify-end">
									<button
										type="button"
										className="bg-gray-7 text-white px-3 py-1 rounded hover:bg-gray-8"
										onClick={() => setShowInquiryForm(false)}
									>
										취소
									</button>
									<button
										type="submit"
										className="bg-blue-9 text-white px-3 py-1 rounded hover:bg-blue-10"
									>
										문의 남기기
									</button>
								</div>
							</form>
						)}

						{/* 의뢰하기 폼 */}
						{showRequestForm && (
							<form
								onSubmit={handleRequestSubmit}
								className="mt-3 bg-gray-2 p-2 rounded-md space-y-2 animate-fadeIn"
							>
								{!user && (
									<>
										<input
											className="border border-gray-6 px-2 py-1 rounded w-full"
											placeholder="이름"
											value={requestData.name}
											onChange={(e) => setRequestData({ ...requestData, name: e.target.value })}
										/>
										<input
											className="border border-gray-6 px-2 py-1 rounded w-full"
											placeholder="전화번호"
											value={requestData.phone}
											onChange={(e) => setRequestData({ ...requestData, phone: e.target.value })}
										/>
										<input
											className="border border-gray-6 px-2 py-1 rounded w-full"
											placeholder="이메일"
											value={requestData.email}
											onChange={(e) => setRequestData({ ...requestData, email: e.target.value })}
										/>
									</>
								)}
								<textarea
									className="border border-gray-6 px-2 py-1 rounded w-full"
									placeholder="사건 경위"
									rows={3}
									value={requestData.caseDetail}
									onChange={(e) => setRequestData({ ...requestData, caseDetail: e.target.value })}
								/>
								<textarea
									className="border border-gray-6 px-2 py-1 rounded w-full"
									placeholder="원하는 바"
									rows={3}
									value={requestData.want}
									onChange={(e) => setRequestData({ ...requestData, want: e.target.value })}
								/>
								<div className="flex space-x-2 justify-end">
									<button
										type="button"
										className="bg-gray-7 text-white px-3 py-1 rounded hover:bg-gray-8"
										onClick={() => setShowRequestForm(false)}
									>
										취소
									</button>
									<button
										type="submit"
										className="bg-green-9 text-white px-3 py-1 rounded hover:bg-green-10"
									>
										의뢰 접수
									</button>
								</div>
							</form>
						)}
					</div>

					{/* 메시지 입력 영역 */}
					<div className="p-2 border-t border-gray-6 flex items-center space-x-2 bg-gray-1">
						<input
							className="border border-gray-6 flex-1 rounded px-2 py-1 focus:outline-none text-gray-12"
							value={input}
							onChange={(e) => setInput(e.target.value)}
							placeholder="메시지를 입력하세요..."
						/>
						<button
							className="bg-blue-9 text-white px-3 py-1 rounded hover:bg-blue-10"
							onClick={handleSend}
						>
							전송
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

