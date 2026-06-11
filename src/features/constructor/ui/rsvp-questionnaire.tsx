"use client";

import { Check, ChevronLeft, ChevronRight, Gift } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import {
  alcoholPreferenceCodes,
  type AlcoholPreferenceCode,
  type CoupleAttendanceCode,
  type GuestResponse,
  type GuestStatus,
  type PersonalizedGuest,
  type TransportPreferenceCode,
} from "@/entities/wedding/model";
import { useWeddingStore } from "@/features/constructor/model/wedding-store";
import { weddingCopy } from "@/features/wedding/lib/wedding-copy";

const alcoholLabels: Record<AlcoholPreferenceCode, string> = {
  WINE: "Вино",
  CHAMPAGNE: "Шампанское",
  STRONG: "Крепкий алкоголь",
  NONE: "Я не пью",
};

const transportOptions: Array<{
  value: TransportPreferenceCode;
  label: string;
}> = [
  { value: "TRANSFER", label: "Нужен трансфер" },
  { value: "OWN_CAR", label: "Буду на своей машине" },
  { value: "SELF", label: "Доберусь самостоятельно" },
];

export function RsvpQuestionnaire({
  personalizedGuest,
  fallbackErrorText,
  onComplete,
}: {
  personalizedGuest: PersonalizedGuest | null;
  fallbackErrorText: string;
  onComplete: () => void;
}) {
  const addGuest = useWeddingStore((state) => state.addGuest);
  const updateGuest = useWeddingStore((state) => state.updateGuest);
  const giftPaymentLink = useWeddingStore((state) => state.giftPaymentLink);
  const giftQrCode = useWeddingStore((state) => state.giftQrCode);
  const language = useWeddingStore((state) => state.language);
  const customQuestions = useWeddingStore((state) => state.customQuestions);
  const t = weddingCopy[language];
  const [step, setStep] = useState(1);
  const [guestName, setGuestName] = useState(personalizedGuest?.name ?? "");
  const [status, setStatus] = useState<GuestStatus>("ACCEPTED");
  const [hasPlusOne, setHasPlusOne] = useState(false);
  const [plusOneName, setPlusOneName] = useState("");
  const [foodPreference, setFoodPreference] = useState("Мясо");
  const [partnerFoodPreference, setPartnerFoodPreference] = useState("Мясо");
  const [allergies, setAllergies] = useState("");
  const [partnerAllergies, setPartnerAllergies] = useState("");
  const [attendanceChoice, setAttendanceChoice] =
    useState<CoupleAttendanceCode>("BOTH");
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [alcoholPreferences, setAlcoholPreferences] = useState<
    AlcoholPreferenceCode[]
  >([]);
  const [transportPreference, setTransportPreference] =
    useState<TransportPreferenceCode>("SELF");
  const [musicRequest, setMusicRequest] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleAlcohol = (value: AlcoholPreferenceCode) => {
    setAlcoholPreferences((current) => {
      if (value === "NONE") {
        return current.includes("NONE") ? [] : ["NONE"];
      }

      const withoutNone = current.filter((item) => item !== "NONE");
      return withoutNone.includes(value)
        ? withoutNone.filter((item) => item !== value)
        : [...withoutNone, value];
    });
  };

  const canContinue =
    step !== 1 ||
    ((personalizedGuest?.isCouple ||
      guestName.trim().length >= 2) &&
      (!hasPlusOne || plusOneName.trim().length >= 2));
  const isDeclined =
    status === "DECLINED" ||
    (personalizedGuest?.isCouple && attendanceChoice === "NONE");

  const submit = async () => {
    if (!canContinue) {
      return;
    }

    setIsSaving(true);
    setError("");

    const responseData = {
      status:
        personalizedGuest?.isCouple && attendanceChoice === "NONE"
          ? "DECLINED" as const
          : status,
      dietaryRestrictions: allergies.trim(),
      foodPreference:
        personalizedGuest?.isCouple && attendanceChoice === "PARTNER"
          ? ""
          : foodPreference,
      partnerFoodPreference:
        personalizedGuest?.isCouple &&
        (attendanceChoice === "BOTH" || attendanceChoice === "PARTNER")
          ? partnerFoodPreference
          : undefined,
      allergies: allergies.trim(),
      partnerAllergies:
        personalizedGuest?.isCouple &&
        (attendanceChoice === "BOTH" || attendanceChoice === "PARTNER")
          ? partnerAllergies.trim()
          : undefined,
      alcoholPreferences,
      transportPreference,
      hasPlusOne: personalizedGuest?.isCouple ? false : hasPlusOne,
      plusOneName: hasPlusOne ? plusOneName.trim() : "",
      musicRequest: musicRequest.trim(),
      attendanceChoice: personalizedGuest?.isCouple ? attendanceChoice : null,
      customAnswers,
    };

    try {
      if (personalizedGuest) {
        const response = await fetch(
          `/api/guests/${encodeURIComponent(personalizedGuest.magicToken)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(responseData),
          },
        );
        const data = (await response.json()) as {
          guest?: GuestResponse;
          error?: string;
        };

        if (!response.ok || !data.guest) {
          throw new Error(data.error || "Не удалось сохранить ответ.");
        }

        updateGuest(data.guest);
      } else {
        addGuest({
          name: guestName.trim(),
          status,
          dietaryRestrictions: allergies.trim(),
          foodPreference,
          partnerFoodPreference: "",
          allergies: allergies.trim(),
          partnerAllergies: "",
          drinks: alcoholPreferences.map((item) => alcoholLabels[item]).join(", "),
          alcoholPreferences,
          needsTransport: transportPreference === "TRANSFER",
          transportPreference,
          hasPlusOne,
          plusOneName: hasPlusOne ? plusOneName.trim() : "",
          musicRequest: musicRequest.trim(),
          isCouple: false,
          partnerName: "",
          attendanceChoice: null,
          tags: [],
          customAnswers,
        });
      }

      onComplete();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : fallbackErrorText,
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rsvp-form rsvp-questionnaire" onClick={(event) => event.stopPropagation()}>
      <div className="rsvp-progress" aria-label={`Шаг ${step} из 3`}>
        {[1, 2, 3].map((item) => (
          <i key={item} className={item <= step ? "is-active" : ""} />
        ))}
      </div>

      {personalizedGuest && (
        <p className="personal-rsvp-copy">
          {personalizedGuest.isCouple
            ? `${personalizedGuest.name} и ${personalizedGuest.partnerName}, мы очень ждем вас!`
            : `Дорогой(ая) ${personalizedGuest.name}, мы очень ждем тебя!`}
        </p>
      )}

      {step === 1 && (
        <div className="rsvp-step">
          {!personalizedGuest && (
            <label>
              <span>{t.yourName}</span>
              <input
                required
                value={guestName}
                placeholder={t.namePlaceholder}
                onChange={(event) => setGuestName(event.target.value)}
              />
            </label>
          )}
          {personalizedGuest?.isCouple ? (
            <div className="rsvp-couple-attendance">
              <p className="rsvp-question">Кто сможет быть с нами?</p>
              {([
                ["BOTH", "Придем оба"],
                ["PRIMARY", `Придет ${personalizedGuest.name}`],
                ["PARTNER", `Придет ${personalizedGuest.partnerName}`],
                ["NONE", "Не сможем прийти"],
              ] as Array<[CoupleAttendanceCode, string]>).map(([value, label]) => (
                <button
                  className={attendanceChoice === value ? "is-selected" : ""}
                  type="button"
                  key={value}
                  onClick={() => {
                    setAttendanceChoice(value);
                    setStatus(value === "NONE" ? "DECLINED" : "ACCEPTED");
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : <div className="rsvp-status">
            <button
              className={status === "ACCEPTED" ? "is-selected" : ""}
              type="button"
              onClick={() => setStatus("ACCEPTED")}
            >
              {t.accepted}
            </button>
            <button
              className={status === "DECLINED" ? "is-selected" : ""}
              type="button"
              onClick={() => setStatus("DECLINED")}
            >
              {t.declined}
            </button>
          </div>}
          {isDeclined && (giftPaymentLink || giftQrCode) && (
            <div className="remote-gift-card">
              <Gift size={18} />
              <strong>Нам будет тебя не хватать!</strong>
              <p>
                Если хочешь поздравить нас дистанционно, здесь можно оставить
                теплый подарок для нашей семейной мечты.
              </p>
              {giftQrCode && (
                <Image
                  src={giftQrCode}
                  alt="QR-код для дистанционного подарка"
                  width={150}
                  height={150}
                  unoptimized
                />
              )}
              {giftPaymentLink && (
                <a
                  href={giftPaymentLink}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                >
                  Поздравить дистанционно
                </a>
              )}
            </div>
          )}
          {status === "ACCEPTED" && !personalizedGuest?.isCouple && (
            <>
              <p className="rsvp-question">Вы будете один или с парой?</p>
              <div className="rsvp-status">
                <button
                  className={!hasPlusOne ? "is-selected" : ""}
                  type="button"
                  onClick={() => setHasPlusOne(false)}
                >
                  Буду один
                </button>
                <button
                  className={hasPlusOne ? "is-selected" : ""}
                  type="button"
                  onClick={() => setHasPlusOne(true)}
                >
                  Буду с парой
                </button>
              </div>
              {hasPlusOne && (
                <label>
                  <span>Имя спутника или спутницы</span>
                  <input
                    value={plusOneName}
                    placeholder={t.plusOnePlaceholder}
                    onChange={(event) => setPlusOneName(event.target.value)}
                  />
                </label>
              )}
            </>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="rsvp-step">
          {(!personalizedGuest?.isCouple ||
            attendanceChoice === "BOTH" ||
            attendanceChoice === "PRIMARY") && <label>
            <span>Предпочтение в еде</span>
            <select
              value={foodPreference}
              onChange={(event) => setFoodPreference(event.target.value)}
            >
              <option value="Мясо">Мясо</option>
              <option value="Рыба">Рыба</option>
              <option value="Веган">Веган</option>
            </select>
          </label>}
          {(!personalizedGuest?.isCouple ||
            attendanceChoice === "BOTH" ||
            attendanceChoice === "PRIMARY") && <label>
            <span>Аллергии и важные ограничения</span>
            <input
              value={allergies}
              placeholder={t.allergiesPlaceholder}
              onChange={(event) => setAllergies(event.target.value)}
            />
          </label>}
          {personalizedGuest?.isCouple &&
            (attendanceChoice === "BOTH" ||
              attendanceChoice === "PARTNER") && (
              <div className="rsvp-partner-menu">
                <strong>Меню для {personalizedGuest.partnerName}</strong>
                <label>
                  <span>Предпочтение в еде</span>
                  <select
                    value={partnerFoodPreference}
                    onChange={(event) =>
                      setPartnerFoodPreference(event.target.value)
                    }
                  >
                    <option value="Мясо">Мясо</option>
                    <option value="Рыба">Рыба</option>
                    <option value="Веган">Веган</option>
                  </select>
                </label>
                <label>
                  <span>Аллергии и ограничения</span>
                  <input
                    value={partnerAllergies}
                    placeholder={t.allergiesPlaceholder}
                    onChange={(event) =>
                      setPartnerAllergies(event.target.value)
                    }
                  />
                </label>
              </div>
            )}
          <fieldset className="rsvp-options">
            <legend>Что из напитков вам нравится?</legend>
            {alcoholPreferenceCodes.map((value) => (
              <button
                key={value}
                className={alcoholPreferences.includes(value) ? "is-selected" : ""}
                type="button"
                onClick={() => toggleAlcohol(value)}
              >
                <Check size={12} />
                {alcoholLabels[value]}
              </button>
            ))}
          </fieldset>
        </div>
      )}

      {step === 3 && (
        <div className="rsvp-step">
          <fieldset className="rsvp-options rsvp-transport">
            <legend>Как вы планируете добраться?</legend>
            {transportOptions.map((option) => (
              <button
                key={option.value}
                className={
                  transportPreference === option.value ? "is-selected" : ""
                }
                type="button"
                onClick={() => setTransportPreference(option.value)}
              >
                <Check size={12} />
                {option.label}
              </button>
            ))}
          </fieldset>
          <label>
            <span>Под какой трек вы точно пойдете танцевать?</span>
            <input
              value={musicRequest}
              placeholder={t.trackPlaceholder}
              onChange={(event) => setMusicRequest(event.target.value)}
            />
          </label>
          {customQuestions.map((question) => (
            <label key={question.id}>
              <span>{question.title || "Дополнительный вопрос"}</span>
              {question.type === "OPTIONS" ? (
                <select
                  value={customAnswers[question.id] ?? ""}
                  onChange={(event) =>
                    setCustomAnswers((answers) => ({
                      ...answers,
                      [question.id]: event.target.value,
                    }))
                  }
                >
                  <option value="">Выберите вариант</option>
                  {question.options.map((option) => (
                    <option value={option} key={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={customAnswers[question.id] ?? ""}
                  placeholder="Ваш ответ"
                  onChange={(event) =>
                    setCustomAnswers((answers) => ({
                      ...answers,
                      [question.id]: event.target.value,
                    }))
                  }
                />
              )}
            </label>
          ))}
        </div>
      )}

      <div className="rsvp-navigation">
        {step > 1 && (
          <button type="button" onClick={() => setStep((current) => current - 1)}>
            <ChevronLeft size={14} /> {t.back}
          </button>
        )}
        {step < 3 ? (
          <button
            type="button"
            disabled={!canContinue}
            onClick={() =>
              isDeclined ? void submit() : setStep((current) => current + 1)
            }
          >
            {isDeclined ? t.submit : t.continue}
            {!isDeclined && <ChevronRight size={14} />}
          </button>
        ) : (
          <button type="button" disabled={isSaving} onClick={() => void submit()}>
            {isSaving ? t.saving : t.submit}
          </button>
        )}
      </div>
      {error && <p className="rsvp-error">{error}</p>}
    </div>
  );
}
