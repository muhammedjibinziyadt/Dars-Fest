import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CheckCircle2, XCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  getReplacementRequests,
  approveReplacementRequest,
  rejectReplacementRequest,
} from "@/lib/team-data";
import { RequestApprovalsClient } from "@/components/request-approvals-client";
import { redirectWithToast } from "@/lib/actions";

async function approveRequestAction(formData: FormData) {
  "use server";
  try {
    if (!(await isAdminAuthenticated())) {
      redirect("/admin/login");
    }
    const requestId = String(formData.get("requestId") ?? "");
    if (!requestId) {
      revalidatePath("/admin/request-approvals");
      redirectWithToast("/admin/request-approvals", "Request ID is required", "error");
      return;
    }
    await approveReplacementRequest(requestId, "admin");
    revalidatePath("/admin/request-approvals");
    redirectWithToast("/admin/request-approvals", "Replacement request approved successfully!", "success");
  } catch (error: any) {
    if (error?.digest === "NEXT_REDIRECT" || error?.message === "NEXT_REDIRECT") {
      throw error;
    }
    revalidatePath("/admin/request-approvals");
    redirectWithToast("/admin/request-approvals", error?.message || "Failed to approve request", "error");
  }
}

async function rejectRequestAction(formData: FormData) {
  "use server";
  try {
    if (!(await isAdminAuthenticated())) {
      redirect("/admin/login");
    }
    const requestId = String(formData.get("requestId") ?? "");
    if (!requestId) {
      revalidatePath("/admin/request-approvals");
      redirectWithToast("/admin/request-approvals", "Request ID is required", "error");
      return;
    }
    await rejectReplacementRequest(requestId, "admin");
    revalidatePath("/admin/request-approvals");
    redirectWithToast("/admin/request-approvals", "Replacement request rejected successfully!", "success");
  } catch (error: any) {
    if (error?.digest === "NEXT_REDIRECT" || error?.message === "NEXT_REDIRECT") {
      throw error;
    }
    revalidatePath("/admin/request-approvals");
    redirectWithToast("/admin/request-approvals", error?.message || "Failed to reject request", "error");
  }
}

export default async function RequestApprovalsPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const requests = await getReplacementRequests();
  const pendingRequests = requests.filter((r) => r.status === "pending");
  const processedRequests = requests.filter((r) => r.status !== "pending");

  return (
    <RequestApprovalsClient
      pendingRequests={pendingRequests}
      processedRequests={processedRequests}
      approveAction={approveRequestAction}
      rejectAction={rejectRequestAction}
    />
  );
}

