import useUser from "@/hooks/useUser";
import OnboardingScreen from "@/screens/onboarding/onboarding.screen";
import { Redirect } from "expo-router";
import React from "react";

export default function Index() {
  const { user } = useUser();

  if (user) {
    return <Redirect href={"/(tabs)"} />;
  }

  return <OnboardingScreen />;
}
