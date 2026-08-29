import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.31.239:5000";

export default function ComplaintDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [complaint, setComplaint] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchComplaintDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await AsyncStorage.getItem("token");

      console.log("Fetching complaint details...");
      console.log("Complaint ID:", id);

      if (!id) {
        setError("Complaint ID is missing.");
        return;
      }

      const response = await axios.get(
        `${API_URL}/api/complaints/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Complaint details response:", response.data);

      const complaintData =
        response.data?.data ||
        response.data?.complaint ||
        response.data;

      setComplaint(complaintData);
    } catch (error: any) {
      console.log(
        "Fetch complaint details error:",
        error.response?.data || error.message
      );

      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to load complaint details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintDetails();
  }, [id]);

  const getStatusColor = (status?: string) => {
    switch (status?.toUpperCase()) {
      case "OPEN":
      case "PENDING":
        return "#F59E0B";

      case "IN_PROGRESS":
        return "#2563EB";

      case "RESOLVED":
        return "#16A34A";

      case "CLOSED":
        return "#64748B";

      case "REJECTED":
        return "#DC2626";

      default:
        return "#64748B";
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toUpperCase()) {
      case "LOW":
        return "#16A34A";

      case "MEDIUM":
        return "#2563EB";

      case "HIGH":
        return "#F97316";

      case "URGENT":
        return "#DC2626";

      default:
        return "#64748B";
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />

        <Text style={styles.loadingText}>
          Loading complaint details...
        </Text>
      </View>
    );
  }

  if (error || !complaint) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>
          Unable to load complaint
        </Text>

        <Text style={styles.errorText}>
          {error || "Complaint not found."}
        </Text>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchComplaintDetails}
        >
          <Text style={styles.retryButtonText}>
            Try Again
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButtonError}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonErrorText}>
            ← Back to My Complaints
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status =
    complaint.status?.toUpperCase() || "OPEN";

  const priority =
    complaint.priority?.toUpperCase() || "MEDIUM";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>
          ← Back to My Complaints
        </Text>
      </TouchableOpacity>

      <Text style={styles.pageTitle}>
        Complaint Details
      </Text>

      <View style={styles.card}>
        <Text style={styles.complaintTitle}>
          {complaint.title || "Complaint"}
        </Text>

        <Text style={styles.complaintId}>
          Complaint ID:{" "}
          {complaint.complaintNumber ||
            complaint.complaintId ||
            complaint.id}
        </Text>

        <View style={styles.badgeContainer}>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: getStatusColor(status),
              },
            ]}
          >
            <Text style={styles.badgeText}>
              {status.replace(/_/g, " ")}
            </Text>
          </View>

          <View
            style={[
              styles.badge,
              {
                backgroundColor: getPriorityColor(priority),
              },
            ]}
          >
            <Text style={styles.badgeText}>
              {priority}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>
          Category
        </Text>

        <Text style={styles.value}>
          {complaint.category?.name ||
            complaint.categoryName ||
            "Not available"}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>
          Description
        </Text>

        <Text style={styles.description}>
          {complaint.description ||
            "No description available."}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>
          Status
        </Text>

        <Text style={styles.value}>
          {status.replace(/_/g, " ")}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>
          Priority
        </Text>

        <Text style={styles.value}>
          {priority}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>
          Room
        </Text>

        <Text style={styles.value}>
          {complaint.room?.roomNumber ||
            complaint.roomNumber ||
            "Not available"}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>
          Created At
        </Text>

        <Text style={styles.value}>
          {complaint.createdAt
            ? new Date(
                complaint.createdAt
              ).toLocaleString()
            : "Not available"}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.backToListButton}
        onPress={() => router.replace("/my-complaints")}
      >
        <Text style={styles.backToListText}>
          Back to My Complaints
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
    paddingTop: 60,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    padding: 20,
  },

  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 15,
  },

  errorTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#B91C1C",
    marginBottom: 10,
  },

  errorText: {
    color: "#64748B",
    textAlign: "center",
    marginBottom: 20,
  },

  retryButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 25,
    paddingVertical: 13,
    borderRadius: 8,
  },

  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  backButtonError: {
    marginTop: 20,
  },

  backButtonErrorText: {
    color: "#2563EB",
    fontWeight: "600",
  },

  backButton: {
    marginBottom: 20,
  },

  backText: {
    color: "#2563EB",
    fontSize: 16,
    fontWeight: "600",
  },

  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
  },

  complaintTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0F172A",
  },

  complaintId: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748B",
  },

  badgeContainer: {
    flexDirection: "row",
    marginTop: 18,
    gap: 10,
  },

  badge: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
  },

  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },

  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
  },

  label: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#64748B",
    textTransform: "uppercase",
    marginBottom: 8,
  },

  value: {
    fontSize: 16,
    color: "#0F172A",
  },

  description: {
    fontSize: 16,
    color: "#334155",
    lineHeight: 24,
  },

  backToListButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },

  backToListText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});