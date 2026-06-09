"use client";

import { useEffect } from "react";

import type {
  PersonalizedGuest,
  WeddingBuilderData,
} from "@/entities/wedding/model";
import { useWeddingStore } from "@/features/constructor/model/wedding-store";
import { InvitationPreview } from "@/features/constructor/ui/invitation-preview";

export function PublicInvitation({
  initialData,
  personalizedGuest,
}: {
  initialData: WeddingBuilderData;
  personalizedGuest: PersonalizedGuest | null;
}) {
  const initialize = useWeddingStore((state) => state.initialize);

  useEffect(() => {
    initialize(initialData);
  }, [initialData, initialize]);

  return (
    <main className="public-invitation">
      <InvitationPreview personalizedGuest={personalizedGuest} />
    </main>
  );
}
