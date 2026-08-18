// Registration page -- name, phone, password, role and region. Role
// options are every RoleName (Section 2 Personas) since the same
// backend/account model serves field and desk roles alike; the sidebar
// shown after login (Phase 5) is what actually differs by role, not
// who's allowed to sign up on the web.
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerSchema } from "@agroflow/validation";
import { ROLES, ROLE_LABELS, REGIONS, type RoleName, type RegionName } from "@agroflow/config";
import { Button, Input, Select } from "@/components/ui";
import { useAuth } from "@/app/providers";
import { AuthLayout } from "./AuthLayout";
import { ApiClientError } from "@agroflow/api-client";

const roleOptions = ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }));
const regionOptions = REGIONS.map((region) => ({
  value: region,
  label: region.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
}));

type FieldErrors = Partial<Record<"fullName" | "phoneNumber" | "password" | "role" | "regionId", string>>;

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RoleName | "">("");
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
      role: role || undefined,
      regionId: regionId || undefined,
      preferredLanguage: "sw",
    });

    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        fullName: flat.fullName?.[0],
        phoneNumber: flat.phoneNumber?.[0],
        password: flat.password?.[0],
        role: flat.role?.[0],
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
      subtitle="Tell us who you are so we can set up the right workspace."
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
        <Select
          label="I am a..."
          placeholder="Select your role"
          options={roleOptions}
          value={role}
          onChange={(e) => setRole(e.target.value as RoleName)}
          error={fieldErrors.role}
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
