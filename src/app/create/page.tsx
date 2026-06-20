import { QuizWizard } from "@/features/onboarding/ui/quiz-wizard";
import { getProductVisualConfig } from "@/features/platform-visual/config";

export const dynamic = "force-dynamic";

export default async function CreatePage() {
  const visualConfig = await getProductVisualConfig();
  return (
    <QuizWizard
      visualAppearance={visualConfig.appearance}
      visualCopy={visualConfig.quiz}
    />
  );
}
