import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function MaintenanceHome() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userString = await AsyncStorage.getItem("user");

      if (!token || !userString) {
        router.replace("/maintenance-login");
        return;
      }

      const storedUser = JSON.parse(userString);

      if (storedUser.role !== "MAINTENANCE_STAFF") {
        Alert.alert(
          "Access Denied",
          "This page is only for maintenance staff."
        );
        router.replace("/login");
        return;
      }

      setUser(storedUser);
    } catch (error) {
      console.log("Load maintenance user error:", error);
      router.replace("/maintenance-login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                "token",
                "user",
              ]);

              router.replace("/login");
            } catch (error) {
              console.log("Logout error:", error);
              Alert.alert(
                "Error",
                "Unable to logout. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>
          Loading dashboard...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>
            Maintenance Staff
          </Text>

          <Text style={styles.subtitle}>
            Welcome back,{" "}
            {user?.firstName || "Staff"}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.welcomeCard}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>👷</Text>
        </View>

        <Text style={styles.welcomeTitle}>
          Maintenance Dashboard
        </Text>

        <Text style={styles.welcomeText}>
          Manage your assigned maintenance complaints
          and update their progress.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/maintenance")}
        activeOpacity={0.8}
      >
        <View style={styles.iconBox}>
          <Text style={styles.cardIcon}>🔧</Text>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>
            My Assigned Complaints
          </Text>

          <Text style={styles.cardDescription}>
            View complaints assigned to you, start
            work, and mark completed complaints as
            resolved.
          </Text>
        </View>

        <Text style={styles.arrow}>→</Text>
      </TouchableOpacity>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>
          Your Responsibilities
        </Text>

        <Text style={styles.infoText}>
          • View assigned complaints
        </Text>

        <Text style={styles.infoText}>
          • Start maintenance work
        </Text>

        <Text style={styles.infoText}>
          • Add work remarks
        </Text>

        <Text style={styles.infoText}>
          • Mark completed work as resolved
        </Text>
      </View>

      <TouchableOpacity
        style={styles.logoutBottomButton}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Text style={styles.logoutBottomText}>
          Logout
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },

  content: {
    padding: 20,
    paddingTop: 55,
    paddingBottom: 50,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
  },

  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 15,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },

  headerText: {
    flex: 1,
    paddingRight: 12,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1E293B",
  },

  subtitle: {
    fontSize: 15,
    color: "#64748B",
    marginTop: 5,
  },

  logoutButton: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },

  logoutText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "700",
  },

  welcomeCard: {
    backgroundColor: "#2563EB",
    borderRadius: 18,
    padding: 22,
    marginBottom: 20,
    alignItems: "center",
  },

  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  icon: {
    fontSize: 32,
  },

  welcomeTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },

  welcomeText: {
    color: "#DBEAFE",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
  },

  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },

  cardIcon: {
    fontSize: 25,
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 5,
  },

  cardDescription: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
  },

  arrow: {
    fontSize: 25,
    color: "#2563EB",
    marginLeft: 10,
  },

  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginTop: 4,
    marginBottom: 20,
  },

  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 12,
  },

  infoText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 24,
  },

  logoutBottomButton: {
    backgroundColor: "#DC2626",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 5,
  },

  logoutBottomText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
