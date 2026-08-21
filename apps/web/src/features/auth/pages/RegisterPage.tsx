// Registration page -- name, phone, password and region only. Role is no
// longer chosen at signup (security hardening, Phase 1): every new
// account starts with zero roles, and a role is requested afterwards
// from inside the app and approved by an ADMIN (Phase 5's Admin Console).
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerSchema } from "@agroflow/validation";
import { REGIONS, type RegionName } from "@agroflow/config";
import { Button, Input, Select } from "@/components/ui";
import { useAuth } from "@/app/providers";
import { AuthLayout } from "./AuthLayout";
import { ApiClientError } from "@agroflow/api-client";

const regionOptions = REGIONS.map((region) => ({
  value: region,
  label: region.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
}));

type FieldErrors = Partial<Record<"fullName" | "phoneNumber" | "password" | "email" | "regionId", string>>;

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [regionId, setRegionId] = useState<RegionName | "">("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = registerSchema.safeParse({
      fullName,
      phoneNumber,
      password,
      email: email || undefined,
      regionId: regionId || undefined,
      preferredLanguage: "sw",
    });

    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        fullName: flat.fullName?.[0],
        phoneNumber: flat.phoneNumber?.[0],
        password: flat.password?.[0],
        email: flat.email?.[0],
        regionId: flat.regionId?.[0],
      });
      return;
    }
    setFieldErrors({});

    setIsSubmitting(true);
    try {
      await register(parsed.data);
      navigate("/");
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : "Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Jiunge nasi"
      title="Create your account"
      subtitle="We'll set up your workspace -- you can request your role once you're in."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-leaf-700 hover:text-leaf-800">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="Full name"
          name="fullName"
          autoComplete="name"
          placeholder="Asha Mwakalinga"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={fieldErrors.fullName}
        />
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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          hint="Use a mix of letters and numbers."
        />
        <Input
          label="Email (optional)"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          hint="Used for login codes and updates -- you can add this later too."
        />
        <Select
          label="Region"
          placeholder="Select your region"
          options={regionOptions}
          value={regionId}
          onChange={(e) => setRegionId(e.target.value as RegionName)}
          error={fieldErrors.regionId}
        />

        {formError && (
          <p role="alert" className="rounded-xl bg-rust-500/10 px-3 py-2 text-sm text-rust-600">
            {formError}
          </p>
        )}

        <Button type="submit" size="lg" isLoading={isSubmitting} className="mt-2 w-full">
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
