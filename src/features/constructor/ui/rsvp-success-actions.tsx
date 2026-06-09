"use client";

import { CalendarPlus, LoaderCircle, WalletCards } from "lucide-react";
import { useState } from "react";

export function RsvpSuccessActions({ magicToken }: { magicToken: string }) {
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  const [walletError, setWalletError] = useState("");
  const baseUrl = `/api/guests/${encodeURIComponent(magicToken)}`;

  const downloadWalletPass = async () => {
    setIsLoadingWallet(true);
    setWalletError("");

    try {
      const response = await fetch(`${baseUrl}/wallet`);
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Apple Wallet временно недоступен.");
      }

      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "wedding-invitation.pkpass";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setWalletError(
        error instanceof Error ? error.message : "Apple Wallet временно недоступен.",
      );
    } finally {
      setIsLoadingWallet(false);
    }
  };

  return (
    <div className="rsvp-success-tools">
      <p>Сохраните дату, чтобы важный день всегда был под рукой.</p>
      <div>
        <a href={`${baseUrl}/calendar`}>
          <CalendarPlus size={16} />
          Добавить в календарь
        </a>
        <a href={`${baseUrl}/calendar?provider=google`} target="_blank" rel="noreferrer">
          Google Calendar
        </a>
        <button
          type="button"
          disabled={isLoadingWallet}
          onClick={() => void downloadWalletPass()}
        >
          {isLoadingWallet ? (
            <LoaderCircle className="spin" size={16} />
          ) : (
            <WalletCards size={16} />
          )}
          Добавить в Apple Wallet
        </button>
      </div>
      {walletError && <small>{walletError}</small>}
    </div>
  );
}
