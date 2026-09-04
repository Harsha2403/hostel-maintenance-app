import { useEffect, useState } from "react";
import {
  Stack,
  useRouter,
  useSegments,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const [checkingSession, setCheckingSession] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const token =
          await AsyncStorage.getItem("token");

        const userString =
          await AsyncStorage.getItem("user");

        const currentRoute =
          segments[0] as string | undefined;

        // ==========================================
        // PUBLIC ROUTES
        // ==========================================

        const isLoginRoute =
          currentRoute === "login";

        const isStudentRegisterRoute =
          currentRoute === "student-register";

        // ==========================================
        // NO AUTHENTICATED SESSION
        // ==========================================

        if (!token || !userString) {
          // Allow Login and Student Registration
          if (
            currentRoute === "index" ||
            (!isLoginRoute &&
              !isStudentRegisterRoute)
          ) {
            router.replace("/login");
          }

          return;
        }

        // ==========================================
        // READ USER
        // ==========================================

        let user: {
          role?: string;
        };

        try {
          user = JSON.parse(userString);
        } catch {
          await AsyncStorage.multiRemove([
            "token",
            "user",
          ]);

          router.replace("/login");
          return;
        }

        // ==========================================
        // ROLE → DASHBOARD
        // ==========================================

        const dashboardByRole: Record<
          string,
          string
        > = {
          ADMIN: "/admin",
          WARDEN: "/warden",
          MAINTENANCE_STAFF:
            "/maintenance-home",
          STUDENT: "/student",
        };

        const dashboard =
          user.role
            ? dashboardByRole[user.role]
            : undefined;

        // ==========================================
        // AUTHENTICATED USER TRYING LOGIN / HOME
        // ==========================================

        if (
          dashboard &&
          (
            currentRoute === "index" ||
            isLoginRoute ||
            isStudentRegisterRoute
          )
        ) {
          router.replace(dashboard as any);
        }
      } catch (error) {
        console.error(
          "Session check error:",
          error
        );
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, [segments, router]);

  // ==========================================
  // WAIT UNTIL SESSION CHECK FINISHES
  // ==========================================

  if (checkingSession) {
    return null;
  }

  // ==========================================
  // APP ROUTER
  // ==========================================

  return (
    <>
      <StatusBar style="light" />

      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
      </Stack>
    </>
  );
}