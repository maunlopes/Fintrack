"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollText, Filter } from "lucide-react";
import { formatDate } from "@/lib/format";

interface LogEntry {
  id: string;
  action: string;
  userId: string;
  userName: string;
  userEmail: string;
  details: string | null;
  createdAt: string;
}

interface LogsResponse {
  logs: LogEntry[];
  total: number;
  page: number;
  totalPages: number;
}

const ACTION_OPTIONS = [
  { value: "ALL", label: "Todas as acoes" },
  { value: "LOGIN", label: "Login" },
  { value: "LOGOUT", label: "Logout" },
  { value: "UPLOAD_IMAGE", label: "Upload de imagem" },
  { value: "CREATE_NOTIFICATION", label: "Criar notificacao" },
  { value: "UPDATE_NOTIFICATION", label: "Atualizar notificacao" },
  { value: "DELETE_NOTIFICATION", label: "Excluir notificacao" },
  { value: "UPDATE_BRANDING", label: "Atualizar marca" },
  { value: "UPDATE_SETTINGS", label: "Atualizar config." },
  { value: "CREATE_USER", label: "Criar usuario" },
  { value: "UPDATE_USER", label: "Atualizar usuario" },
  { value: "DELETE_USER", label: "Excluir usuario" },
];

export default function LogsAdminPage() {
  const [data, setData] = useState<LogsResponse>({
    logs: [],
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("ALL");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (actionFilter !== "ALL") params.set("action", actionFilter);

      const res = await fetch(`/api/admin/logs?${params.toString()}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData(json);
    } catch {
      toast.error("Erro ao carregar logs");
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  function handleFilterChange(value: string | null) {
    setActionFilter(value ?? "ALL");
    setPage(1);
  }

  function truncateJson(raw: string | null, maxLen = 80): string {
    if (!raw) return "—";
    try {
      const str = typeof raw === "string" ? raw : JSON.stringify(raw);
      return str.length > maxLen ? str.slice(0, maxLen) + "..." : str;
    } catch {
      return "—";
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <ScrollText className="size-6" />
        Logs de Atividade
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="size-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <Select value={actionFilter} onValueChange={handleFilterChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-muted-foreground">Carregando...</p>
          ) : data.logs.length === 0 ? (
            <p className="p-6 text-center text-muted-foreground">
              Nenhum log encontrado.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Acao</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {formatDate(log.createdAt, "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{log.userName}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.userEmail}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{log.action}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <span className="text-xs text-muted-foreground font-mono">
                        {truncateJson(log.details)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Paginacao */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Pagina {data.page} de {data.totalPages} ({data.total} registros)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Proximo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
