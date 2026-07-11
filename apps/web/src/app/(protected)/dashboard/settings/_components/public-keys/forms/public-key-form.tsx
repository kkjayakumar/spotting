"use client"

import { Button } from "@spotting/ui/components/ui/button"
import { Field, FieldError, FieldLabel } from "@spotting/ui/components/ui/field"
import { Input } from "@spotting/ui/components/ui/input"
import { Textarea } from "@spotting/ui/components/ui/textarea"
import { useForm } from "@tanstack/react-form"

import { captureKeyCreateFormSchema } from "@/lib/schema/settings"

import { formatPublicKeyOrigins, parsePublicKeyOrigins } from "../utils"

interface PublicKeyFormProps {
  defaultValues: {
    allowedOrigins: string[]
    label: string
  }
  isPending: boolean
  onSubmit: (input: {
    allowedOrigins: string[]
    label: string
  }) => Promise<void>
  submitLabel: string
  submittingLabel: string
}

const DEFAULT_ORIGINS_PLACEHOLDER =
  "http://localhost:3003\nhttp://127.0.0.1:3003\nhttps://app.example.com"

export function PublicKeyForm({
  defaultValues,
  isPending,
  onSubmit,
  submitLabel,
  submittingLabel,
}: PublicKeyFormProps) {
  const form = useForm({
    defaultValues: {
      allowedOrigins: formatPublicKeyOrigins(defaultValues.allowedOrigins),
      label: defaultValues.label,
    },
    validators: {
      onChange: captureKeyCreateFormSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit({
        allowedOrigins: parsePublicKeyOrigins(value.allowedOrigins),
        label: value.label,
      })
    },
  })

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        form.handleSubmit()
      }}
    >
      <form.Field name="label">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && field.state.meta.errors.length > 0

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Site label</FieldLabel>
              <Input
                aria-invalid={isInvalid}
                id={field.name}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="app-prod"
                value={field.state.value}
              />
              {isInvalid ? (
                <FieldError errors={field.state.meta.errors} />
              ) : null}
            </Field>
          )
        }}
      </form.Field>

      <form.Field name="allowedOrigins">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && field.state.meta.errors.length > 0

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Allowed origins</FieldLabel>
              <Textarea
                aria-invalid={isInvalid}
                className="min-h-32 resize-y"
                id={field.name}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder={DEFAULT_ORIGINS_PLACEHOLDER}
                value={field.state.value}
              />
              {isInvalid ? (
                <FieldError errors={field.state.meta.errors} />
              ) : null}
              <p className="text-muted-foreground text-xs">
                <strong>Leave empty</strong> to allow captures from any domain
                (recommended for QA and the Chrome extension). Otherwise, one
                origin per line — the <strong>website</strong> where you record
                (e.g. <code className="text-xs">https://stage.spotting.dev</code>
                ), not the API (
                <code className="text-xs">:3000</code>).
              </p>
            </Field>
          )
        }}
      </form.Field>

      <div className="flex justify-end">
        <Button disabled={isPending || form.state.isSubmitting} type="submit">
          {isPending || form.state.isSubmitting ? submittingLabel : submitLabel}
        </Button>
      </div>
    </form>
  )
}
