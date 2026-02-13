/**
 * Part Entry Component
 *
 * Single part input row with part name, quantity, and delete button
 */

'use client';

interface PartEntryProps {
  partName: string;
  quantity: number;
  onPartNameChange: (value: string) => void;
  onQuantityChange: (value: number) => void;
  onDelete: () => void;
  disabled?: boolean;
}

export function PartEntry({
  partName,
  quantity,
  onPartNameChange,
  onQuantityChange,
  onDelete,
  disabled = false,
}: PartEntryProps) {
  return (
    <div className="flex gap-3 items-start">
      {/* Part Name */}
      <div className="flex-1">
        <input
          type="text"
          value={partName}
          onChange={(e) => onPartNameChange(e.target.value)}
          placeholder="Part name or SKU"
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      {/* Quantity */}
      <div className="w-24">
        <input
          type="number"
          value={quantity}
          onChange={(e) => onQuantityChange(parseInt(e.target.value, 10) || 1)}
          min="1"
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      {/* Delete Button */}
      <button
        type="button"
        onClick={onDelete}
        disabled={disabled}
        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Delete part"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  );
}
