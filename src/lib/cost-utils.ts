// Cost category color mapping for badges (Tailwind classes)
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    Labor: 'bg-purple-100 text-purple-700 border-purple-200',
    Materials: 'bg-amber-100 text-amber-700 border-amber-200',
    Vendors: 'bg-blue-100 text-blue-700 border-blue-200',
    Travel: 'bg-green-100 text-green-700 border-green-200',
    Software: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    Other: 'bg-gray-100 text-gray-700 border-gray-200',
  }
  return colors[category] || colors.Other
}

// Calculate total costs from cost array
export function calculateTotalCosts(costs: { amount: number }[]): number {
  return costs.reduce((sum, cost) => sum + Number(cost.amount), 0)
}

// Calculate profit (revenue minus costs)
export function calculateProfit(revenue: number | null, totalCosts: number): number {
  return (revenue || 0) - totalCosts
}
