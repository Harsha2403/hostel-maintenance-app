import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ParentDashboard() {
  const handleLogout = async () => {
    await AsyncStorage.multiRemove([
      "token",
      "user",
    ]);

    router.replace("/login");
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>👨‍👩‍👧</Text>

        <Text style={styles.title}>
          Parent Dashboard
        </Text>

        <Text style={styles.subtitle}>
          Welcome to the Hostel Maintenance Parent Portal
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            Parent Account
          </Text>

          <Text style={styles.infoText}>
            Your account has been successfully activated.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            Student Information
          </Text>

          <Text style={styles.infoText}>
            Student performance and hostel information
            will appear here.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            Notifications
          </Text>

          <Text style={styles.infoText}>
            Parent notifications will appear here.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    padding: 20,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 25,
  },

  icon: {
    fontSize: 50,
    textAlign: "center",
    marginBottom: 10,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#0F172A",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    textAlign: "center",
    color: "#64748B",
    marginBottom: 25,
  },

  infoCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 5,
  },

  infoText: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
  },

  logoutButton: {
    height: 50,
    backgroundColor: "#DC2626",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },

  logoutText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});