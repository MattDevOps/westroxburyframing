import { COOKIE_NAME, verifyStaffCookie } from "@/lib/auth";

export function getStaffUserIdFromRequest(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  const value = match ? decodeURIComponent(match[1]) : null;
  return verifyStaffCookie(value);
}
