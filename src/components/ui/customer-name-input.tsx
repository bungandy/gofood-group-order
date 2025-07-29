import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, Edit2 } from 'lucide-react';

interface CustomerNameInputProps {
  value: string;
  onConfirm: (name: string) => void;
}

export const CustomerNameInput: React.FC<CustomerNameInputProps> = ({
  value,
  onConfirm
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isEditing, setIsEditing] = useState(!value);

  const handleConfirm = () => {
    onConfirm(localValue);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setLocalValue(value);
    setIsEditing(true);
  };

  if (isEditing) {
    return (
      <div className="flex gap-2">
        <Input 
          id="customer-name" 
          placeholder="Masukkan nama Anda" 
          value={localValue} 
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
        />
        <Button 
          onClick={handleConfirm}
          size="sm"
          disabled={!localValue.trim()}
        >
          <Check className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Input 
        id="customer-name" 
        value={value} 
        readOnly
        className="cursor-default"
      />
      <Button 
        onClick={handleEdit}
        variant="outline"
        size="sm"
      >
        <Edit2 className="w-4 h-4" />
      </Button>
    </div>
  );
};