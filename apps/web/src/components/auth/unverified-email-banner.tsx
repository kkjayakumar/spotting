"use client"

import { Button, buttonVariants } from "@spotting/ui/components/ui/button"
import { useCooldown } from "@spotting/ui/hooks/use-cooldown"
import { cn } from "@spotting/ui/lib/utils"
import { useQueryClient } from "@tanstack/react-query"
import { X } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { authClient } from "@spotting/auth/client"

type UnverifiedEmailBannerProps = {
  initialVerified?: boolean
}

export function UnverifiedEmailBanner({
  initialVerified = false,
}: UnverifiedEmailBannerProps) {
  const queryClient = useQueryClient()
  const { data: session } = authClient.useSession()
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const { isCoolingDown, isHydrated, remainingSeconds, start } = useCooldown({
    durationSeconds: 60,
    key: "auth-code-send",
  })

  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: ["session"] })
  }, [queryClient])

  const isVerified =
    initialVerified || Boolean(session?.user?.emailVerified)

  const handleResendCode = async () => {
    const email = session?.user?.email?.trim()
    if (!email) {
      toast.error("Could not read your email. Try signing out and back in.")
      return
    }

    setIsSendingCode(true)

    try {
      const res = await authClient.emailOtp.sendVerificationOtp({ email })
      if (res.error) {
        toast.error(
          res.error.message ?? "Unable to send verification code. Please try again."
        )
      } else {
        start()
        toast.success("Verification code sent.")
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unable to send verification code. Please try again."
      toast.error(errorMessage)
    }

    setIsSendingCode(false)
  }

  const handleDismiss = () => setIsDismissed(true)

  if (isDismissed || isVerified) {
    return null
  }

  return (
    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="font-medium text-sm">Your email is not verified yet.</p>
        <Button
          aria-label="Dismiss email verification banner"
          className="size-7 text-amber-900 hover:text-amber-950 dark:text-amber-200 dark:hover:text-amber-100"
          onClick={handleDismiss}
          size="icon"
          type="button"
          variant="ghost"
        >
          <X />
        </Button>
      </div>
      <p className="mt-1 text-sm">
        You can continue using your account, but verify your email to secure it
        and recover access faster.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          className={cn(buttonVariants({ size: "sm", variant: "secondary" }))}
          href="/verify-email"
        >
          Verify email
        </Link>
        <Button
          disabled={!isHydrated || isSendingCode || isCoolingDown}
          onClick={handleResendCode}
          size="sm"
          type="button"
          variant="outline"
        >
          {isSendingCode
            ? "Sending..."
            : isCoolingDown
              ? `Resend in ${remainingSeconds}s`
              : "Resend code"}
        </Button>
      </div>
    </div>
  )
}
