"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
import {
  loginCustomer,
  setAuthCookie,
  getAuthCookie,
  removeAuthCookie,
  getClientMedusaClient,
} from "@/lib/medusa/customer";

// Ensure Medusa SDK is configured on client init
getClientMedusaClient();

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function isNetworkError(message: string): boolean {
  return /network|fetch|unreachable|timeout|ECONNREFUSED/i.test(message);
}

/* ------------------------------------------------------------------ */
/*  Login Page                                                        */
/* ------------------------------------------------------------------ */
export default function LoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("auth.login");
  const tv = useTranslations("auth.login.validation");
  const te = useTranslations("auth.login.errors");
  const t_auth = useTranslations("auth");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
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
    const next: { email?: string; password?: string } = {};

    if (!email.trim()) {
      next.email = tv("emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = tv("emailInvalid");
    }

    if (!password) {
      next.password = tv("passwordRequired");
    } else if (password.length < 6) {
      next.password = tv("passwordMinLength");
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }, [email, password, tv]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setServerError(null);
      if (!validate()) return;

      setLoading(true);
      try {
        const result = await loginCustomer(email.trim(), password);

        if (result.success) {
          setAuthCookie(result.token);
          router.push(`/${locale}/cabinet`);
        } else {
          setServerError(
            isNetworkError(result.error)
              ? te("network")
              : te("invalidCredentials"),
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [email, password, validate, router, locale, te],
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
      <div className="w-full max-w-[420px] rounded-none bg-card p-8 shadow-md">
        <div className="mb-8 text-center">
          <Link
            href={`/${locale}`}
            className="inline-block font-serif text-2xl font-bold tracking-widest text-foreground"
          >
            SUNLUK
          </Link>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t_auth("brandSubtitle")}
          </p>
          <h1 className="mt-6 text-2xl font-semibold text-foreground">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
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

          {/* Email */}
          <div className="space-y-2">
            <label
              htmlFor="login-email"
              className="block text-sm font-medium text-foreground"
            >
              {t("emailLabel")}
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email)
                  setErrors((p) => ({ ...p, email: undefined }));
              }}
              placeholder={t("emailPlaceholder")}
              aria-invalid={!!errors.email}
              aria-describedby={
                errors.email ? "login-email-error" : undefined
              }
              disabled={loading}
              className="w-full rounded-none border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20"
            />
            {errors.email && (
              <p
                id="login-email-error"
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
              htmlFor="login-password"
              className="block text-sm font-medium text-foreground"
            >
              {t("passwordLabel")}
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password)
                    setErrors((p) => ({ ...p, password: undefined }));
                }}
                placeholder={t("passwordPlaceholder")}
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? "login-password-error" : undefined
                }
                disabled={loading}
                className="w-full rounded-none border border-input bg-background px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20"
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
                id="login-password-error"
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
            className="flex w-full items-center justify-center gap-2 rounded-none bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80 focus-visible:ring-2 focus-visible:ring-ring/50 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("loggingIn")}
              </>
            ) : (
              <>
                <LogIn className="size-4" />
                {t("loginButton")}
              </>
            )}
          </button>
        </form>

        {/* Footer link */}
        <p className="mt-8 text-center text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link
            href={`/${locale}/register`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("registerLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
