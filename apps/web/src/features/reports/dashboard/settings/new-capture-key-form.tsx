"use client"

import { PublicKeyForm } from "@/app/(protected)/dashboard/settings/_components/public-keys/forms/public-key-form"

interface NewCaptureKeyFormProps {
  isPending: boolean
  onSubmit: (input: {
    label: string
    allowedOrigins: string[]
  }) => Promise<void>
}

export function NewCaptureKeyForm({
  isPending,
  onSubmit,
}: NewCaptureKeyFormProps) {
  return (
    <PublicKeyForm
      defaultValues={{ allowedOrigins: [], label: "" }}
      isPending={isPending}
      onSubmit={onSubmit}
      submitLabel="Create key"
      submittingLabel="Creating..."
    />
  )
}

/** @deprecated Use NewCaptureKeyForm */
export const PublicKeyCreateForm = NewCaptureKeyForm
