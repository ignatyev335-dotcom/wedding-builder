type WelcomeEmail = {
  email: string;
  partnerOneName: string;
  partnerTwoName: string;
  siteUrl: string;
  accountUrl: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character];
  });
}

export async function sendWeddingWelcomeEmail(data: WelcomeEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return;

  const couple = `${escapeHtml(data.partnerOneName)} и ${escapeHtml(data.partnerTwoName)}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [data.email],
      subject: `Ваш свадебный сайт ${couple} готов`,
      html: `
        <div style="margin:0;padding:36px 18px;background:#f4f1ea;font-family:Arial,sans-serif;color:#283028">
          <div style="max-width:620px;margin:auto;padding:38px;background:#fff;border-radius:24px;border:1px solid #e4ded3">
            <p style="margin:0 0 14px;color:#74806f;font-size:12px;letter-spacing:2px;text-transform:uppercase">Vowly</p>
            <h1 style="margin:0 0 18px;font-family:Georgia,serif;font-size:32px;font-weight:500">Сайт ${couple} готов</h1>
            <p style="font-size:16px;line-height:1.65">Мы собрали первую версию приглашения. Теперь можно добавить фотографии, проверить программу дня и пригласить гостей.</p>
            <p style="margin:28px 0">
              <a href="${data.siteUrl}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#3f4c3d;color:#fff;text-decoration:none">Открыть готовый сайт</a>
            </p>
            <p><a href="${data.accountUrl}" style="color:#52614f">Перейти в личный кабинет и CRM гостей</a></p>
            <div style="margin-top:28px;padding:20px;border-radius:16px;background:#f7f5f0">
              <strong>Что сделать дальше</strong>
              <ol style="padding-left:20px;line-height:1.7">
                <li>Загрузите фотографии и выберите музыку.</li>
                <li>Проверьте дату, адрес и программу дня.</li>
                <li>Добавьте гостей и отправьте им персональные ссылки.</li>
              </ol>
            </div>
          </div>
        </div>`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend rejected welcome email: ${response.status}`);
  }
}
