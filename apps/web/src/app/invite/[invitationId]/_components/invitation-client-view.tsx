"use client"

import { authClient } from "@spotting/auth/client"
import { env } from "@spotting/env/web"
import { Button } from "@spotting/ui/components/ui/button"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "nextjs-toploader/app"
import { toast } from "sonner"
import { AuthShell } from "@/components/auth/auth-shell"
import { fetchApi } from "@/lib/api-fetch"

type InvitationPreview = {
  id: string
  organizationName: string
  invitedEmail: string
  role: string
  status: string
  expiresAt: string | null
  sessionEmail: string | null
  emailMatches: boolean
}

interface InvitationClientViewProps {
  invitationId: string
}

export function InvitationClientView({
  invitationId,
}: InvitationClientViewProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: session, isPending: isSessionPending } = authClient.useSession()

  const callbackUrl = `${env.NEXT_PUBLIC_APP_URL}/invite/${invitationId}`

  const previewQuery = useQuery({
    queryKey: ["spotting.invite-preview", invitationId],
    queryFn: async () => {
      const data = await fetchApi(
        `/v1/orgs/invites/${invitationId}/preview`
      )
      return data as InvitationPreview
    },
    retry: false,
  })

  const preview = previewQuery.data
  const loginHref = preview
    ? `/login?email=${encodeURIComponent(preview.invitedEmail)}&callbackURL=${encodeURIComponent(callbackUrl)}`
    : `/login?callbackURL=${encodeURIComponent(callbackUrl)}`

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await authClient.organization.acceptInvitation({
        invitationId,
      })

      if (error) {
        throw error
      }

      const organizationId = data?.organizationId

      if (organizationId) {
        const { error: setActiveError } =
          await authClient.organization.setActive({
            organizationId,
          })

        if (setActiveError) {
          throw setActiveError
        }
      }
    },
    onSuccess: () => {
      toast.success("Invitation accepted")
      router.push("/dashboard")
      router.refresh()
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to accept invitation")
    },
  })

  const rejectMutation = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.organization.rejectInvitation({
        invitationId,
      })

      if (error) {
        throw error
      }
    },
    onSuccess: () => {
      toast.success("Invitation declined")
      router.push("/dashboard/settings/user")
      router.refresh()
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to reject invitation")
    },
  })

  const switchAccountMutation = useMutation({
    mutationFn: async () => {
      await authClient.signOut()
      await queryClient.invalidateQueries({ queryKey: ["session"] })
    },
    onSuccess: () => {
      router.push(loginHref as never)
      router.refresh()
    },
    onError: () => {
      toast.error("Could not sign out. Please try again.")
    },
  })

  const emailMismatch =
    Boolean(session && preview && !preview.emailMatches)
  const canRespond =
    Boolean(
      session &&
        preview &&
        preview.emailMatches &&
        preview.status === "pending"
    )

  return (
    <main className="flex min-h-svh items-center justify-center">
      <AuthShell
        description="Review and respond to this invitation."
        title="Organization Invitation"
      >
        {previewQuery.isPending || isSessionPending ? (
          <p className="text-muted-foreground text-sm">Loading invitation...</p>
        ) : null}

        {previewQuery.isError ? (
          <p className="text-destructive text-sm">
            {previewQuery.error instanceof Error
              ? previewQuery.error.message
              : "Invitation not found"}
          </p>
        ) : null}

        {preview ? (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-4 text-sm">
            <p>
              You&apos;re invited to join{" "}
              <span className="font-semibold">{preview.organizationName}</span>{" "}
              as <span className="font-medium">{preview.role}</span>.
            </p>
            <p className="text-muted-foreground">
              Invitation sent to{" "}
              <span className="font-medium text-foreground">
                {preview.invitedEmail}
              </span>
            </p>
            {session?.user?.email ? (
              <p className="text-muted-foreground">
                Signed in as{" "}
                <span className="font-medium text-foreground">
                  {session.user.email}
                </span>
              </p>
            ) : null}
          </div>
        ) : null}

        {emailMismatch ? (
          <div className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
            <p className="font-medium text-sm">
              This invite belongs to a different email address.
            </p>
            <p className="text-muted-foreground text-sm">
              Sign in as{" "}
              <span className="font-medium text-foreground">
                {preview?.invitedEmail}
              </span>{" "}
              to accept or decline.
            </p>
            <Button
              disabled={switchAccountMutation.isPending}
              onClick={() => switchAccountMutation.mutate()}
              size="lg"
            >
              {switchAccountMutation.isPending
                ? "Signing out..."
                : "Switch account"}
            </Button>
          </div>
        ) : null}

        {!isSessionPending && !session ? (
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Sign in with{" "}
              <span className="font-medium text-foreground">
                {preview?.invitedEmail ?? "the invited email"}
              </span>{" "}
              to accept or decline.
            </p>
            <Button
              onClick={() => {
                router.push(loginHref as never)
              }}
              size="lg"
            >
              Sign in to continue
            </Button>
          </div>
        ) : null}

        {canRespond ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="sm:flex-1"
              disabled={acceptMutation.isPending || rejectMutation.isPending}
              onClick={() => acceptMutation.mutate()}
              size="lg"
            >
              {acceptMutation.isPending ? "Accepting..." : "Accept invitation"}
            </Button>
            <Button
              className="sm:flex-1"
              disabled={acceptMutation.isPending || rejectMutation.isPending}
              onClick={() => rejectMutation.mutate()}
              size="lg"
              variant="outline"
            >
              {rejectMutation.isPending ? "Declining..." : "Decline"}
            </Button>
          </div>
        ) : null}

        {session && preview && preview.status !== "pending" ? (
          <p className="text-muted-foreground text-sm">
            This invitation is no longer pending.
          </p>
        ) : null}
      </AuthShell>
    </main>
  )
}
