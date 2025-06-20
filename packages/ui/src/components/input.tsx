'use client';

import { cn } from '@workspace/ui/lib/utils';
import { ComponentProps } from 'react';

function Input({ className, type, ...props }: ComponentProps<'input'>) {
  console.log(props);
  return (
    <input
      type={type}
      data-slot="input"
      autoComplete="off"
      className={cn(
        'bg-white h-12 text-zinc-900 placeholder:text-zinc-500 border-zinc-300',
        'w-full min-w-0 rounded-md border px-3 py-1 outline-none',
        'transition-colors duration-200',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'focus:border-[#E9B000] ',
        className
      )}
      {...props}
    />
  );
}

export { Input };
