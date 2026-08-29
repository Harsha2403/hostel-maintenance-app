import { useRouter } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";

export default function AdminDashboard() {
  const router = useRouter();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>Admin Dashboard</Text>

      <Text style={styles.subtitle}>
        Manage hostel maintenance operations
      </Text>

      {/* Maintenance Complaints */}

      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/maintenance")}
        activeOpacity={0.8}
      >
        <View style={styles.iconBox}>
          <Text style={styles.icon}>🔧</Text>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>
            Maintenance Complaints
          </Text>

          <Text style={styles.cardDescription}>
            View, assign and manage maintenance complaints.
          </Text>
        </View>

        <Text style={styles.arrow}>→</Text>
      </TouchableOpacity>

      {/* Maintenance Staff */}

      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/maintenance-staff")}
        activeOpacity={0.8}
      >
        <View style={styles.iconBox}>
          <Text style={styles.icon}>👷</Text>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>
            Maintenance Staff
          </Text>

          <Text style={styles.cardDescription}>
            Create and manage maintenance staff members.
          </Text>
        </View>

        <Text style={styles.arrow}>→</Text>
      </TouchableOpacity>

      {/* Information */}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>
          Admin Responsibilities
        </Text>

        <Text style={styles.infoText}>
          • Manage maintenance staff
        </Text>

        <Text style={styles.infoText}>
          • Assign complaints to staff
        </Text>

        <Text style={styles.infoText}>
          • Monitor complaint progress
        </Text>

        <Text style={styles.infoText}>
          • Review resolved complaints
        </Text>
      </View>
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
    paddingTop: 60,
    paddingBottom: 40,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: "#64748B",
    marginBottom: 30,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,

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

  icon: {
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
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 20,
    marginTop: 10,
  },

  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E40AF",
    marginBottom: 12,
  },

  infoText: {
    fontSize: 15,
    color: "#334155",
    marginBottom: 8,
  },
});