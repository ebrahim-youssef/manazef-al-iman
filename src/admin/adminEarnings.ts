export type EarningsTotal = {
  totalEgp: number
  orderCount: number
}

export type EarningsSummary = {
  today: EarningsTotal
  week: EarningsTotal
  month: EarningsTotal
}
