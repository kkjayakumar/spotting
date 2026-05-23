"use client"

import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { client, queryClient } from "@/utils/orpc"

export function usePublicKeyActions(organizationId: string) {
  const createMutation = useMutation({
    mutationFn: async (input: { label: string; allowedOrigins: string[] }) =>
      client.captureKey.create({ organizationId, ...input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["captureKey.list", organizationId],
      })
      toast.success("Public key created")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create public key")
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (input: {
      keyId: string
      label: string
      allowedOrigins: string[]
    }) => client.captureKey.update({ organizationId, ...input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["captureKey.list", organizationId],
      })
      toast.success("Public key updated")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update public key")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (input: { keyId: string }) =>
      client.captureKey.delete({ organizationId, ...input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["captureKey.list", organizationId],
      })
      toast.success("Public key deleted")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete public key")
    },
  })

  const rotateMutation = useMutation({
    mutationFn: async (input: { keyId: string }) =>
      client.captureKey.rotate({ organizationId, ...input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["captureKey.list", organizationId],
      })
      toast.success("Public key rotated")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to rotate public key")
    },
  })

  const revokeMutation = useMutation({
    mutationFn: async (input: { keyId: string }) =>
      client.captureKey.revoke({ organizationId, ...input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["captureKey.list", organizationId],
      })
      toast.success("Public key revoked")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to revoke public key")
    },
  })

  return {
    createMutation,
    deleteMutation,
    revokeMutation,
    rotateMutation,
    updateMutation,
  }
}
