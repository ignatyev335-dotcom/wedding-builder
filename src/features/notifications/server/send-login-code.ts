import { getSystemSettingValue } from "@/lib/system-settings";

type LoginCodeMessage = {
  email?: string;
  phone?: string;
  code: string;
};

async function resolveMailSettings() {
  const apiKey = await getSystemSettingValue("RESEND_API_KEY");
  const from = await getSystemSettingValue("EMAIL_FROM");

  return { apiKey, from };
}

export async function sendLoginCodeMessage(message: LoginCodeMessage) {
  if (message.email) {
    const { apiKey, from } = await resolveMailSettings();

    if (!apiKey || !from) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("Email delivery is not configured. Add RESEND_API_KEY and EMAIL_FROM.");
      }

      console.info(`Vowly login code for ${message.email}: ${message.code}`);
      return;
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [message.email],
        subject: "Код входа в Vowly",
        html: `
          <div style="margin:0;padding:32px 18px;background:#f4f1ea;font-family:Arial,sans-serif;color:#283028">
            <div style="max-width:520px;margin:auto;padding:34px;background:#fff;border-radius:24px;border:1px solid #e4ded3">
              <p style="margin:0 0 14px;color:#74806f;font-size:12px;letter-spacing:2px;text-transform:uppercase">Vowly</p>
              <h1 style="margin:0 0 18px;font-family:Georgia,serif;font-size:30px;font-weight:500">Ваш код входа</h1>
              <p style="font-size:16px;line-height:1.65">Введите этот код на сайте, чтобы открыть личный кабинет и не потерять свадебный сайт.</p>
              <div style="margin:26px 0;padding:18px;border-radius:18px;background:#f7f5f0;text-align:center;font-size:34px;letter-spacing:8px;font-weight:700">${message.code}</div>
              <p style="margin:0;color:#7b8177;font-size:13px">Код действует 10 минут.</p>
            </div>
          </div>`,
      }),
    });

    if (!response.ok) {
      throw new Error(`Resend rejected login code email: ${response.status}`);
    }

    return;
  }

  if (message.phone) {
    console.info(`Vowly SMS login code for ${message.phone}: ${message.code}`);
  }
}
