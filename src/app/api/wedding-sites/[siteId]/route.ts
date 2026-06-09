import { NextResponse } from "next/server";

import { getWeddingBuilderData } from "@/features/constructor/server/get-wedding-builder-data";
import { getCurrentUser, isSiteOwnerOrAdmin } from "@/lib/auth/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const { siteId } = await params;
  const user = await getCurrentUser();
  if (!user || !(await isSiteOwnerOrAdmin(user, siteId))) {
    return NextResponse.json({ error: "Недостаточно прав." }, { status: 403 });
  }
  const site = await getWeddingBuilderData(siteId);

  if (!site) {
    return NextResponse.json({ error: "Сайт не найден." }, { status: 404 });
  }

  return NextResponse.json(site);
}
