"use client"

import { authClient } from "@spotting/auth/client"
import { Button } from "@spotting/ui/components/ui/button"
import { Loader } from "@spotting/ui/components/loader"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useRouter } from "nextjs-toploader/app"
import { toast } from "sonner"

import { AuthShell } from "@/components/auth/auth-shell"
import { API_BASE_URL } from "@/lib/api-base-url"

import CreateOrganizationOnboardingForm from "./create-organization-onboarding-form"

type OnboardingState = {
  canCreateOrganization: boolean
  organizationExists: boolean
  pendingInvites: Array<{
    id: string
    email: string
    role: string
    organizationId: string
    organizationName: string
    expiresAt: string | null
  }>
}

async function fetchOnboardingState(): Promise<OnboardingState> {
  const headers = new Headers({ "Content-Type": "application/json" })
  const token =
    typeof window !== "undefined" ? localStorage.getItem("spotting_token") : null
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const response = await fetch(`${API_BASE_URL}/v1/onboarding/state`, { headers })
  if (!response.ok) {
    throw new Error("Failed to load onboarding state")
  }
  return response.json() as Promise<OnboardingState>
}

export default function OnboardingEntry() {
  const router = useRouter()
  const stateQuery = useQuery({
    queryKey: ["onboarding-state"],
    queryFn: fetchOnboardingState,
  })

  const acceptMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { data, error } = await authClient.organization.acceptInvitation({
        invitationId,
      })
      if (error) throw error

      const organizationId = data?.organizationId
      if (organizationId) {
        const { error: setActiveError } = await authClient.organization.setActive({
          organizationId,
        })
        if (setActiveError) throw setActiveError
      }
    },
    onSuccess: () => {
      toast.success("Joined workspace")
      router.push("/dashboard")
      router.refresh()
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? "Failed to accept invitation")
    },
  })

  if (stateQuery.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Loader />
      </main>
    )
  }

  if (stateQuery.isError || !stateQuery.data) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <AuthShell
          description="We could not determine your workspace access. Try signing in again."
          title="Onboarding unavailable"
        >
          <Button onClick={() => router.push("/login")} type="button">
            Back to sign in
          </Button>
        </AuthShell>
      </main>
    )
  }

  const state = stateQuery.data

  if (state.pendingInvites.length > 0) {
    const invite = state.pendingInvites[0]
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <AuthShell
          description={`You were invited to join ${invite.organizationName}. Accept the invitation to access the workspace.`}
          title="Team invitation"
        >
          <Button
            className="h-11 w-full"
            disabled={acceptMutation.isPending}
            onClick={() => acceptMutation.mutate(invite.id)}
            type="button"
          >
            {acceptMutation.isPending ? "Joining…" : `Join ${invite.organizationName}`}
          </Button>
        </AuthShell>
      </main>
    )
  }

  if (state.canCreateOrganization) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <CreateOrganizationOnboardingForm />
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <AuthShell
        description="This app uses one shared workspace. Contact your administrator to send an invitation to your email address."
        title="Invitation required"
      >
        <Button onClick={() => router.push("/login")} type="button" variant="outline">
          Sign in with another account
        </Button>
      </AuthShell>
    </main>
  )
}
