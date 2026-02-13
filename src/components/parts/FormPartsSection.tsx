/**
 * Form Parts Section Component
 *
 * Shows parts tracking for a single completed form
 * Allows adding/removing parts with name and quantity
 */

'use client';

import { useState } from 'react';
import { PartEntry } from './PartEntry';

interface Part {
  id: string; // Temporary client-side ID
  partName: string;
  quantity: number;
}

interface FormPartsSectionProps {
  formId: number;
  formType: string;
  formLabel: string;
  formIcon: string;
  category?: string; // For maintenance forms
  initialParts?: Part[];
  onChange: (parts: Part[]) => void;
  disabled?: boolean;
}

export function FormPartsSection({
  formId,
  formType,
  formLabel,
  formIcon,
  category,
  initialParts = [],
  onChange,
  disabled = false,
}: FormPartsSectionProps) {
  const [parts, setParts] = useState<Part[]>(
    initialParts.length > 0
      ? initialParts
      : [{ id: crypto.randomUUID(), partName: '', quantity: 1 }]
  );

  const handleAddPart = () => {
    const newParts = [
      ...parts,
      { id: crypto.randomUUID(), partName: '', quantity: 1 },
    ];
    setParts(newParts);
    onChange(newParts);
  };

  const handleDeletePart = (id: string) => {
    if (parts.length === 1) {
      // Keep at least one empty part entry
      const newParts = [{ id: crypto.randomUUID(), partName: '', quantity: 1 }];
      setParts(newParts);
      onChange(newParts);
    } else {
      const newParts = parts.filter((part) => part.id !== id);
      setParts(newParts);
      onChange(newParts);
    }
  };

  const handlePartNameChange = (id: string, value: string) => {
    const newParts = parts.map((part) =>
      part.id === id ? { ...part, partName: value } : part
    );
    setParts(newParts);
    onChange(newParts);
  };

  const handleQuantityChange = (id: string, value: number) => {
    const newParts = parts.map((part) =>
      part.id === id ? { ...part, quantity: value } : part
    );
    setParts(newParts);
    onChange(newParts);
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      {/* Form Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{formIcon}</span>
        <div>
          <h4 className="font-medium text-gray-900">{formLabel}</h4>
          {category && (
            <p className="text-sm text-gray-600">{category}</p>
          )}
        </div>
      </div>

      {/* Parts Entries */}
      <div className="space-y-3 mb-3">
        {parts.map((part) => (
          <PartEntry
            key={part.id}
            partName={part.partName}
            quantity={part.quantity}
            onPartNameChange={(value) => handlePartNameChange(part.id, value)}
            onQuantityChange={(value) => handleQuantityChange(part.id, value)}
            onDelete={() => handleDeletePart(part.id)}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Add Another Part Button */}
      <button
        type="button"
        onClick={handleAddPart}
        disabled={disabled}
        className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        + Add Another Part
      </button>
    </div>
  );
}
