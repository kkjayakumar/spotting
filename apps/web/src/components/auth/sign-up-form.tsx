"use client"

import { authClient } from "@spotting/auth/client"
import { env } from "@spotting/env/web"
import { Loader } from "@spotting/ui/components/loader"
import { Button } from "@spotting/ui/components/ui/button"
import { Field, FieldError, FieldLabel } from "@spotting/ui/components/ui/field"
import { Input } from "@spotting/ui/components/ui/input"
import { useForm } from "@tanstack/react-form"
import Link from "next/link"
import { useEffect } from "react"
import { toast } from "sonner"
import { AuthShell } from "@/components/auth/auth-shell"
import { AUTH_MIN_PASSWORD_LENGTH, getAuthErrorMessage } from "@/lib/auth"
import { registerFormSchema } from "@/lib/schema/auth"

export function SignUpForm() {
  const { data: session, isPending } = authClient.useSession()

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validators: {
      onChange: registerFormSchema,
    },
    onSubmit: async ({ value }) => {
      const result = await authClient.signUp
        .email({
          name: value.name,
          email: value.email,
          password: value.password,
          callbackURL: env.NEXT_PUBLIC_APP_URL,
        })
        .catch(() => null)

      if (!result) {
        toast.error("Unable to reach the auth server. Please try again.")
        return
      }

      if (result.error) {
        toast.error(getAuthErrorMessage(result.error))
        return
      }

      if (result.data?.sessionToken) {
        toast.success("Account created successfully.")
        window.location.assign("/dashboard")
        return
      }

      toast.success("Account created. Sign in to continue.")
      window.location.assign(`/login?email=${encodeURIComponent(value.email)}`)
    },
  })

  useEffect(() => {
    if (!session) return

    const token = localStorage.getItem("spotting_token")
    if (token) {
      void fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        credentials: "include",
      }).finally(() => {
        window.location.assign("/dashboard")
      })
      return
    }

    window.location.assign("/dashboard")
  }, [session])

  if (isPending) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader />
      </div>
    )
  }

  if (session) {
    return null
  }

  return (
    <AuthShell
      description="Create your account to get started"
      title="Create account"
    >
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          event.stopPropagation()
          form.handleSubmit()
        }}
      >
        <form.Field name="name">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && field.state.meta.errors.length > 0

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                <Input
                  aria-invalid={isInvalid}
                  autoComplete="name"
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Your name"
                  required
                  value={field.state.value}
                />
                {isInvalid ? (
                  <FieldError errors={field.state.meta.errors} />
                ) : null}
              </Field>
            )
          }}
        </form.Field>

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
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                <Input
                  aria-invalid={isInvalid}
                  autoComplete="new-password"
                  id={field.name}
                  minLength={AUTH_MIN_PASSWORD_LENGTH}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="••••••••"
                  required
                  type="password"
                  value={field.state.value}
                />
                <p className="text-muted-foreground text-xs">
                  Use at least {AUTH_MIN_PASSWORD_LENGTH} characters.
                </p>
                {isInvalid ? (
                  <FieldError errors={field.state.meta.errors} />
                ) : null}
              </Field>
            )
          }}
        </form.Field>

        <form.Field name="confirmPassword">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && field.state.meta.errors.length > 0

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Confirm password</FieldLabel>
                <Input
                  aria-invalid={isInvalid}
                  autoComplete="new-password"
                  id={field.name}
                  minLength={AUTH_MIN_PASSWORD_LENGTH}
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
          className="h-12 w-full font-bold text-lg bg-green-500 hover:bg-green-600 text-black shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all active:scale-[0.98]"
          disabled={form.state.isSubmitting}
          type="submit"
        >
          {form.state.isSubmitting ? "Creating account..." : "Sign up"}
        </Button>
      </form>

      <p className="text-center text-muted-foreground text-sm">
        Already have an account?{" "}
        <Link
          className="font-medium text-foreground hover:underline"
          href="/login"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
