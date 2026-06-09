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
      heroImageDesktop: state.heroImageDesktop,
      heroImageMobile: state.heroImageMobile,
      galleryPhotos: state.galleryPhotos,
      dressMoodboard: state.dressMoodboard,
      faqItems: state.faqItems,
      giftPaymentLink: state.giftPaymentLink,
      giftQrCode: state.giftQrCode,
      coordinatorName: state.coordinatorName,
      coordinatorRole: state.coordinatorRole,
      coordinatorPhoto: state.coordinatorPhoto,
      coordinatorTelegram: state.coordinatorTelegram,
      coordinatorWhatsapp: state.coordinatorWhatsapp,
      coordinatorPhone: state.coordinatorPhone,
      coordinatorMapLink: state.coordinatorMapLink,
      photoMask: state.photoMask,
      cardStyle: state.cardStyle,
      isPrivate: state.isPrivate,
      pinCode: state.pinCode,
      language: state.language,
      crewTimings: state.crewTimings,
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
      postWeddingThankYouText: state.postWeddingThankYouText,
      customQuestions: state.customQuestions,
      fontCode: state.fontCode,
      blockOrder: state.blockOrder,
      ceremonyTime: state.ceremonyTime,
      venueName: state.venueName,
      venueAddress: state.venueAddress,
      mapLatitude: state.mapLatitude,
      mapLongitude: state.mapLongitude,
      customMusicDataUrl: state.customMusicDataUrl,
      customMusicName: state.customMusicName,
      musicTrack: state.musicTrack,
      countdownTitle: state.countdownTitle,
      countdownStyle: state.countdownStyle,
      colorPalette: state.colorPalette,
    }),
  });

  if (!response.ok) {
    throw new Error("Не удалось сохранить медиа и пожелания.");
  }
}
