import { LabelHTMLAttributes, ReactNode } from 'react';

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
  isRequired?: boolean;
}

export const Label = ({ children, isRequired = false }: LabelProps) => {
  return (
    <label className="text-sm text-zinc-500">
      {children}
      {isRequired && <span className="text-red-500 pl-[4px]">*</span>}
    </label>
  );
};
