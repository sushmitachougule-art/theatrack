"use client";

import { useState, FormEvent } from "react";
import { Dog, ExpenseCategory } from "@/types";
import { CATEGORY_LABELS, CATEGORY_ICONS } from "@/hooks/useExpenses";
import { X } from "lucide-react";

interface ExpenseFormProps {
  dogs: Dog[];
  onSubmit: (data: {
    dogId: string;
    dogName: string;
    category: ExpenseCategory;
    amount: number;
    description: string;
    date: string;
  }) => void;
  onCancel: () => void;
}

export function ExpenseForm({ dogs, onSubmit, onCancel }: ExpenseFormProps) {
  const [dogId, setDogId] = useState(dogs[0]?.id ?? "");
  const [category, setCategory] = useState<ExpenseCategory>("vet");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const selectedDog = dogs.find((d) => d.id === dogId);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedDog || !amount || !description.trim()) return;
    const numAmount = Math.round(parseFloat(amount) * 100) / 100;
    if (numAmount <= 0 || isNaN(numAmount)) return;
    onSubmit({
      dogId: selectedDog.id,
      dogName: selectedDog.name,
      category,
      amount: numAmount,
      description: description.trim(),
      date,
    });
  };

  return (
    <div className="expense-form">
      <div className="expense-form__header">
        <h3>Add Expense</h3>
        <button className="expense-form__close" onClick={onCancel}>
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="expense-form__body">
        <div className="expense-form__field">
          <label className="expense-form__label">Dog</label>
          <select
            className="expense-form__select"
            value={dogId}
            onChange={(e) => setDogId(e.target.value)}
          >
            {dogs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="expense-form__field">
          <label className="expense-form__label">Category</label>
          <div className="expense-form__categories">
            {(Object.keys(CATEGORY_LABELS) as ExpenseCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                className={`expense-form__cat-btn ${category === cat ? "expense-form__cat-btn--active" : ""}`}
                onClick={() => setCategory(cat)}
              >
                <span>{CATEGORY_ICONS[cat]}</span>
                <span>{CATEGORY_LABELS[cat]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="expense-form__row">
          <div className="expense-form__field expense-form__field--half">
            <label className="expense-form__label">Amount (₹)</label>
            <input
              type="number"
              className="expense-form__input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </div>
          <div className="expense-form__field expense-form__field--half">
            <label className="expense-form__label">Date</label>
            <input
              type="date"
              className="expense-form__input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              required
            />
          </div>
        </div>

        <div className="expense-form__field">
          <label className="expense-form__label">Description</label>
          <input
            type="text"
            className="expense-form__input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Annual vaccination"
            maxLength={100}
            required
          />
        </div>

        <button type="submit" className="expense-form__submit">
          Save Expense
        </button>
      </form>
    </div>
  );
}
