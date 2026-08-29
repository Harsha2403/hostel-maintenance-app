import { useEffect } from "react";
import { useRouter } from "expo-router";

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AdminDashboard() {
  const router = useRouter();

  // ==========================================
  // CHECK ADMIN SESSION
  // ==========================================

  useEffect(() => {
    checkAdminSession();
  }, []);

  const checkAdminSession = async () => {
    try {
      const token =
        await AsyncStorage.getItem("token");

      const userString =
        await AsyncStorage.getItem("user");

      if (!token || !userString) {
        router.replace("/login");
        return;
      }

      const user =
        JSON.parse(userString);

      if (user.role !== "ADMIN") {
        Alert.alert(
          "Access Denied",
          "You do not have admin access."
        );

        await AsyncStorage.multiRemove([
          "token",
          "user",
        ]);

        router.replace("/login");
      }
    } catch (error) {
      console.log(
        "Admin session error:",
        error
      );

      await AsyncStorage.multiRemove([
        "token",
        "user",
      ]);

      router.replace("/login");
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = async () => {
    try {
      // Clear authentication data
      await AsyncStorage.multiRemove([
        "token",
        "user",
      ]);

      // Make sure session data is removed
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");

      console.log(
        "Admin logout successful"
      );

      // Replace current page with Login
      router.replace("/login");
    } catch (error) {
      console.log(
        "Admin logout error:",
        error
      );

      Alert.alert(
        "Logout Error",
        "Unable to logout. Please try again."
      );
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
    >

      {/* ==========================================
          HEADER
      ========================================== */}

      <View style={styles.header}>

        <View style={styles.headerContent}>
          <Text style={styles.title}>
            Admin Dashboard
          </Text>

          <Text style={styles.subtitle}>
            Manage hostel maintenance operations
          </Text>
        </View>

        {/* LOGOUT BUTTON */}

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


      {/* ==========================================
          MAINTENANCE COMPLAINTS
      ========================================== */}

      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push("/maintenance")
        }
        activeOpacity={0.8}
      >

        <View style={styles.iconBox}>
          <Text style={styles.icon}>
            🔧
          </Text>
        </View>

        <View style={styles.cardContent}>

          <Text style={styles.cardTitle}>
            Maintenance Complaints
          </Text>

          <Text style={styles.cardDescription}>
            View, assign and manage maintenance
            complaints.
          </Text>

        </View>

        <Text style={styles.arrow}>
          →
        </Text>

      </TouchableOpacity>


      {/* ==========================================
          MAINTENANCE STAFF
      ========================================== */}

      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push(
            "/maintenance-staff"
          )
        }
        activeOpacity={0.8}
      >

        <View style={styles.iconBox}>
          <Text style={styles.icon}>
            👷
          </Text>
        </View>

        <View style={styles.cardContent}>

          <Text style={styles.cardTitle}>
            Maintenance Staff
          </Text>

          <Text style={styles.cardDescription}>
            Create and manage maintenance
            staff members.
          </Text>

        </View>

        <Text style={styles.arrow}>
          →
        </Text>

      </TouchableOpacity>


      {/* ==========================================
          INFORMATION
      ========================================== */}

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


      {/* ==========================================
          BOTTOM LOGOUT
      ========================================== */}

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


// ==========================================
// STYLES
// ==========================================

const styles =
  StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor: "#F1F5F9",
    },

    content: {
      padding: 20,
      paddingTop: 60,
      paddingBottom: 40,
    },

    // ==========================================
    // HEADER
    // ==========================================

    header: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems:
        "flex-start",
      marginBottom: 30,
    },

    headerContent: {
      flex: 1,
      paddingRight: 15,
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
    },

    // ==========================================
    // LOGOUT
    // ==========================================

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

    // ==========================================
    // CARD
    // ==========================================

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

    // ==========================================
    // INFO
    // ==========================================

    infoCard: {
      backgroundColor: "#EFF6FF",
      borderRadius: 16,
      padding: 20,
      marginTop: 10,
      marginBottom: 20,
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

    // ==========================================
    // BOTTOM LOGOUT
    // ==========================================

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