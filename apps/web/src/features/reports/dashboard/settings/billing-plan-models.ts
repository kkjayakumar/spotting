export type SpottingBillingPlan = "free" | "pro" | "studio"
export type UpgradablePlan = "pro" | "studio"
export type BillingCadence = "monthly" | "yearly"

export type PlanLimitMatrix = Record<
  SpottingBillingPlan,
  {
    monthlyPriceUsd: number
    yearlyPriceUsd: number
    canUploadVideo: boolean
    maxVideoDurationMs: number | null
    memberCap: number | null
  }
>

export interface BillingOverviewProps {
  billing: {
    cancelAtPeriodEnd: boolean
    currentPeriodEnd: string | Date | null
    currentPeriodStart: string | Date | null
    limits: PlanLimitMatrix | null
    memberCap: number | null
    memberCount: number
    plan: SpottingBillingPlan
    subscriptionStatus: string
  }
  canManageBilling: boolean
  organizationId: string
}

export interface UpgradePlanChoice {
  slug: UpgradablePlan
  description: string
  prices: {
    monthlyPriceUsd: number
    yearlyPriceUsd: number
  }
}

export interface BillingSnapshot {
  cancelAtPeriodEnd: boolean
  currentBillingInterval: BillingCadence | null
  currentPeriodEnd: string | Date | null
  memberCap: number | null
  memberCount: number
  plan: SpottingBillingPlan
  proMemberCap: number
  subscriptionStatus: string
}

export interface BillingPriceSnapshot {
  currentPlanMonthlyPrice: number
  currentPlanYearlyPrice: number
}

export interface PlanCardContext {
  billingInterval: BillingCadence
  canManageBilling: boolean
  currentBillingInterval: BillingCadence | null
  currentPlan: SpottingBillingPlan
  isPlanSelectionLocked: boolean
  isMutating: boolean
}

/** @deprecated Use SpottingBillingPlan */
export type BillingPlan = SpottingBillingPlan

/** @deprecated Use UpgradablePlan */
export type SwitchablePlan = UpgradablePlan

/** @deprecated Use BillingCadence */
export type BillingInterval = BillingCadence

/** @deprecated Use PlanLimitMatrix */
export type BillingPlanLimits = PlanLimitMatrix

/** @deprecated Use BillingOverviewProps */
export type OrganizationBillingCardProps = BillingOverviewProps

/** @deprecated Use UpgradePlanChoice */
export type PlanOption = UpgradePlanChoice

/** @deprecated Use BillingSnapshot */
export type BillingSummarySnapshot = BillingSnapshot

/** @deprecated Use BillingPriceSnapshot */
export type BillingSummaryPricing = BillingPriceSnapshot

/** @deprecated Use PlanCardContext */
export type PlanOptionCardContext = PlanCardContext
