"use client";

import { Check, ChevronLeft, ChevronRight } from "lucide-react";
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
  const language = useWeddingStore((state) => state.language);
  const customQuestions = useWeddingStore((state) => state.customQuestions);
  const rsvpQuestionSettings = useWeddingStore(
    (state) => state.rsvpQuestionSettings,
  );
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

  const hasMenuStep = rsvpQuestionSettings.food || rsvpQuestionSettings.alcohol;
  const hasDetailsStep =
    rsvpQuestionSettings.transport ||
    rsvpQuestionSettings.music ||
    customQuestions.length > 0;
  const visibleSteps = [
    1,
    ...(hasMenuStep ? [2] : []),
    ...(hasDetailsStep ? [3] : []),
  ];
  const currentStepIndex = Math.max(0, visibleSteps.indexOf(step));
  const isLastStep = currentStepIndex === visibleSteps.length - 1;
  const goNext = () => {
    setStep(visibleSteps[Math.min(currentStepIndex + 1, visibleSteps.length - 1)]);
  };
  const goBack = () => {
    setStep(visibleSteps[Math.max(currentStepIndex - 1, 0)]);
  };

  const canContinue =
    step !== 1 ||
    ((personalizedGuest?.isCouple ||
      guestName.trim().length >= 2) &&
      (!rsvpQuestionSettings.plusOne ||
        !hasPlusOne ||
        plusOneName.trim().length >= 2));
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
      dietaryRestrictions: rsvpQuestionSettings.food ? allergies.trim() : "",
      foodPreference:
        !rsvpQuestionSettings.food ||
        (personalizedGuest?.isCouple && attendanceChoice === "PARTNER")
          ? ""
          : foodPreference,
      partnerFoodPreference:
        rsvpQuestionSettings.food &&
        personalizedGuest?.isCouple &&
        (attendanceChoice === "BOTH" || attendanceChoice === "PARTNER")
          ? partnerFoodPreference
          : undefined,
      allergies: rsvpQuestionSettings.food ? allergies.trim() : "",
      partnerAllergies:
        rsvpQuestionSettings.food &&
        personalizedGuest?.isCouple &&
        (attendanceChoice === "BOTH" || attendanceChoice === "PARTNER")
          ? partnerAllergies.trim()
          : undefined,
      alcoholPreferences: rsvpQuestionSettings.alcohol ? alcoholPreferences : [],
      transportPreference: rsvpQuestionSettings.transport ? transportPreference : "SELF",
      hasPlusOne:
        personalizedGuest?.isCouple || !rsvpQuestionSettings.plusOne
          ? false
          : hasPlusOne,
      plusOneName:
        rsvpQuestionSettings.plusOne && hasPlusOne ? plusOneName.trim() : "",
      musicRequest: rsvpQuestionSettings.music ? musicRequest.trim() : "",
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
          dietaryRestrictions: rsvpQuestionSettings.food ? allergies.trim() : "",
          foodPreference: rsvpQuestionSettings.food ? foodPreference : "",
          partnerFoodPreference: "",
          allergies: rsvpQuestionSettings.food ? allergies.trim() : "",
          partnerAllergies: "",
          drinks: rsvpQuestionSettings.alcohol
            ? alcoholPreferences.map((item) => alcoholLabels[item]).join(", ")
            : "",
          alcoholPreferences: rsvpQuestionSettings.alcohol
            ? alcoholPreferences
            : [],
          needsTransport:
            rsvpQuestionSettings.transport && transportPreference === "TRANSFER",
          transportPreference: rsvpQuestionSettings.transport
            ? transportPreference
            : null,
          hasPlusOne: rsvpQuestionSettings.plusOne && hasPlusOne,
          plusOneName:
            rsvpQuestionSettings.plusOne && hasPlusOne ? plusOneName.trim() : "",
          musicRequest: rsvpQuestionSettings.music ? musicRequest.trim() : "",
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
      <div
        className="rsvp-progress"
        aria-label={`Шаг ${currentStepIndex + 1} из ${visibleSteps.length}`}
      >
        {visibleSteps.map((item, index) => (
          <i key={item} className={index <= currentStepIndex ? "is-active" : ""} />
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
          {status === "ACCEPTED" &&
            rsvpQuestionSettings.plusOne &&
            !personalizedGuest?.isCouple && (
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
          {rsvpQuestionSettings.food && (!personalizedGuest?.isCouple ||
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
          {rsvpQuestionSettings.food && (!personalizedGuest?.isCouple ||
            attendanceChoice === "BOTH" ||
            attendanceChoice === "PRIMARY") && <label>
            <span>Аллергии и важные ограничения</span>
            <input
              value={allergies}
              placeholder={t.allergiesPlaceholder}
              onChange={(event) => setAllergies(event.target.value)}
            />
          </label>}
          {rsvpQuestionSettings.food &&
            personalizedGuest?.isCouple &&
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
          {rsvpQuestionSettings.alcohol && (
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
          )}
        </div>
      )}

      {step === 3 && (
        <div className="rsvp-step">
          {rsvpQuestionSettings.transport && (
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
          )}
          {rsvpQuestionSettings.music && (
            <label>
              <span>Под какой трек вы точно пойдете танцевать?</span>
              <input
                value={musicRequest}
                placeholder={t.trackPlaceholder}
                onChange={(event) => setMusicRequest(event.target.value)}
              />
            </label>
          )}
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
        {currentStepIndex > 0 && (
          <button type="button" onClick={goBack}>
            <ChevronLeft size={14} /> {t.back}
          </button>
        )}
        {!isLastStep ? (
          <button
            type="button"
            disabled={!canContinue}
            onClick={() =>
              isDeclined ? void submit() : goNext()
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
