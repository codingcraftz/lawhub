"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { Box, Text, Flex, Button } from "@radix-ui/themes";
import CaseTimeline from "@/app/case-management/_components/CaseTimeline";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import useAuthRedirect from "@/hooks/useAuthRedirect";
import CaseDetails from "@/app/case-management/_components/CaseDetails";
import BondDetails from "@/app/case-management/_components/BondDetails";
import { useUser } from "@/hooks/useUser";

const CasePage = () => {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isBondDetailsOpen, setIsBondDetailsOpen] = useState(false);
  const { user } = useUser();
  const isAdmin = user?.role === "client" || user?.role === "admin";
  const router = useRouter();

  useAuthRedirect(["staff", "admin"], "/");

  const fetchCase = async () => {
    const { data, error } = await supabase
      .from("cases")
      .select(
        `
          *,
          case_categories (id, name),
          case_clients (client:users (id, name)),
          case_staff (staff:users (id, name)),
          case_opponents (opponent:opponents (id, name))
        `,
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching case:", error);
    } else {
      setCaseData(data);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCase();
    }
  }, [id]);

  if (!caseData) {
    return <Text>Loading...</Text>;
  }

  return (
    <Box className="flex justify-center p-8 max-w-screen-lg">
      <Flex className="flex-col gap-2 items-cneter flex-1">
        <Flex className="items-center gap-2">
          <ArrowLeftIcon
            className="w-8 h-8 cursor-pointer"
            onClick={() => router.back()}
          />
          <Text className="font-bold text-2xl">
            {`${caseData.court_name || ""} ${caseData.case_year || ""} ${caseData.case_type || ""} ${caseData.case_number || ""} ${caseData.case_subject || ""}`}
          </Text>
          <Flex className="max-w-60" gap="0.5rem">
            <Button
              className="flex-1"
              variant="soft"
              color="blue"
              size="1"
              onClick={(e) => {
                e.stopPropagation();
                setIsDetailsModalOpen(true);
              }}
            >
              사건 정보
            </Button>
            <Button
              className="flex-1"
              variant="soft"
              color="blue"
              size="1"
              onClick={(e) => {
                e.stopPropagation();
                setIsBondDetailsOpen(true);
              }}
            >
              채권 정보
            </Button>
          </Flex>
        </Flex>
        <CaseTimeline
          caseId={caseData.id}
          caseStatus={caseData.status}
          description={caseData.description}
        />
      </Flex>
      {isDetailsModalOpen && (
        <CaseDetails
          caseData={caseData}
          isAdmin={isAdmin}
          onSuccess={fetchCase}
          onClose={() => setIsDetailsModalOpen(false)}
        />
      )}
      {isBondDetailsOpen && (
        <BondDetails
          caseId={caseData.id}
          isAdmin={isAdmin}
          onClose={() => setIsBondDetailsOpen(false)}
        />
      )}
    </Box>
  );
};

export default CasePage;
