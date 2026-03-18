"use client";

import React from "react";
import { MagicAuthProvider } from "@/app/lib/connectkit-compat";

// Kept component name to avoid touching app layout/UI wiring.
export const ParticleConnectkit = ({ children }: React.PropsWithChildren) => {
  return <MagicAuthProvider>{children}</MagicAuthProvider>;
};
