"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Eye, EyeOff, UserPlus, Loader2 } from "lucide-react";
import { registerCustomer, getAuthCookie, setAuthCookie, removeAuthCookie, getClientMedusaClient } from "@/lib/medusa/customer";

/* ------------------------------------------------------------------ */
/*  Register Page                                                     */
/* ------------------------------------------------------------------ */
export default function RegisterPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("auth.register");
  const tv = useTranslations("auth.register.validation");
  const te = useTranslations("auth.register.errors");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
  }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Redirect already logged-in users
  useEffect(() => {
    const checkSession = async () => {
      const cookie = getAuthCookie();
      if (cookie) {
        try {
          const sdk = getClientMedusaClient();
          const { customer } = await sdk.store.customer.retrieve();
          if (customer) {
            router.replace(`/${locale}/cabinet`);
            return;
          }
        } catch {
          // Token is expired or invalid, clear it to break any redirect loop
          removeAuthCookie();
        }
      }
      setCheckingAuth(false);
    };
    checkSession();
  }, [router, locale]);

  const validate = useCallback((): boolean => {
    const next: {
      firstName?: string;
      lastName?: string;
      email?: string;
      password?: string;
    } = {};

    if (!firstName.trim()) {
      next.firstName = tv("firstNameRequired");
    }
    if (!lastName.trim()) {
      next.lastName = tv("lastNameRequired");
    }
    if (!email.trim()) {
      next.email = tv("emailRequired");
    }
    if (!password) {
      next.password = tv("passwordRequired");
    } else if (password.length < 8) {
      next.password = tv("passwordMinLength");
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }, [firstName, lastName, email, password, tv]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setServerError(null);
      if (!validate()) return;

      setLoading(true);
      try {
        const result = await registerCustomer(
          firstName.trim(),
          lastName.trim(),
          email.trim(),
          password,
        );

        if (result.success) {
          setAuthCookie(result.token);
          router.push(`/${locale}/cabinet`);
        } else {
          const err = result.error;
          if (err.includes("already exists")) {
            setServerError(te("emailAlreadyExists"));
          } else {
            setServerError(err || te("registrationFailed"));
          }
        }
      } catch {
        setServerError(te("network"));
      } finally {
        setLoading(false);
      }
    },
    [firstName, lastName, email, password, validate, router, locale, te],
  );

  const clearFieldError = useCallback(
    (field: keyof typeof errors) => {
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors],
  );

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4ebe6]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4ebe6] px-4 py-16">
      <div className="w-full max-w-[420px] rounded-none bg-white shadow-md p-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <Link
            href={`/${locale}`}
            className="inline-block text-2xl font-bold tracking-[0.3em] text-[#2c211b]"
          >
            {locale === "ru" ? "САНЛУК" : "SUNLUK"}
          </Link>
          <h1 className="mt-8 text-2xl font-semibold text-[#2c211b]">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-[#2c211b]/60">{t("subtitle")}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Server error banner */}
          {serverError && (
            <div
              role="alert"
              className="rounded-none border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {serverError}
            </div>
          )}

          {/* Name row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Name */}
            <div className="space-y-2">
              <label
                htmlFor="register-firstname"
                className="block text-sm font-medium text-[#2c211b]"
              >
                {t("firstNameLabel")}
              </label>
              <input
                id="register-firstname"
                type="text"
                autoComplete="given-name"
                autoFocus
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  clearFieldError("firstName");
                }}
                placeholder={t("firstNamePlaceholder")}
                aria-invalid={!!errors.firstName}
                aria-describedby={
                  errors.firstName ? "register-firstname-error" : undefined
                }
                disabled={loading}
                className="w-full rounded-none border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20"
              />
              {errors.firstName && (
                <p
                  id="register-firstname-error"
                  role="alert"
                  className="text-xs text-destructive"
                >
                  {errors.firstName}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <label
                htmlFor="register-lastname"
                className="block text-sm font-medium text-[#2c211b]"
              >
                {t("lastNameLabel")}
              </label>
              <input
                id="register-lastname"
                type="text"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  clearFieldError("lastName");
                }}
                placeholder={t("lastNamePlaceholder")}
                aria-invalid={!!errors.lastName}
                aria-describedby={
                  errors.lastName ? "register-lastname-error" : undefined
                }
                disabled={loading}
                className="w-full rounded-none border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20"
              />
              {errors.lastName && (
                <p
                  id="register-lastname-error"
                  role="alert"
                  className="text-xs text-destructive"
                >
                  {errors.lastName}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label
              htmlFor="register-email"
              className="block text-sm font-medium text-[#2c211b]"
            >
              {t("emailLabel")}
            </label>
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError("email");
              }}
              placeholder={t("emailPlaceholder")}
              aria-invalid={!!errors.email}
              aria-describedby={
                errors.email ? "register-email-error" : undefined
              }
              disabled={loading}
              className="w-full rounded-none border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20"
            />
            {errors.email && (
              <p
                id="register-email-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label
              htmlFor="register-password"
              className="block text-sm font-medium text-[#2c211b]"
            >
              {t("passwordLabel")}
            </label>
            <div className="relative">
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFieldError("password");
                }}
                placeholder={t("passwordPlaceholder")}
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? "register-password-error" : undefined
                }
                disabled={loading}
                className="w-full rounded-none border border-input bg-background px-4 py-2.5 pr-11 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                disabled={loading}
                aria-label={
                  showPassword ? t("hidePassword") : t("showPassword")
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-none p-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p
                id="register-password-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {errors.password}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-none bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80 focus-visible:ring-2 focus-visible:ring-ring/50 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("registering")}
              </>
            ) : (
              <>
                <UserPlus className="size-4" />
                {t("registerButton")}
              </>
            )}
          </button>
        </form>

        {/* Footer link */}
        <p className="mt-8 text-center text-sm text-muted-foreground">
          {t("hasAccount")}{" "}
          <Link
            href={`/${locale}/login`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("loginLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
