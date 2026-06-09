import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

export default async function CrewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: siteId } = await params;
  const site = await prisma.weddingSite.findUnique({
    where: { id: siteId },
    select: {
      id: true,
      data: {
        select: {
          partnerOneName: true,
          partnerTwoName: true,
          weddingDate: true,
          venueName: true,
          venueAddress: true,
        },
      },
      crewTimings: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!site?.data) {
    notFound();
  }

  return (
    <main className="crew-page">
      <header>
        <div>
          <span>CREW MODE</span>
          <h1>
            {site.data.partnerOneName} / {site.data.partnerTwoName}
          </h1>
        </div>
        <dl>
          <div>
            <dt>Дата</dt>
            <dd>
              {new Intl.DateTimeFormat("ru-RU").format(site.data.weddingDate)}
            </dd>
          </div>
          <div>
            <dt>Площадка</dt>
            <dd>{site.data.venueName || "Не указана"}</dd>
          </div>
          <div>
            <dt>Адрес</dt>
            <dd>{site.data.venueAddress || "Не указан"}</dd>
          </div>
        </dl>
      </header>

      <section>
        <div className="crew-table-head">
          <span>Время</span>
          <span>Задача</span>
          <span>Контакт</span>
        </div>
        {site.crewTimings.length ? (
          site.crewTimings.map((item) => (
            <article key={item.id}>
              <time>{item.time}</time>
              <strong>{item.description}</strong>
              <span>{item.contactPerson}</span>
            </article>
          ))
        ) : (
          <p className="crew-empty">Технический тайминг пока не заполнен.</p>
        )}
      </section>

      <footer>
        <span>Project ID: {site.id}</span>
        <span>Только для подрядчиков и команды проекта</span>
      </footer>
    </main>
  );
}
