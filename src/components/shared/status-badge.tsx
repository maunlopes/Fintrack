import { PaymentStatus } from "@prisma/client";

export function StatusBadge({ status, type = "expense" }: { status: PaymentStatus; type?: "income" | "expense" }) {
  if (status === "PAID") {
    return (
      <span className="badge--pos">
        {type === "income" ? "Recebido" : "Pago"}
      </span>
    );
  }
  if (status === "OVERDUE") {
    return <span className="badge--neg">Atrasado</span>;
  }
  return <span className="badge--warn">Pendente</span>;
}
