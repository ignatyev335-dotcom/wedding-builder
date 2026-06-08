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
      postWeddingMode: state.postWeddingMode,
    }),
  });

  if (!response.ok) {
    throw new Error("Не удалось сохранить медиа и пожелания.");
  }
}
