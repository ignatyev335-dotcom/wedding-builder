import { Suspense } from "react";

import ConstructorClient from "./ConstructorClient";

export default function ConstructorPage() {
  return (
    <Suspense
      fallback={
        <p className="constructor-route-loading">Загрузка конструктора...</p>
      }
    >
      <ConstructorClient />
    </Suspense>
  );
}
