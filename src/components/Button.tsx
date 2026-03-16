interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
  type?: 'button' | 'submit';
}

export function Button({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  fullWidth = false,
  type = 'button',
}: ButtonProps) {
  const base =
    'px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-accent text-white hover:bg-accent-hover active:scale-[0.98] shadow-lg shadow-accent/20',
    secondary:
      'border border-accent text-accent hover:bg-accent-muted active:scale-[0.98]',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''}`}
    >
      {children}
    </button>
  );
}
