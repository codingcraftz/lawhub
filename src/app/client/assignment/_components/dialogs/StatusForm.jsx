"use client";

import React, { useState } from "react";
import { supabase } from "@/utils/supabase";
import { Button, Text } from "@radix-ui/themes";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";

const StatusForm = ({ open, caseId, currentStatus, onSuccess, onClose }) => {
	const [status, setStatus] = useState(currentStatus || "");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async () => {
		if (isSubmitting) return;
		setIsSubmitting(true);
		try {
			const { error } = await supabase
				.from("cases")
				.update({ status })
				.eq("id", caseId);
			onSuccess();
			onClose();
			if (error) throw error
		} catch (error) {
			console.error("상태 저장 오류:", error);
		}
		finally { setIsSubmitting(false); }
	};

	return (
		<Dialog.Root open={open} onOpenChange={onClose}>
			<Dialog.Overlay className="fixed inset-0 bg-black opacity-50 z-40" />
			<Dialog.Content
				className="
          fixed
          left-1/2 top-1/2 
          max-h-[85vh] w-full max-w-[500px]
          -translate-x-1/2 -translate-y-1/2 
          rounded-md p-6
          bg-gray-2 border border-gray-6
          shadow-md shadow-gray-7
          text-gray-12
          focus:outline-none 
          z-50 
          overflow-y-auto
        "
			>
				<Dialog.Title className="font-bold text-xl mb-3">
					상태 수정
				</Dialog.Title>
				<Dialog.Close asChild>
					<Button
						variant="ghost"
						color="gray"
						style={{ position: "absolute", top: 16, right: 16 }}
						onClick={onClose}
					>
						<Cross2Icon width={20} height={20} />
					</Button>
				</Dialog.Close>

				<Text size="2" color="gray" className="mb-1">
					진행 상태를 입력하세요.
				</Text>
				<input
					type="text"
					value={status}
					onChange={(e) => setStatus(e.target.value)}
					className="
            w-full p-2 mb-4
            border border-gray-6
            rounded text-gray-12
            focus:outline-none focus:border-gray-8
          "
				/>

				<div className="flex justify-end gap-2">
					<Button variant="soft" color="gray" onClick={onClose}>
						닫기
					</Button>
					<Button variant="solid" onClick={handleSubmit} disabled={isSubmitting}>
						{isSubmitting ? "저장 중..." : "저장"}
					</Button>
				</div>
			</Dialog.Content>
		</Dialog.Root>
	);
};

export default StatusForm;

