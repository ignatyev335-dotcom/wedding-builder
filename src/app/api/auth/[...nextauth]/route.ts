import { NextResponse } from "next/server";

import {
  authProviders,
  enabledAuthProviders,
} from "@/auth.config";

function authInfrastructureResponse() {
  return NextResponse.json(
    {
      ready: false,
      message:
        "Auth.js infrastructure is prepared. Install next-auth@beta to activate handlers.",
      providers: authProviders.map(({ id, name, type, enabled }) => ({
        id,
        name,
        type,
        enabled,
      })),
      enabledProviders: enabledAuthProviders.map(({ id }) => id),
    },
    { status: 501 },
  );
}

export const GET = authInfrastructureResponse;
export const POST = authInfrastructureResponse;
