"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";
import { ChevronLeft, ChevronRight, Search, Shield, ShieldOff } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

function getInitials(name: string | null, email: string) {
  if (name) {
    return name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }
  return email[0].toUpperCase();
}

export default function AdminUsersPage() {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("");
  const [roleChange, setRoleChange] = useState<{
    user: User;
    newRole: "ADMIN" | "USER";
  } | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (search) params.set("search", search);
      if (role) params.set("role", role);
      const res = await fetch(`/api/admin/users?${params}`);
      const json = await res.json();
      setData(json);
    } catch {
      toast.error("Erro ao carregar usu\u00e1rios.");
    } finally {
      setLoading(false);
    }
  }, [page, search, role]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleRoleFilter(value: string) {
    setRole(value === "ALL" ? "" : value);
    setPage(1);
  }

  async function handleRoleChange() {
    if (!roleChange) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/users/${roleChange.user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: roleChange.newRole }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao atualizar role.");
        return;
      }

      toast.success(
        `${roleChange.user.name || roleChange.user.email} agora \u00e9 ${
          roleChange.newRole === "ADMIN" ? "Admin" : "Usu\u00e1rio"
        }.`
      );
      setRoleChange(null);
      fetchUsers();
    } catch {
      toast.error("Erro ao atualizar role.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gerenciamento de Usu\u00e1rios</h1>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            className="pl-9"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <Select onValueChange={(v) => handleRoleFilter(v ?? "ALL")} value={role || "ALL"}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue>
              {role === "ADMIN" ? "Admin" : role === "USER" ? "Usu\u00e1rio" : "Todos"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="USER">Usu\u00e1rio</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Usu\u00e1rios{data ? ` (${data.total})` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !data ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : !data || data.users.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum usu\u00e1rio encontrado.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 font-medium">Usu\u00e1rio</th>
                      <th className="pb-3 font-medium hidden sm:table-cell">Email</th>
                      <th className="pb-3 font-medium">Role</th>
                      <th className="pb-3 font-medium hidden md:table-cell">Cadastro</th>
                      <th className="pb-3 font-medium hidden md:table-cell">\u00daltimo Login</th>
                      <th className="pb-3 font-medium text-right">A\u00e7\u00f5es</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.users.map((user) => (
                      <tr key={user.id} className="group">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <Avatar size="sm">
                              {user.image && <AvatarImage src={user.image} />}
                              <AvatarFallback>
                                {getInitials(user.name, user.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {user.name || "Sem nome"}
                              </span>
                              <span className="text-xs text-muted-foreground sm:hidden">
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 hidden sm:table-cell text-muted-foreground">
                          {user.email}
                        </td>
                        <td className="py-3">
                          <Badge
                            variant={user.role === "ADMIN" ? "default" : "secondary"}
                          >
                            {user.role === "ADMIN" ? "Admin" : "Usu\u00e1rio"}
                          </Badge>
                        </td>
                        <td className="py-3 hidden md:table-cell text-muted-foreground">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="py-3 hidden md:table-cell text-muted-foreground">
                          {user.lastLoginAt ? formatDate(user.lastLoginAt) : "Nunca"}
                        </td>
                        <td className="py-3 text-right">
                          {user.role === "ADMIN" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setRoleChange({ user, newRole: "USER" })
                              }
                            >
                              <ShieldOff className="size-4" />
                              <span className="hidden sm:inline">Rebaixar</span>
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setRoleChange({ user, newRole: "ADMIN" })
                              }
                            >
                              <Shield className="size-4" />
                              <span className="hidden sm:inline">Promover</span>
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    P\u00e1gina {data.page} de {data.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="size-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Pr\u00f3ximo
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!roleChange}
        onOpenChange={(open) => !open && setRoleChange(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar altera\u00e7\u00e3o de role</AlertDialogTitle>
            <AlertDialogDescription>
              {roleChange?.newRole === "ADMIN"
                ? `Deseja promover ${
                    roleChange?.user.name || roleChange?.user.email
                  } para Admin? Essa pessoa ter\u00e1 acesso total ao painel administrativo.`
                : `Deseja rebaixar ${
                    roleChange?.user.name || roleChange?.user.email
                  } para Usu\u00e1rio? Essa pessoa perder\u00e1 acesso ao painel administrativo.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleChange} disabled={updating}>
              {updating ? "Salvando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
