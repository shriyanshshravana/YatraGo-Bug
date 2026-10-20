import { useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { makeId } from '../utils/storage';

export default function TodoList({ items = [], onChange }) {
  const [text, setText] = useState('');
  const done = items.filter((i) => i.done).length;

  const getItemId = (item) => item._id || item.id;

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">YOUR LITTLE CHECKLIST</span>
          <h3>Things to remember</h3>
        </div>
        <span className="count-pill">
          {done}/{items.length}
        </span>
      </div>

      {items.length > 0 && (
        <div className="progress-track">
          <span style={{ width: `${(done / items.length) * 100}%` }} />
        </div>
      )}

      <div className="todo-items">
        {items.map((i) => {
          const itemId = getItemId(i);
          return (
            <div className={`todo-row ${i.done ? 'is-done' : ''}`} key={itemId}>
              <button
                className="check-button"
                onClick={() =>
                  onChange(
                    items.map((t) =>
                      getItemId(t) === itemId ? { ...t, done: !t.done } : t
                    )
                  )
                }
                aria-label="Toggle complete"
              >
                {i.done && <Check size={14} />}
              </button>
              <span>{i.text}</span>
              <button
                className="delete-small"
                onClick={() => onChange(items.filter((t) => getItemId(t) !== itemId))}
                aria-label="Delete"
              >
                <Trash2 size={15} />
              </button>
            </div>
          );
        })}
      </div>

      <form
        className="add-todo"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) {
            onChange([...items, { id: makeId(), text: text.trim(), done: false }]);
            setText('');
          }
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a reminder..."
        />
        <button className="button button-dark button-small">
          <Plus size={16} /> Add
        </button>
      </form>
    </section>
  );
}
