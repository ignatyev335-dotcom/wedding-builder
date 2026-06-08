import { Suspense } from "react";

import { ConstructorClientWrapper } from "@/features/constructor/ui/constructor-client-wrapper";

export default function ConstructorPage() {
  return (
    <Suspense fallback={<p className="constructor-route-loading">Загрузка...</p>}>
      <ConstructorClientWrapper />
    </Suspense>
  );
}
