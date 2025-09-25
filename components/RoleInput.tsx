
import React from 'react';

interface RoleInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  icon: React.ReactNode;
}

const RoleInput: React.FC<RoleInputProps> = ({ id, label, value, onChange, placeholder, icon }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-bold uppercase tracking-widest text-[var(--primary-color)]/80 mb-1">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-[var(--primary-color)]/60">
          {icon}
        </div>
        <input
          type="text"
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-black/50 border border-[var(--panel-border)] p-2 pl-8 focus:outline-none focus:ring-1 focus:ring-[var(--glow-color)] focus:border-[var(--glow-color)] transition duration-200"
        />
      </div>
    </div>
  );
};

export default RoleInput;
