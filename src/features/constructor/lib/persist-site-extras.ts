import { useWeddingStore } from "@/features/constructor/model/wedding-store";

export async function persistSiteExtras() {
  const state = useWeddingStore.getState();

  if (!state.siteId || state.siteId === "quiz-draft") {
    return;
  }

  const response = await fetch(`/api/wedding-sites/${state.siteId}/content`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      coverPhoto: state.coverPhoto,
      galleryPhotos: state.galleryPhotos,
      invitationText: state.invitationText,
      wishlistText: state.wishlistText,
      wishlistItems: state.wishlistItems,
      noFlowersEnabled: state.noFlowersEnabled,
      noFlowersText: state.noFlowersText,
      transferDescription: state.transferDescription,
      transferTime: state.transferTime,
      transferMeetingPoint: state.transferMeetingPoint,
      postWeddingMode: state.postWeddingMode,
      postWeddingPhotoUrl: state.postWeddingPhotoUrl,
      fontCode: state.fontCode,
      blockOrder: state.blockOrder,
      ceremonyTime: state.ceremonyTime,
      venueName: state.venueName,
      venueAddress: state.venueAddress,
      mapLatitude: state.mapLatitude,
      mapLongitude: state.mapLongitude,
    }),
  });

  if (!response.ok) {
    throw new Error("Не удалось сохранить медиа и пожелания.");
  }
}
