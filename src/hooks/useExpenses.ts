"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "./useAuth";
import { useDogs } from "./useDogs";
import {
  createExpense,
  deleteExpense,
  updateExpense,
  subscribeToExpenses,
} from "@/lib/repositories";
import { Expense, ExpenseCategory, ExpenseSummary } from "@/types";
import toast from "react-hot-toast";

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  vet: "Vet",
  food: "Food",
  toys: "Toys",
  grooming: "Grooming",
  insurance: "Insurance",
  training: "Training",
  accessories: "Accessories",
  boarding: "Boarding",
  other: "Other",
};

const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  vet: "🏥",
  food: "🍖",
  toys: "🧸",
  grooming: "✂️",
  insurance: "🛡️",
  training: "🎓",
  accessories: "🦮",
  boarding: "🏠",
  other: "📦",
};

export { CATEGORY_LABELS, CATEGORY_ICONS };

export function useExpenses() {
  const { user } = useAuth();
  const { dogs } = useDogs();
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDogId, setSelectedDogId] = useState<string>("all");

  const loading = user ? expenses === null && !error : false;

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToExpenses(
      user.uid,
      (data) => {
        setExpenses(data);
        setError(null);
      },
      100,
      (err) => {
        console.error("Expenses subscription error:", err);
        setError("Unable to load expenses. Please try again.");
        setExpenses([]);
      },
    );
    return () => {
      unsub();
      setExpenses(null);
    };
  }, [user]);

  // Filter by dog
  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    if (selectedDogId === "all") return expenses;
    return expenses.filter((e) => e.dogId === selectedDogId);
  }, [expenses, selectedDogId]);

  // Summary calculations
  const summary: ExpenseSummary = useMemo(() => {
    const byCategory = {} as Record<ExpenseCategory, number>;
    const byMonth = {} as Record<string, number>;
    let totalAmount = 0;

    for (const cat of Object.keys(CATEGORY_LABELS) as ExpenseCategory[]) {
      byCategory[cat] = 0;
    }

    for (const exp of filteredExpenses) {
      totalAmount += exp.amount;
      byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount;
      const month = exp.date.slice(0, 7); // "2026-05"
      byMonth[month] = (byMonth[month] || 0) + exp.amount;
    }

    return { totalAmount, byCategory, byMonth };
  }, [filteredExpenses]);

  // Current month total
  const currentMonthTotal = useMemo(() => {
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return summary.byMonth[key] || 0;
  }, [summary]);

  const addExpense = useCallback(
    async (data: {
      dogId: string;
      dogName: string;
      category: ExpenseCategory;
      amount: number;
      description: string;
      date: string;
    }) => {
      if (!user) return;
      try {
        await createExpense({
          ownerId: user.uid,
          dogId: data.dogId,
          dogName: data.dogName,
          category: data.category,
          amount: data.amount,
          currency: "INR",
          description: data.description,
          date: data.date,
        });
        toast.success("Expense logged ✓");
      } catch (err) {
        console.error("Failed to create expense:", err);
        toast.error("Failed to save expense.");
      }
    },
    [user],
  );

  const removeExpense = useCallback(async (expenseId: string) => {
    try {
      await deleteExpense(expenseId);
      toast.success("Expense deleted");
    } catch (err) {
      console.error("Failed to delete expense:", err);
      toast.error("Failed to delete.");
    }
  }, []);

  const editExpense = useCallback(
    async (
      expenseId: string,
      data: Partial<
        Pick<Expense, "category" | "amount" | "description" | "date">
      >,
    ) => {
      try {
        await updateExpense(expenseId, data);
        toast.success("Updated ✓");
      } catch (err) {
        console.error("Failed to update expense:", err);
        toast.error("Failed to update.");
      }
    },
    [],
  );

  return {
    dogs,
    expenses: filteredExpenses,
    allExpenses: expenses ?? [],
    loading,
    error,
    selectedDogId,
    setSelectedDogId,
    summary,
    currentMonthTotal,
    addExpense,
    removeExpense,
    editExpense,
  };
}
