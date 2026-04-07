import { requireAdmin, logAdminAction } from "@/lib/admin";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 4 * 1024 * 1024; // 4 MB

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || "general";

  if (!file) {
    return new Response(JSON.stringify({ error: "Nenhum arquivo enviado" }), { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return new Response(JSON.stringify({ error: "Formato inválido. Use JPG, PNG, WebP ou GIF." }), { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return new Response(JSON.stringify({ error: "Arquivo muito grande. Máximo 4 MB." }), { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `admin/${folder}/${Date.now()}.${ext}`;

  const blob = await put(filename, file, { access: "public" });

  await logAdminAction(session.user.id, "UPLOAD_IMAGE", JSON.stringify({ folder, filename }));

  return new Response(JSON.stringify({ url: blob.url }), { status: 200 });
}
