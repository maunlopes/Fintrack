import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    const investment = await prisma.investment.findUnique({
      where: {
        id: id,
        userId: session.user.id,
      },
      include: {
        transactions: {
          orderBy: {
            date: "desc",
          },
          include: {
            investment: true
          }
        },
      },
    });

    if (!investment) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.json(investment);
  } catch (error) {
    console.error("[INVESTIMENTO_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    // Verificar se o investimento pertence ao usuario e deletar
    const investment = await prisma.investment.delete({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    return NextResponse.json(investment);
  } catch (error) {
    console.error("[INVESTIMENTO_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
