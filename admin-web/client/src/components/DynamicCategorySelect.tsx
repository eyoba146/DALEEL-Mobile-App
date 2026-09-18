import React, { useState } from 'react';
import { Plus, Check, X, Tag } from 'lucide-react';

interface DynamicCategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  categories: string[];
  onAddNewCategory: (newCat: string) => string;
  label?: string;
  style?: React.CSSProperties;
}

export const DynamicCategorySelect: React.FC<DynamicCategorySelectProps> = ({
  value,
  onChange,
  categories,
  onAddNewCategory,
  label = 'Category',
  style,
}) => {
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [customName, setCustomName] = useState('');

  const handleCreate = () => {
    const trimmed = customName.trim();
    if (!trimmed) {
      setIsCreatingNew(false);
      return;
    }
    const created = onAddNewCategory(trimmed);
    onChange(created || trimmed);
    setCustomName('');
    setIsCreatingNew(false);
  };

  if (isCreatingNew) {
    return (
      <div style={styles.createBox}>
        <div style={styles.createHeader}>
          <Tag size={13} color="#DFB76C" />
          <span style={styles.createTitle}>New Custom {label}</span>
        </div>
        <div style={styles.createRow}>
          <input
            type="text"
            autoFocus
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCreate();
              } else if (e.key === 'Escape') {
                setIsCreatingNew(false);
                setCustomName('');
              }
            }}
            placeholder={`Enter new ${label.toLowerCase()} name...`}
            style={styles.input}
          />
          <button
            type="button"
            onClick={handleCreate}
            style={styles.saveBtn}
            title="Confirm"
          >
            <Check size={14} color="#07152B" />
            <span>Add</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsCreatingNew(false);
              setCustomName('');
            }}
            style={styles.cancelBtn}
            title="Cancel"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', ...style }}>
      <select
        value={value}
        onChange={(e) => {
          if (e.target.value === '__add_new__') {
            setIsCreatingNew(true);
          } else {
            onChange(e.target.value);
          }
        }}
        style={styles.select}
      >
        {/* If the current value is not in categories yet, display it as an option */}
        {value && !categories.includes(value) && (
          <option value={value}>{value}</option>
        )}
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
        <option value="__add_new__" style={{ fontWeight: 700, color: '#9C6F19' }}>
          + Create New {label}...
        </option>
      </select>

      <button
        type="button"
        style={styles.quickAddBtn}
        onClick={() => setIsCreatingNew(true)}
        title={`Add new dynamic ${label.toLowerCase()}`}
      >
        <Plus size={14} color="#07152B" />
        <span>New</span>
      </button>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  select: {
    flex: 1,
    width: '100%',
    padding: '10px 14px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '8px',
    fontSize: '13.5px',
    color: '#07152B',
    outline: 'none',
  },
  quickAddBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '10px 14px',
    backgroundColor: '#F0F3F8',
    border: '1px solid #E4E9F0',
    borderRadius: '8px',
    fontSize: '12.5px',
    fontWeight: 700,
    color: '#07152B',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
  },
  createBox: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #DFB76C',
    borderRadius: '8px',
    padding: '8px 12px',
    boxShadow: '0 2px 10px rgba(223, 183, 108, 0.2)',
  },
  createHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '6px',
  },
  createTitle: {
    fontSize: '11.5px',
    fontWeight: 700,
    color: '#9C6F19',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  createRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#07152B',
    outline: 'none',
  },
  saveBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 12px',
    backgroundColor: '#DFB76C',
    color: '#07152B',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12.5px',
    fontWeight: 750,
    cursor: 'pointer',
  },
  cancelBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    backgroundColor: '#F1F5F9',
    border: 'none',
    borderRadius: '6px',
    color: '#64748B',
    cursor: 'pointer',
  },
};
