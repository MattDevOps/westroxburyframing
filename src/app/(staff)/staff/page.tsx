import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyStaffCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function StaffRoot() {
  // Check user role server-side to redirect receptionists immediately
  try {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(COOKIE_NAME)?.value;
    const userId = verifyStaffCookie(cookieValue);
    
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      
      // Receptionists should go directly to customer form
      if (user?.role === "receptionist") {
        redirect("/staff/customer-form");
      }
    }
  } catch (error) {
    // If there's an error checking role, just redirect to dashboard
    // Middleware will handle authentication
    console.error("Error checking user role:", error);
  }
  
  // Default redirect for all other users
  redirect("/staff/dashboard");
}
