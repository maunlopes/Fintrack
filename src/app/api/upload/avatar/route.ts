import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

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
    return new Response(JSON.stringify({ error: "Arquivo muito grande. Máximo 2 MB." }), { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `avatars/${session.user.id}-${Date.now()}.${ext}`;

  try {
    const blob = await put(filename, file, {
      access: "public",
    });

    return new Response(JSON.stringify({ url: blob.url }), { status: 200 });
  } catch (err) {
    console.error("[AVATAR_UPLOAD_ERROR]", err);
    return new Response(JSON.stringify({ error: "Erro ao fazer upload. Verifique a configuração do Blob Storage." }), { status: 500 });
  }
}
