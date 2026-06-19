import Link from "next/link";
import { redirect } from "next/navigation";

import {
  contentBlockCodes,
  optionalModules,
  type BuilderModule,
  type CardStyleCode,
  type ContentBlockCode,
  type FontCode,
} from "@/entities/wedding/model";
import { VisualEditorClient } from "@/features/admin/ui/visual-editor-client";
import { parseSiteExtras } from "@/features/constructor/lib/site-extras";
import { getCurrentAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type VisualEditorPageProps = {
  searchParams: Promise<{ siteId?: string }>;
};

export default async function VisualEditorPage({ searchParams }: VisualEditorPageProps) {
  const admin = await getCurrentAdmin();
  if (!admin || admin.role !== "ADMIN") redirect("/admin");

  const { siteId } = await searchParams;
  const sites = await prisma.weddingSite.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      data: true,
      modules: true,
      user: { select: { email: true, name: true } },
    },
    take: 100,
  });

  const selectedSite = sites.find((site) => site.id === siteId) ?? sites[0] ?? null;
  const designThemes = await prisma.designTheme.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });

  if (!selectedSite?.data) {
    return (
      <main className="admin-page visual-editor-page">
        <header className="portal-header admin-topbar">
          <Link className="brand" href="/admin/dashboard">vowly</Link>
          <Link className="admin-soft-link" href="/admin/dashboard">Назад в админку</Link>
        </header>
        <section className="visual-editor-empty">
          <span>Визуальный редактор</span>
          <h1>Пока нет сайтов для редактирования</h1>
          <p>Когда пользователь создаст первый проект, он появится здесь.</p>
        </section>
      </main>
    );
  }

  const extras = parseSiteExtras(selectedSite.data.customContent);
  const enabledModules = new Set(
    selectedSite.modules
      .filter((module) => module.isEnabled)
      .map((module) => module.type),
  );

  return (
    <main className="admin-page visual-editor-page">
      <header className="portal-header admin-topbar">
        <Link className="brand" href="/admin/dashboard">vowly</Link>
        <div>
          <Link className="admin-soft-link" href="/admin/dashboard">Админка</Link>
          <a className="admin-soft-link" href={`/wedding/${selectedSite.slug}`} target="_blank" rel="noreferrer">
            Живой сайт
          </a>
        </div>
      </header>

      <VisualEditorClient
        sites={sites.map((site) => ({
          id: site.id,
          slug: site.slug,
          label: `${site.data?.partnerOneName ?? "Пара"} & ${site.data?.partnerTwoName ?? "Vowly"}`,
          owner: site.user.email ?? site.user.name ?? "без контакта",
        }))}
        selectedSite={{
          id: selectedSite.id,
          slug: selectedSite.slug,
          owner: selectedSite.user.email ?? selectedSite.user.name ?? "без контакта",
          partnerOneName: selectedSite.data.partnerOneName,
          partnerTwoName: selectedSite.data.partnerTwoName,
          weddingDate: selectedSite.data.weddingDate.toISOString().slice(0, 10),
          ceremonyTime: selectedSite.data.ceremonyTime ?? "17:00",
          venueName: selectedSite.data.venueName ?? "",
          venueAddress: selectedSite.data.venueAddress ?? "",
          invitationText: extras.invitationText,
          countdownTitle: extras.countdownTitle,
          transferDescription: extras.transferDescription,
          transferTime: extras.transferTime,
          transferMeetingPoint: extras.transferMeetingPoint,
          wishlistText: extras.wishlistText,
          noFlowersEnabled: extras.noFlowersEnabled,
          noFlowersText: extras.noFlowersText,
          postWeddingThankYouText: extras.postWeddingThankYouText,
          postWeddingPhotoUrl: extras.postWeddingPhotoUrl,
          coordinatorName: selectedSite.data.coordinatorName ?? "",
          coordinatorRole: selectedSite.data.coordinatorRole ?? "",
          coordinatorPhone: selectedSite.data.coordinatorPhone ?? "",
          fontCode: extras.fontCode as FontCode,
          cardStyle: extras.cardStyle as CardStyleCode,
          designThemeId: selectedSite.designThemeId,
          blockOrder: extras.blockOrder as ContentBlockCode[],
          moduleVisibility: Object.fromEntries(
            optionalModules.map((module) => [module, enabledModules.has(module)]),
          ) as Record<BuilderModule, boolean>,
        }}
        designThemes={designThemes}
        allBlocks={[...contentBlockCodes]}
      />
    </main>
  );
}
