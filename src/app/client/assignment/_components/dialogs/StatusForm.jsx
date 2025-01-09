"use client";


import React, { useState } from "react";
import { supabase } from "@/utils/supabase";
import { Button, Text } from "@radix-ui/themes";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";


const StatusForm = ({ open, caseId, currentStatus, onSuccess, onClose }) => {
	const [status, setStatus] = useState(currentStatus || "");

	const handleSubmit = async () => {
		const { error } = await supabase
			.from("cases")
			.update({ status })
			.eq("id", caseId);

		if (!error) {
			onSuccess();
			onClose();
		} else {
			alert("상태 업데이트 중 오류가 발생했습니다.");
		}
	};

	return (
		<Dialog.Root open={open}>
			<Dialog.Overlay className="fixed inset-0 bg-black opacity-75 z-10" />
			<Dialog.Content className="fixed bg-gray-3 left-1/2 top-1/2 max-h-[85vh] min-w-[450px] max-w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-md p-[25px] shadow focus:outline-none data-[state=open]:animate-contentShow z-20 overflow-y-auto">
				<Dialog.Title className="font-bold text-xl">채권 정보</Dialog.Title>
				<Dialog.Close asChild>
					<Button
						variant="ghost"
						color="gray"
						style={{ position: "absolute", top: 24, right: 24 }}
						onClick={onClose}
					>
						<Cross2Icon width={25} height={25} />
					</Button>
				</Dialog.Close>
				<input
					type="text"
					value={status}
					onChange={(e) => setStatus(e.target.value)}
					className="border rounded p-2 w-full border-gray-6 mt-2"
				/>
				<div className="flex justify-end gap-2 mt-4 items-center">
					<Button color="gray" onClick={onClose}>
						취소
					</Button>
					<Button onClick={handleSubmit}>저장</Button>
				</div>
			</Dialog.Content>
		</Dialog.Root>
	);
};

export default StatusForm;

