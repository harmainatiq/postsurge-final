import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

interface OnboardingGuardProps {
  children: React.ReactNode;
}

const PUBLIC_ROUTES = ["/", "/login", "/register"];

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading: userLoading } = trpc.auth.me.useQuery();
  const { data: settings, isLoading: settingsLoading } = trpc.settings.get.useQuery(
    undefined,
    { enabled: !!user }
  );

  useEffect(() => {
    if (userLoading || settingsLoading) return;
    if (PUBLIC_ROUTES.includes(location) || location === "/onboarding") return;

    if (user && settings === null) {
      // settings is null means no record exists — onboarding not done yet
      setLocation("/onboarding");
    }
  }, [user, settings, location, userLoading, settingsLoading, setLocation]);

  return <>{children}</>;
}
