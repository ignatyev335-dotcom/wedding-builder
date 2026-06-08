import { NextResponse } from "next/server";

import { getWeddingBuilderData } from "@/features/constructor/server/get-wedding-builder-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const { siteId } = await params;
  const site = await getWeddingBuilderData(siteId);

  if (!site) {
    return NextResponse.json({ error: "Сайт не найден." }, { status: 404 });
  }

  return NextResponse.json(site);
}
