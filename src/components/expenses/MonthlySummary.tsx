"use client";

import { ExpenseSummary, ExpenseCategory } from "@/types";
import { CATEGORY_ICONS, CATEGORY_LABELS } from "@/hooks/useExpenses";

interface MonthlySummaryProps {
  currentMonthTotal: number;
  summary: ExpenseSummary;
}

export function MonthlySummary({
  currentMonthTotal,
  summary,
}: MonthlySummaryProps) {
  // Get top categories sorted by amount
  const topCategories = (
    Object.entries(summary.byCategory) as [ExpenseCategory, number][]
  )
    .filter(([, amt]) => amt > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const maxAmount = topCategories.length > 0 ? topCategories[0][1] : 1;

  return (
    <div className="expense-summary">
      <div className="expense-summary__total">
        <span className="expense-summary__total-label">This Month</span>
        <span className="expense-summary__total-amount">
          ₹{currentMonthTotal.toLocaleString("en-IN")}
        </span>
      </div>

      {topCategories.length > 0 && (
        <div className="expense-summary__breakdown">
          <h4 className="expense-summary__breakdown-title">By Category</h4>
          {topCategories.map(([cat, amt]) => (
            <div key={cat} className="expense-summary__bar-row">
              <span className="expense-summary__bar-label">
                {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
              </span>
              <div className="expense-summary__bar-track">
                <div
                  className="expense-summary__bar-fill"
                  style={{ width: `${(amt / maxAmount) * 100}%` }}
                />
              </div>
              <span className="expense-summary__bar-amount">
                ₹{amt.toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>
      )}

      {summary.totalAmount > 0 && (
        <div className="expense-summary__all-time">
          All time: ₹{summary.totalAmount.toLocaleString("en-IN")}
        </div>
      )}
    </div>
  );
}
