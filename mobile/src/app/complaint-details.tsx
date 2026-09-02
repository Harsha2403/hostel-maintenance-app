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
import { API_URL } from "../config/api";

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

  // ==========================================
  // COMPLAINT STATUS HISTORY
  // Always display oldest -> newest
  // ==========================================

  const rawHistory = Array.isArray(complaint?.statusHistory)
    ? complaint.statusHistory
    : [];

  const sortedHistory = [...rawHistory].sort((a: any, b: any) => {
    const dateA = new Date(a?.createdAt || 0).getTime();
    const dateB = new Date(b?.createdAt || 0).getTime();

    if (dateA !== dateB) {
      return dateA - dateB;
    }

    // Stable fallback when timestamps are equal.
    return String(a?.id || "").localeCompare(String(b?.id || ""));
  });

  // The complaint itself was created in OPEN state.
  // Do NOT use the current complaint.status here.
  const trackingHistory = [
    {
      id: "created",
      oldStatus: null,
      newStatus: "OPEN",
      changedBy: null,
      remarks: "Complaint was submitted successfully.",
      createdAt: complaint?.createdAt,
      isCreated: true,
    },
    ...sortedHistory.map((item: any) => ({
      ...item,
      isCreated: false,
    })),
  ];

  const formatTrackingStatus = (value?: string | null) => {
    if (!value) {
      return "";
    }

    return String(value)
      .replace(/_/g, " ")
      .toUpperCase();
  };

  const getHistoryLabel = (item: any) => {
    if (item.isCreated) {
      return "Complaint Created";
    }

    return formatTrackingStatus(item.newStatus);
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

      {/* ==========================================
          COMPLAINT TRACKING
      ========================================== */}

      <View style={styles.trackingCard}>
        <Text style={styles.trackingTitle}>
          Complaint Tracking
        </Text>

        {trackingHistory.map((item: any, index: number) => {
          const isLast = index === trackingHistory.length - 1;
          const statusText = getHistoryLabel(item);
          const oldStatus = formatTrackingStatus(item.oldStatus);
          const newStatus = formatTrackingStatus(item.newStatus);

          return (
            <View
              key={`${item.id || "history"}-${index}`}
              style={styles.timelineRow}
            >
              {/* TIMELINE */}
              <View style={styles.timelineLeft}>
                <View
                  style={[
                    styles.timelineDot,
                    {
                      backgroundColor: getStatusColor(
                        item.newStatus
                      ),
                    },
                  ]}
                />

                {!isLast && (
                  <View style={styles.timelineLine} />
                )}
              </View>

              {/* EVENT DETAILS */}
              <View style={styles.timelineContent}>
                <Text style={styles.timelineStatus}>
                  {statusText}
                </Text>

                {!item.isCreated && oldStatus && (
                  <Text style={styles.timelineTransition}>
                    {oldStatus} → {newStatus}
                  </Text>
                )}

                {item.isCreated && (
                  <Text style={styles.timelineTransition}>
                    OPEN
                  </Text>
                )}

                <Text style={styles.timelineDate}>
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleString()
                    : "Date not available"}
                </Text>

                {!item.isCreated && item.changedBy && (
                  <Text style={styles.timelineChangedBy}>
                    Updated by: System user
                  </Text>
                )}

                <Text style={styles.timelineRemark}>
                  {item.remarks ||
                    (item.isCreated
                      ? "Complaint was submitted successfully."
                      : "Status updated")}
                </Text>
              </View>
            </View>
          );
        })}
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

  trackingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
  },

  trackingTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#334155",
    marginBottom: 20,
  },

  timelineRow: {
    flexDirection: "row",
    minHeight: 95,
  },

  timelineLeft: {
    width: 28,
    alignItems: "center",
    position: "relative",
  },

  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 2,
    zIndex: 2,
  },

  timelineLine: {
    position: "absolute",
    top: 16,
    bottom: 0,
    width: 2,
    backgroundColor: "#CBD5E1",
  },

  timelineContent: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 22,
  },

  timelineStatus: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 4,
  },

  timelineTransition: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 5,
  },

  timelineDate: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 4,
  },

  timelineChangedBy: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 5,
  },

  timelineRemark: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 20,
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