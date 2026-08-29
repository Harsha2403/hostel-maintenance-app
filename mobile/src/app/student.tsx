import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function StudentDashboard() {
  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");

    router.replace("/login");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Student Dashboard</Text>

      <Text style={styles.subtitle}>
        Manage your hostel maintenance complaints
      </Text>

      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/create-complaint")}
      >
        <Text style={styles.cardTitle}>Raise a Complaint</Text>

        <Text style={styles.cardText}>
          Report an issue in your hostel room.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/my-complaints")}
      >
        <Text style={styles.cardTitle}>My Complaints</Text>

        <Text style={styles.cardText}>
          Track the status of your maintenance requests.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    padding: 20,
    paddingTop: 70,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0F172A",
  },

  subtitle: {
    fontSize: 15,
    color: "#64748B",
    marginTop: 8,
    marginBottom: 30,
  },

  card: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2563EB",
  },

  cardText: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 8,
  },

  logoutButton: {
    marginTop: "auto",
    backgroundColor: "#DC2626",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },

  logoutText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});