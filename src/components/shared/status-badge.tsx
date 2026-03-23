import { Badge } from "@/components/ui/badge";
import { PaymentStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

const statusConfig: Record<PaymentStatus, { label: string; className: string }> = {
  PENDING: { label: "Pendente", className: "bg-warning/15 text-warning border-warning/30" },
  PAID: { label: "Pago", className: "bg-success/15 text-success border-success/30" },
  OVERDUE: { label: "Atrasado", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

export function StatusBadge({ status, type = "expense" }: { status: PaymentStatus, type?: "income" | "expense" }) {
  let label = statusConfig[status].label;
  let className = statusConfig[status].className;

  if (type === "income" && status === "PAID") {
    label = "Recebido";
  }

  return (
    <Badge variant="outline" className={cn("text-xs gap-1", className)}>
      {status === "OVERDUE" && <AlertCircle className="size-3 animate-pulse" />}
      {label}
    </Badge>
  );
}
