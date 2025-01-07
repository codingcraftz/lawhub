import { supabase } from "@/utils/supabase";

export const fetchDeadlines = async (caseId) => {
  const { data, error } = await supabase
    .from("case_deadlines")
    .select("*")
    .eq("case_id", caseId)
    .order("deadline_date", { ascending: true });
  if (error) throw error;
  return data;
};

export const fetchTimelineItems = async (caseId) => {
  const { data, error } = await supabase
    .from("case_timelines")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
};

export const fetchFiles = async (timelineId) => {
  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq("entity_id", timelineId);
  if (error) throw error;
  return data;
};
