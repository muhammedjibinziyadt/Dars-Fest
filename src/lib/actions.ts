import { redirect } from "next/navigation";

/**
 * Helper function to redirect with toast message
 */
export function redirectWithToast(
  path: string,
  message: string,
  type: "success" | "error" | "info" | "warning" = "error",
) {
  const params = new URLSearchParams();
  params.set("message", encodeURIComponent(message));
  params.set("type", type);
  redirect(`${path}?${params.toString()}`);
}

