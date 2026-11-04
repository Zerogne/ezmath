import type { Metadata } from "next";
import { ForgotPassword } from "@/components/auth/forgot-password";
import { isVerifyMnConfigured } from "@/lib/verify-mn";

export const metadata: Metadata = { title: "Нууц үг сэргээх" };

export default function ForgotPasswordPage() {
  return <ForgotPassword enabled={isVerifyMnConfigured()}/>;
}
