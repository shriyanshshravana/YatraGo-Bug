import { useState } from 'react';
import { IndianRupee, Plus, Trash2 } from 'lucide-react';
import { makeId } from '../utils/storage';

export default function BudgetTracker({ budget = 0, expenses = [], onChange }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');

  const getItemId = (item) => item._id || item.id;

  const spent = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const left = spent - Number(budget || 0);

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">KEEP IT ON TRACK</span>
          <h3>Budget snapshot</h3>
        </div>
        <span className="budget-icon">
          <IndianRupee size={18} />
        </span>
      </div>

      <div className="budget-summary">
        <div>
          <span>Planned budget</span>
          <strong>₹{Number(budget || 0).toLocaleString('en-IN')}</strong>
        </div>
        <div>
          <span>Spent so far</span>
          <strong>₹{spent.toLocaleString('en-IN')}</strong>
        </div>
      </div>

      <div className="budget-remaining">
        <span>Remaining</span>
        <strong className={left < 0 ? 'over-budget' : ''}>
          ₹{left.toLocaleString('en-IN')}
        </strong>
      </div>

      <div className="budget-track">
        <span
          className={left < 0 ? 'over' : ''}
          style={{ width: `${budget > 0 ? Math.min(100, (spent / budget) * 100) : 0}%` }}
        />
      </div>

      <form
        className="expense-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim() && Number(amount) > 0) {
            onChange([
              ...expenses,
              { id: makeId(), title: title.trim(), amount: Number(amount) },
            ]);
            setTitle('');
            setAmount('');
          }
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Expense (e.g. train)"
        />
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          min="1"
          placeholder="₹ Amount"
        />
        <button className="button button-dark button-small">
          <Plus size={16} />
        </button>
      </form>

      <div className="expense-list">
        {expenses.map((e) => {
          const expenseId = getItemId(e);
          return (
            <div className="expense-row" key={expenseId}>
              <span>{e.title}</span>
              <strong>₹{Number(e.amount).toLocaleString('en-IN')}</strong>
              <button
                onClick={() => onChange(expenses.filter((x) => getItemId(x) !== expenseId))}
                aria-label="Remove expense"
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
