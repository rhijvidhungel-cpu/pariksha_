import { redirect } from "next/navigation";

export default function AdminForgotPasswordRedirect() {
  redirect("/forgot-password");
}