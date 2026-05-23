export type PublicKeyItem = {
  id: string
  label: string
  key: string
  allowedOrigins: string[]
  status: string
  createdAt: string
}

export type PublicKeysSnapshot = PublicKeyItem[]
