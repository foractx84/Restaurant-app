export enum PaymentPlan {
  MONTHLY = 'monthly',
  ANNUALLY = 'annually',
  ONE_TIME = 'one-time',
}

export enum PaymentPlanMapper {
  month = PaymentPlan.MONTHLY,
  year = PaymentPlan.ANNUALLY,
}
