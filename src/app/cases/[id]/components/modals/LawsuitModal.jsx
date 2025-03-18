"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Download } from "lucide-react";

const LAWSUIT_TYPES = {
  civil: { label: "민사소송", variant: "default" },
  payment_order: { label: "지급명령", variant: "secondary" },
  property_disclosure: { label: "재산명시", variant: "outline" },
  execution: { label: "강제집행", variant: "destructive" },
};

export default function LawsuitModal({ caseId, open, onOpenChange }) {
  const { user } = useUser();
  const [lawsuits, setLawsuits] = useState([]);
  const [selectedLawsuit, setSelectedLawsuit] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddSubmission, setShowAddSubmission] = useState(false);
  const [newSubmission, setNewSubmission] = useState({
    type: "",
    document_name: "",
    content: "",
    file: null,
  });

  useEffect(() => {
    if (open) {
      fetchLawsuits();
    }
  }, [open, caseId]);

  useEffect(() => {
    if (selectedLawsuit) {
      fetchSubmissions();
    }
  }, [selectedLawsuit]);

  const fetchLawsuits = async () => {
    try {
      const { data, error } = await supabase
        .from("test_case_lawsuits")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLawsuits(data || []);
      if (data.length > 0 && !selectedLawsuit) {
        setSelectedLawsuit(data[0]);
      }
    } catch (error) {
      toast.error("소송 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from("test_lawsuit_submissions")
        .select("*")
        .eq("lawsuit_id", selectedLawsuit.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      toast.error("송달/제출 내역을 불러오는데 실패했습니다.");
    }
  };

  const handleAddSubmission = async () => {
    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      toast.error("권한이 없습니다");
      return;
    }

    try {
      let fileUrl = null;
      if (newSubmission.file) {
        const fileExt = newSubmission.file.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${caseId}/${selectedLawsuit.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("lawsuit-documents")
          .upload(filePath, newSubmission.file);

        if (uploadError) throw uploadError;
        fileUrl = filePath;
      }

      const { data, error } = await supabase
        .from("test_lawsuit_submissions")
        .insert([
          {
            lawsuit_id: selectedLawsuit.id,
            submission_type: newSubmission.type,
            document_name: newSubmission.document_name,
            content: newSubmission.content,
            file_url: fileUrl,
            created_by: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setSubmissions((prev) => [data, ...prev]);
      setNewSubmission({
        type: "",
        document_name: "",
        content: "",
        file: null,
      });
      setShowAddSubmission(false);
      toast.success("송달/제출 내역이 등록되었습니다.");
    } catch (error) {
      toast.error("송달/제출 내역 등록에 실패했습니다.");
    }
  };

  const handleDownloadFile = async (fileUrl) => {
    try {
      const { data, error } = await supabase.storage.from("lawsuit-documents").download(fileUrl);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileUrl.split("/").pop();
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error("파일 다운로드에 실패했습니다.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>소송 관리</DialogTitle>
        </DialogHeader>

        <Tabs
          value={selectedLawsuit?.id}
          onValueChange={(value) => {
            const lawsuit = lawsuits.find((l) => l.id === value);
            setSelectedLawsuit(lawsuit);
          }}
        >
          <TabsList className="w-full justify-start">
            {lawsuits.map((lawsuit) => {
              const typeInfo = LAWSUIT_TYPES[lawsuit.lawsuit_type];
              return (
                <TabsTrigger
                  key={lawsuit.id}
                  value={lawsuit.id}
                  className="flex items-center gap-2"
                >
                  <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
                  <span>{lawsuit.case_number}</span>
                  <span className="text-muted-foreground">{lawsuit.court_name}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {lawsuits.map((lawsuit) => (
            <TabsContent key={lawsuit.id} value={lawsuit.id}>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">송달/제출 내역</h3>
                  {user?.role === "admin" && (
                    <Button onClick={() => setShowAddSubmission(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      내역 등록
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <Card key={submission.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  submission.submission_type === "송달" ? "default" : "secondary"
                                }
                              >
                                {submission.submission_type}
                              </Badge>
                              <span className="font-medium">{submission.document_name}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(submission.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-sm">{submission.content}</p>
                          </div>
                          {submission.file_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadFile(submission.file_url)}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              다운로드
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {showAddSubmission && (
          <Dialog open={showAddSubmission} onOpenChange={setShowAddSubmission}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>송달/제출 내역 등록</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>유형</Label>
                  <Select
                    value={newSubmission.type}
                    onValueChange={(value) =>
                      setNewSubmission((prev) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="유형 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="송달">송달</SelectItem>
                      <SelectItem value="제출">제출</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>서류명</Label>
                  <Input
                    value={newSubmission.document_name}
                    onChange={(e) =>
                      setNewSubmission((prev) => ({ ...prev, document_name: e.target.value }))
                    }
                    placeholder="서류명을 입력하세요"
                  />
                </div>

                <div>
                  <Label>내용</Label>
                  <Textarea
                    value={newSubmission.content}
                    onChange={(e) =>
                      setNewSubmission((prev) => ({ ...prev, content: e.target.value }))
                    }
                    placeholder="내용을 입력하세요"
                  />
                </div>

                <div>
                  <Label>첨부파일</Label>
                  <Input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      setNewSubmission((prev) => ({ ...prev, file }));
                    }}
                  />
                </div>

                <Button onClick={handleAddSubmission}>등록</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
