"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Box, Flex, Text, Button } from "@radix-ui/themes";
import { fetchDeadlines, fetchTimelineItems } from "@/utils/api";
import { useUser } from "@/hooks/useUser";
import TimelineItem from "@/components/Timeline/TimelineItem";
import { Cross2Icon } from "@radix-ui/react-icons";
import TimelineForm from "./TimelineForm";
import DeadlineForm from "./DeadlineForm";
import DeadlineList from "./DeadlineList";

const Timeline = ({ caseId, caseStatus, description, open, onOpenChange }) => {
	const [timelineItems, setTimelineItems] = useState([]);
	const [openTimelineForm, setOpenTimelineForm] = useState(false);
	const [openDeadlineForm, setOpenDeadlineForm] = useState(false);
	const [deadlines, setDeadlines] = useState([]);
	const [caseTrigger, setCaseTrigger] = useState(0);
	const { user } = useUser();
	const isAdmin = user?.role === "admin" || user?.role === "staff";

	useEffect(() => {
		fetchData();
	}, [caseId, caseTrigger]);

	const fetchData = async () => {
		const deadlinesData = await fetchDeadlines(caseId);
		setDeadlines(deadlinesData);
		const timelineData = await fetchTimelineItems(caseId);
		setTimelineItems(timelineData);
	};

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Overlay className="fixed inset-0 bg-black opacity-75 z-30" />
			<Dialog.Content className="fixed bg-gray-3 left-1/2 top-1/2 max-h-[85vh] min-w-[650px] max-w-[1024px] -translate-x-1/2 -translate-y-1/2 rounded-md p-[25px] shadow focus:outline-none data-[state=open]:animate-contentShow z-40 overflow-y-auto">
				<Dialog.Title className="font-bold text-xl">소송 상세보기</Dialog.Title>
				<Dialog.Close asChild>
					<Button
						variant="ghost"
						color="gray"
						style={{ position: "absolute", top: 24, right: 24 }}
					>
						<Cross2Icon width={25} height={25} />
					</Button>
				</Dialog.Close>
				<Box>
					<Flex className="justify-between">
						<Text>{description}</Text>
						{isAdmin && <Button onClick={() => setOpenDeadlineForm(true)}>기일 추가</Button>}
					</Flex>
					<DeadlineList deadlines={deadlines} onSuccess={() => setCaseTrigger(prev => prev + 1)} />
					<Flex justify="between" align="center" mt="4">
						<Text size="5" weight="bold">
							사건 타임라인
						</Text>
						{isAdmin && <Button onClick={() => setOpenTimelineForm(true)}>추가</Button>}
					</Flex>
					<Flex direction="column" gap="3" mt="4">
						{timelineItems.map((item) => (
							<TimelineItem
								key={item.id}
								item={item}
								onSuccess={() => setCaseTrigger((prev) => prev + 1)}
								caseStatus={caseStatus}
								isAdmin={isAdmin}
							/>

						))}
					</Flex>
				</Box>
				<TimelineForm caseId={caseId} open={openTimelineForm} onOpenChange={setOpenTimelineForm} onSuccess={() => setCaseTrigger(prev => prev + 1)} />
				<DeadlineForm caseId={caseId} open={openDeadlineForm} onOpenChange={setOpenDeadlineForm} onSuccess={() => setCaseTrigger(prev => prev + 1)} />
			</Dialog.Content>

		</Dialog.Root>
	);
};

export default Timeline;
