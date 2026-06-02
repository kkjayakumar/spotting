"use client"

import { authClient } from "@spotting/auth/client"
import { env } from "@spotting/env/web"
import { Icons } from "@spotting/ui/components/icons"
import { Loader } from "@spotting/ui/components/loader"
import { Button } from "@spotting/ui/components/ui/button"
import { Field, FieldError, FieldLabel } from "@spotting/ui/components/ui/field"
import { Input } from "@spotting/ui/components/ui/input"
import { useForm } from "@tanstack/react-form"
import Link from "next/link"
import { parseAsString, useQueryState } from "nuqs"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { AuthShell } from "@/components/auth/auth-shell"
import { getAuthErrorMessage } from "@/lib/auth"
import { finishAuthRedirect } from "@/lib/auth-redirect"
import { queryClient } from "@/lib/api"
import { loginFormSchema } from "@/lib/schema/auth"

export function SignInForm() {
  const [emailQuery] = useQueryState("email", parseAsString.withDefault(""))
  const [callbackUrlQuery] = useQueryState(
    "callbackURL",
    parseAsString.withDefault("/dashboard")
  )
  const { data: session, isPending } = authClient.useSession()
  const [isSocialSignInPending, setIsSocialSignInPending] = useState(false)
  const [isContinuePending, setIsContinuePending] = useState(false)
  const isGoogleAuthEnabled = env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED
  const callbackURL = useMemo(() => {
    try {
      const appUrl = new URL(env.NEXT_PUBLIC_APP_URL)
      const parsed = new URL(callbackUrlQuery, appUrl)

      if (parsed.origin !== appUrl.origin) {
        return env.NEXT_PUBLIC_APP_URL
      }

      return parsed.toString()
    } catch {
      return env.NEXT_PUBLIC_APP_URL
    }
  }, [callbackUrlQuery])

  const redirectPath = useMemo(() => {
    try {
      const appUrl = new URL(env.NEXT_PUBLIC_APP_URL)
      const parsed = new URL(callbackUrlQuery, appUrl)

      if (parsed.origin !== appUrl.origin) {
        return "/dashboard"
      }

      const path = `${parsed.pathname}${parsed.search}${parsed.hash}`
      if (path === "/" || path === "") {
        return "/dashboard"
      }
      return path
    } catch {
      return "/dashboard"
    }
  }, [callbackUrlQuery])

  const form = useForm({
    defaultValues: {
      email: emailQuery,
      password: "",
    },
    validators: {
      onChange: loginFormSchema,
    },
    onSubmit: async ({ value }) => {
      const result = await authClient.signIn
        .email({
          email: value.email,
          password: value.password,
          callbackURL,
        })
        .catch(() => null)

      if (!result) {
        toast.error(
          "Unable to reach the auth server. Please try again in a moment."
        )
        return
      }

      if (result.error) {
        toast.error(getAuthErrorMessage(result.error))
        return
      }

      await queryClient.invalidateQueries({ queryKey: ["session"] })
      toast.success("Signed in successfully.")
      await finishAuthRedirect(redirectPath)
    },
  })

  const handleContinue = async () => {
    setIsContinuePending(true)
    try {
      await finishAuthRedirect(redirectPath)
    } finally {
      setIsContinuePending(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsSocialSignInPending(true)

    const result = await authClient.signIn
      .social({
        provider: "google",
        callbackURL,
      })
      .catch(() => null)

    if (!result) {
      toast.error("Unable to reach the auth server. Please try again.")
      setIsSocialSignInPending(false)
      return
    }

    if (result.error) {
      toast.error(getAuthErrorMessage(result.error))
    }

    setIsSocialSignInPending(false)
  }

  if (isPending) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader />
      </div>
    )
  }

  if (session) {
    return (
      <AuthShell
        description="You are already signed in. Continue to your workspace or sign out to use another account."
        title="Already signed in"
      >
        <Button
          className="h-12 w-full font-bold text-lg"
          disabled={isContinuePending}
          onClick={() => void handleContinue()}
          type="button"
        >
          {isContinuePending ? "Opening dashboard…" : "Continue to dashboard"}
        </Button>
        <Button
          className="h-12 w-full"
          disabled={isContinuePending}
          onClick={async () => {
            await authClient.signOut()
            window.location.assign("/login")
          }}
          type="button"
          variant="outline"
        >
          Sign out
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      description="Sign in to your account to continue"
      title="Welcome back"
    >
      {isGoogleAuthEnabled ? (
        <>
          <Button
            className="h-12 w-full font-semibold text-base shadow-sm transition-all hover:bg-muted/50 hover:shadow-md active:scale-[0.98]"
            disabled={isSocialSignInPending || form.state.isSubmitting}
            onClick={handleGoogleSignIn}
            type="button"
            variant="outline"
          >
            <Icons.google className="mr-3 h-5 w-5" />
            Continue with Google
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-muted border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 font-medium text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>
        </>
      ) : null}

      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          event.stopPropagation()
          form.handleSubmit()
        }}
      >
        <form.Field name="email">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && field.state.meta.errors.length > 0

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                <Input
                  aria-invalid={isInvalid}
                  autoComplete="email"
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={field.state.value}
                />
                {isInvalid ? (
                  <FieldError errors={field.state.meta.errors} />
                ) : null}
              </Field>
            )
          }}
        </form.Field>

        <form.Field name="password">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && field.state.meta.errors.length > 0

            return (
              <Field data-invalid={isInvalid}>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                  <Link
                    className="text-slate-400 text-sm transition hover:text-slate-200"
                    href="/forgot-password"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  aria-invalid={isInvalid}
                  autoComplete="current-password"
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="••••••••"
                  required
                  type="password"
                  value={field.state.value}
                />
                {isInvalid ? (
                  <FieldError errors={field.state.meta.errors} />
                ) : null}
              </Field>
            )
          }}
        </form.Field>

        <Button
          className="h-12 w-full font-bold text-lg bg-blue-500 hover:bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all active:scale-[0.98]"
          disabled={form.state.isSubmitting || isSocialSignInPending}
          type="submit"
        >
          {form.state.isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-slate-400 text-sm">
        Don&apos;t have an account?{" "}
        <Link
          className="font-medium text-[#00BFFF] hover:text-sky-300 hover:underline"
          href="/register"
        >
          Sign up
        </Link>
      </p>
    </AuthShell>
  )
}
