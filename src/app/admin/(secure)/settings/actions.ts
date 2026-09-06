"use server";

import { revalidatePath } from "next/cache";
import {
  syncAdminToFirebaseAuth,
  resolveAdminEmail,
  signInAdminWithFirebaseAuth,
  getCurrentAdmin,
} from "@/lib/auth";
import { sendCredentialUpdateEmail } from "@/lib/email-service";

export async function updateAdminCredentials(
  prevState: { error?: string; success?: string },
  formData: FormData,
) {
  try {
    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();
    const currentPassword = String(formData.get("currentPassword") ?? "").trim();

    if (!username || !password || !currentPassword) {
      return { error: "All fields are required." };
    }

    if (password.length < 6) {
      return { error: "Password must be at least 6 characters long (required by Firebase Authentication)." };
    }

    // 1. Verify current password directly with Firebase Authentication
    const currentAdmin = await getCurrentAdmin();
    const currentEmail = currentAdmin?.email || (await resolveAdminEmail(currentAdmin?.username || "admin"));

    const verifyCheck = await signInAdminWithFirebaseAuth(currentEmail, currentPassword);
    if (!verifyCheck.success) {
      return { error: "Incorrect current password. Please enter your valid Firebase Authentication password." };
    }

    // 2. Store & Update ONLY in Firebase Authentication
    const syncRes = await syncAdminToFirebaseAuth(username, password);

    // 3. Send email notification if configured
    await sendCredentialUpdateEmail({ username: syncRes.displayName, password }).catch(() => {});

    revalidatePath("/admin/settings");
    return {
      success: `Credentials successfully updated in Firebase Authentication! You can log in using '${syncRes.displayName}' or '${syncRes.email}'.`,
    };
  } catch (error: any) {
    console.error("Failed to update credentials:", error);
    return { error: error?.message || "Failed to update credentials. Please try again." };
  }
}
