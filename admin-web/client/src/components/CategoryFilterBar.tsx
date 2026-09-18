import React, { useState } from 'react';
import { Plus, Check, X, Tag } from 'lucide-react';

interface CategoryFilterBarProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onAddCategory: (newCat: string) => void;
  label?: string;
  allLabel?: string;
}

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  onAddCategory,
  label = 'Category',
  allLabel = 'All',
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const handleCreate = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) {
      setIsAdding(false);
      return;
    }
    onAddCategory(trimmed);
    onSelectCategory(trimmed);
    setNewCatName('');
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleCreate();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewCatName('');
    }
  };

  return (
    <div style={styles.container}>
      {/* "All" chip */}
      <button
        type="button"
        style={{
          ...styles.chip,
          ...(selectedCategory === allLabel ? styles.chipActive : {}),
        }}
        onClick={() => onSelectCategory(allLabel)}
      >
        {allLabel}
      </button>

      {/* Dynamic Categories */}
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          style={{
            ...styles.chip,
            ...(selectedCategory === cat ? styles.chipActive : {}),
          }}
          onClick={() => onSelectCategory(cat)}
        >
          {cat}
        </button>
      ))}

      {/* Dynamic Inline + Add Category */}
      {isAdding ? (
        <div style={styles.inlineInputWrap}>
          <Tag size={12} color="#DFB76C" />
          <input
            type="text"
            autoFocus
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`New ${label.toLowerCase()}...`}
            style={styles.inlineInput}
          />
          <button
            type="button"
            onClick={handleCreate}
            style={styles.inlineActionBtn}
            title="Add Category"
          >
            <Check size={12} color="#16803C" />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false);
              setNewCatName('');
            }}
            style={styles.inlineActionBtn}
            title="Cancel"
          >
            <X size={12} color="#5A687A" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          style={styles.addBtn}
          onClick={() => setIsAdding(true)}
          title={`Create new dynamic ${label.toLowerCase()}`}
        >
          <Plus size={12} color="#C59B43" />
          <span>Add {label}</span>
        </button>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  chip: {
    padding: '6px 14px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 600,
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    color: '#5A687A',
    cursor: 'pointer',
    transition: 'all 0.16s ease',
  },
  chipActive: {
    backgroundColor: '#07152B',
    borderColor: '#07152B',
    color: '#FFFFFF',
    fontWeight: 700,
    boxShadow: '0 2px 8px rgba(7, 21, 43, 0.15)',
  },
  addBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '5px 12px',
    borderRadius: '9999px',
    fontSize: '11.5px',
    fontWeight: 700,
    backgroundColor: 'rgba(223, 183, 108, 0.12)',
    border: '1px dashed #DFB76C',
    color: '#9C6F19',
    cursor: 'pointer',
    transition: 'all 0.16s ease',
  },
  inlineInputWrap: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #DFB76C',
    borderRadius: '9999px',
    padding: '3px 8px',
    boxShadow: '0 2px 10px rgba(223, 183, 108, 0.25)',
  },
  inlineInput: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: '12px',
    fontWeight: 600,
    color: '#07152B',
    width: '130px',
    padding: '2px 4px',
  },
  inlineActionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#F0F4FA',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    transition: 'background-color 0.15s ease',
  },
};
