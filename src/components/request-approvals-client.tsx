"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, XCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ReplacementRequest } from "@/lib/types";
import { showSuccess, showError } from "@/lib/toast";

interface RequestApprovalsClientProps {
  pendingRequests: ReplacementRequest[];
  processedRequests: ReplacementRequest[];
  approveAction: (formData: FormData) => Promise<void>;
  rejectAction: (formData: FormData) => Promise<void>;
}

async function exportRequestToPDF(request: ReplacementRequest) {
  try {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Replacement Request", 14, 22);
    
    doc.setFontSize(11);
    let yPos = 30;
    
    doc.text(`Request ID: ${request.id}`, 14, yPos);
    yPos += 8;
    doc.text(`Submitted: ${new Date(request.submittedAt).toLocaleString()}`, 14, yPos);
    yPos += 8;
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Program Information", 14, yPos + 5);
    yPos += 12;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Program: ${request.programName}`, 14, yPos);
    yPos += 7;
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Team Information", 14, yPos + 5);
    yPos += 12;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Team: ${request.teamName}`, 14, yPos);
    yPos += 7;
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Replacement Details", 14, yPos + 5);
    yPos += 12;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Current Student: ${request.oldStudentName} (Chest: ${request.oldStudentChest})`, 14, yPos);
    yPos += 7;
    doc.text(`Replacement Student: ${request.newStudentName} (Chest: ${request.newStudentChest})`, 14, yPos);
    yPos += 7;
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Reason", 14, yPos + 5);
    yPos += 12;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const reasonLines = doc.splitTextToSize(request.reason, 180);
    doc.text(reasonLines, 14, yPos);
    yPos += reasonLines.length * 5 + 5;
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Status", 14, yPos + 5);
    yPos += 12;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Status: ${request.status.toUpperCase()}`, 14, yPos);
    if (request.reviewedAt) {
      yPos += 7;
      doc.text(`Reviewed: ${new Date(request.reviewedAt).toLocaleString()}`, 14, yPos);
      if (request.reviewedBy) {
        yPos += 7;
        doc.text(`Reviewed By: ${request.reviewedBy}`, 14, yPos);
      }
    }
    
    doc.save(`replacement_request_${request.id}_${new Date().toISOString().split("T")[0]}.pdf`);
  } catch (error) {
    console.error("PDF export failed:", error);
    alert("PDF export requires jsPDF library. Please install it: npm install jspdf");
  }
}

export function RequestApprovalsClient({
  pendingRequests,
  processedRequests,
  approveAction,
  rejectAction,
}: RequestApprovalsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [processing, setProcessing] = useState<Set<string>>(new Set());

  function handleApprove(requestId: string) {
    setProcessing((prev) => new Set(prev).add(requestId));
    startTransition(async () => {
      const formData = new FormData();
      formData.append("requestId", requestId);
      try {
        await approveAction(formData);
        showSuccess("Replacement request approved successfully!");
        window.location.reload();
      } catch (error) {
        showError(error instanceof Error ? error.message : "Failed to approve request");
        setProcessing((prev) => {
          const next = new Set(prev);
          next.delete(requestId);
          return next;
        });
      }
    });
  }

  function handleReject(requestId: string) {
    setProcessing((prev) => new Set(prev).add(requestId));
    startTransition(async () => {
      const formData = new FormData();
      formData.append("requestId", requestId);
      try {
        await rejectAction(formData);
        showSuccess("Replacement request rejected successfully!");
        window.location.reload();
      } catch (error) {
        showError(error instanceof Error ? error.message : "Failed to reject request");
        setProcessing((prev) => {
          const next = new Set(prev);
          next.delete(requestId);
          return next;
        });
      }
    });
  }

  return (
    <div className="space-y-8 text-white">
      <div>
        <h1 className="text-3xl font-bold">Request Approvals</h1>
        <p className="text-sm text-white/70">
          Review and manage replacement requests from team leaders.
        </p>
      </div>

      {pendingRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Pending Requests ({pendingRequests.length})</h2>
          {pendingRequests.map((request) => (
            <Card key={request.id} className="border-white/10 bg-white/5 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge tone="amber">Pending</Badge>
                    <span className="text-xs text-white/60">
                      {new Date(request.submittedAt).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/90">Program</p>
                    <p className="text-sm text-white/70">{request.programName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/90">Team</p>
                    <p className="text-sm text-white/70">{request.teamName}</p>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-semibold text-white/90">Current Student</p>
                      <p className="text-sm text-white/70">
                        {request.oldStudentName} (Chest: {request.oldStudentChest})
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white/90">Replacement Student</p>
                      <p className="text-sm text-white/70">
                        {request.newStudentName} (Chest: {request.newStudentChest})
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/90">Reason</p>
                    <p className="text-sm text-white/70">{request.reason}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => exportRequestToPDF(request)}
                    variant="secondary"
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export PDF
                  </Button>
                  <Button
                    onClick={() => handleApprove(request.id)}
                    disabled={isPending || processing.has(request.id)}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleReject(request.id)}
                    disabled={isPending || processing.has(request.id)}
                    variant="destructive"
                    className="gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {processedRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Processed Requests ({processedRequests.length})</h2>
          {processedRequests.map((request) => (
            <Card key={request.id} className="border-white/10 bg-white/5 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge tone={request.status === "approved" ? "emerald" : "pink"}>
                      {request.status === "approved" ? "Approved" : "Rejected"}
                    </Badge>
                    <span className="text-xs text-white/60">
                      Submitted: {new Date(request.submittedAt).toLocaleString()}
                    </span>
                    {request.reviewedAt && (
                      <span className="text-xs text-white/60">
                        Reviewed: {new Date(request.reviewedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/90">Program</p>
                    <p className="text-sm text-white/70">{request.programName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/90">Team</p>
                    <p className="text-sm text-white/70">{request.teamName}</p>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-semibold text-white/90">Current Student</p>
                      <p className="text-sm text-white/70">
                        {request.oldStudentName} (Chest: {request.oldStudentChest})
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white/90">Replacement Student</p>
                      <p className="text-sm text-white/70">
                        {request.newStudentName} (Chest: {request.newStudentChest})
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/90">Reason</p>
                    <p className="text-sm text-white/70">{request.reason}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => exportRequestToPDF(request)}
                    variant="secondary"
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export PDF
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {pendingRequests.length === 0 && processedRequests.length === 0 && (
        <Card className="border-white/10 bg-white/5 p-6 text-center">
          <p className="text-white/70">No replacement requests found.</p>
        </Card>
      )}
    </div>
  );
}

