import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function Button({ children, className, type = "button", ...props }: ButtonProps) {
  const classes = ["dce-button", className].filter(Boolean).join(" ");
  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
