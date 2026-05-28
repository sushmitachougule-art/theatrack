"use client";

import { Expense, ExpenseCategory } from "@/types";
import { CATEGORY_ICONS, CATEGORY_LABELS } from "@/hooks/useExpenses";
import { Trash2 } from "lucide-react";

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
}

export function ExpenseList({ expenses, onDelete }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="expense-list__empty">
        <p>No expenses logged yet.</p>
        <p>Tap &quot;+ Add&quot; to start tracking spending.</p>
      </div>
    );
  }

  // Group by month
  const grouped: Record<string, Expense[]> = {};
  for (const exp of expenses) {
    const month = exp.date.slice(0, 7);
    if (!grouped[month]) grouped[month] = [];
    grouped[month].push(exp);
  }

  const formatMonth = (key: string) => {
    const [y, m] = key.split("-");
    const date = new Date(Number(y), Number(m) - 1);
    return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  };

  return (
    <div className="expense-list">
      {Object.entries(grouped).map(([month, items]) => (
        <div key={month} className="expense-list__group">
          <h4 className="expense-list__month">{formatMonth(month)}</h4>
          {items.map((exp) => (
            <ExpenseRow key={exp.id} expense={exp} onDelete={onDelete} />
          ))}
        </div>
      ))}
    </div>
  );
}

function ExpenseRow({
  expense,
  onDelete,
}: {
  expense: Expense;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="expense-row">
      <div className="expense-row__icon">
        {CATEGORY_ICONS[expense.category as ExpenseCategory]}
      </div>
      <div className="expense-row__info">
        <span className="expense-row__desc">{expense.description}</span>
        <span className="expense-row__meta">
          {CATEGORY_LABELS[expense.category as ExpenseCategory]} ·{" "}
          {expense.dogName} ·{" "}
          {new Date(expense.date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })}
        </span>
      </div>
      <div className="expense-row__amount">
        ₹{expense.amount.toLocaleString("en-IN")}
      </div>
      <button
        className="expense-row__delete"
        onClick={() => {
          if (confirm("Delete this expense?")) onDelete(expense.id);
        }}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
