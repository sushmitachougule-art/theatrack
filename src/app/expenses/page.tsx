"use client";

import { useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { MonthlySummary } from "@/components/expenses/MonthlySummary";
import { Plus, Wallet } from "lucide-react";

export default function ExpensesPage() {
  const {
    dogs,
    expenses,
    loading,
    error,
    selectedDogId,
    setSelectedDogId,
    summary,
    currentMonthTotal,
    addExpense,
    removeExpense,
  } = useExpenses();

  const [showForm, setShowForm] = useState(false);

  if (loading) {
    return (
      <div className="expenses-page expenses-page--loading">
        <Wallet size={20} className="expenses-page__spinner" />
        Loading expenses...
      </div>
    );
  }

  if (error) {
    return (
      <div className="expenses-page expenses-page--error">
        <Wallet size={24} />
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="expenses-page">
      <div className="expenses-page__header">
        <Wallet size={24} />
        <div className="expenses-page__header-text">
          <h1>Expenses</h1>
          <p>Track dog-related spending</p>
        </div>
      </div>

      {/* Dog filter */}
      {dogs && dogs.length > 1 && (
        <div className="expenses-page__dog-filter">
          <button
            className={`expenses-page__dog-btn ${selectedDogId === "all" ? "expenses-page__dog-btn--active" : ""}`}
            onClick={() => setSelectedDogId("all")}
          >
            All Dogs
          </button>
          {dogs.map((dog) => (
            <button
              key={dog.id}
              className={`expenses-page__dog-btn ${selectedDogId === dog.id ? "expenses-page__dog-btn--active" : ""}`}
              onClick={() => setSelectedDogId(dog.id)}
            >
              {dog.name}
            </button>
          ))}
        </div>
      )}

      {/* Monthly Summary */}
      <MonthlySummary currentMonthTotal={currentMonthTotal} summary={summary} />

      {/* Add button */}
      <button
        className="expenses-page__add-btn"
        onClick={() => setShowForm(true)}
      >
        <Plus size={16} />
        Add Expense
      </button>

      {/* Form */}
      {showForm && dogs && dogs.length > 0 && (
        <ExpenseForm
          dogs={dogs}
          onSubmit={async (data) => {
            await addExpense(data);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Expense List */}
      {expenses.length === 0 && !showForm ? (
        <div className="expenses-page__empty">
          <p>
            No expenses yet. Tap &quot;Add Expense&quot; to start tracking! 💰
          </p>
        </div>
      ) : (
        <ExpenseList expenses={expenses} onDelete={removeExpense} />
      )}
    </div>
  );
}
