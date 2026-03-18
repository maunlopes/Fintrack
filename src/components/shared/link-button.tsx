import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { VariantProps } from "class-variance-authority";

interface LinkButtonProps extends VariantProps<typeof buttonVariants> {
  href: string;
  className?: string;
  children: React.ReactNode;
  title?: string;
}

export function LinkButton({ href, variant, size, className, children, title }: LinkButtonProps) {
  return (
    <Link href={href} title={title} className={cn(buttonVariants({ variant, size }), "cursor-pointer", className)}>
      {children}
    </Link>
  );
}
