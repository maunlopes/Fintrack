import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 4 * 1024 * 1024; // 4 MB

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

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
  const filename = `avatars/${session.user.id}-${Date.now()}.${ext}`;

  const blob = await put(filename, file, {
    access: "public",
    contentType: file.type,
  });

  return new Response(JSON.stringify({ url: blob.url }), { status: 200 });
}
