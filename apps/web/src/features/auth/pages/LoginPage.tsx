// Login page -- phone + password. OTP login (for field roles without a
// password) is a secondary path added once the channels phase wires up
// SMS delivery of the code; the form here already supports the API's
// OTP endpoints via api-client, so that tab is a small addition later.
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginSchema } from "@agroflow/validation";
import { Button, Input } from "@/components/ui";
import { useAuth } from "@/app/providers";
import { AuthLayout } from "./AuthLayout";
import { ApiClientError } from "@agroflow/api-client";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ phoneNumber?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = loginSchema.safeParse({ phoneNumber, password });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({ phoneNumber: flat.phoneNumber?.[0], password: flat.password?.[0] });
      return;
    }
    setFieldErrors({});

    setIsSubmitting(true);
    try {
      await login(parsed.data);
      navigate("/");
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : "Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Karibu tena"
      title="Sign in to AgroFlow"
      subtitle="Enter your phone number and password to continue."
      footer={
        <>
          New to AgroFlow?{" "}
          <Link to="/register" className="font-semibold text-leaf-700 hover:text-leaf-800">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="Phone number"
          name="phoneNumber"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0712 345 678"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          error={fieldErrors.phoneNumber}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />

        {formError && (
          <p role="alert" className="rounded-xl bg-rust-500/10 px-3 py-2 text-sm text-rust-600">
            {formError}
          </p>
        )}

        <Button type="submit" size="lg" isLoading={isSubmitting} className="mt-2 w-full">
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
