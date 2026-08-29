import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
} from "react-native";

import {
  router,
  useFocusEffect,
} from "expo-router";

import axios from "axios";

import AsyncStorage from
  "@react-native-async-storage/async-storage";

const API_URL =
  "http://192.168.31.239:5000";

interface AssignedStaff {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

interface Assignment {
  id: string;
  assignedTo: string;
  assignedStaff?: AssignedStaff;
}

interface Complaint {
  id: string;
  complaintNo?: string;

  title: string;
  description: string;

  status: string;
  priority: string;

  room?: {
    id: string;
    roomNumber?: string;
  };

  category?: {
    id: string;
    name: string;
  };

  assignments?: Assignment[];
}

export default function Maintenance() {
  const [
    complaints,
    setComplaints,
  ] = useState<Complaint[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    userRole,
    setUserRole,
  ] = useState("");

  // ==========================================
  // FETCH COMPLAINTS
  // ==========================================

  const fetchComplaints =
    async () => {
      try {
        const token =
          await AsyncStorage.getItem(
            "token"
          );

        const userString =
          await AsyncStorage.getItem(
            "user"
          );

        if (!token || !userString) {
          Alert.alert(
            "Error",
            "User session not found."
          );

          return;
        }

        const user =
          JSON.parse(userString);

        setUserRole(
          user.role || ""
        );

        let endpoint = "";

        // ADMIN SEES EVERYTHING
        if (
          user.role === "ADMIN"
        ) {
          endpoint =
            `${API_URL}/api/complaints`;
        }

        // MAINTENANCE STAFF
        // SEES ONLY ASSIGNED COMPLAINTS
        else if (
          user.role ===
          "MAINTENANCE_STAFF"
        ) {
          endpoint =
            `${API_URL}/api/complaints/my-assigned`;
        }

        else {
          Alert.alert(
            "Access Denied",
            "You do not have access to maintenance complaints."
          );

          return;
        }

        const response =
          await axios.get(
            endpoint,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        console.log(
          "Complaints:",
          response.data
        );

        const data =
          response.data?.data ||
          [];

        if (
          Array.isArray(data)
        ) {
          setComplaints(data);
        } else {
          setComplaints([]);
        }
      } catch (error: any) {
        console.log(
          "Fetch complaints error:",
          error.response?.data ||
            error.message
        );

        Alert.alert(
          "Error",
          error.response?.data
            ?.message ||
            "Failed to load complaints."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    fetchComplaints();
  }, []);

  // ==========================================
  // REFRESH ON FOCUS
  // ==========================================

  useFocusEffect(
    useCallback(() => {
      fetchComplaints();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);

    fetchComplaints();
  };

  // ==========================================
  // STATUS COLOR
  // ==========================================

  const getStatusColor = (
    status?: string
  ) => {
    switch (
      status?.toUpperCase()
    ) {
      case "OPEN":
        return "#F59E0B";

      case "ASSIGNED":
        return "#7C3AED";

      case "IN_PROGRESS":
        return "#2563EB";

      case "RESOLVED":
        return "#16A34A";

      case "CLOSED":
        return "#64748B";

      case "CANCELLED":
        return "#DC2626";

      default:
        return "#64748B";
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#2563EB"
        />

        <Text
          style={styles.loadingText}
        >
          Loading complaints...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={
            handleRefresh
          }
        />
      }
    >
      {/* HEADER */}

      <View
        style={styles.header}
      >
        <Text
          style={styles.title}
        >
          {userRole === "ADMIN"
            ? "All Complaints"
            : "My Assigned Complaints"}
        </Text>

        <TouchableOpacity
          style={
            styles.refreshButton
          }
          onPress={
            handleRefresh
          }
        >
          <Text
            style={
              styles.refreshButtonText
            }
          >
            Refresh
          </Text>
        </TouchableOpacity>
      </View>

      {/* EMPTY */}

      {complaints.length === 0 && (
        <View
          style={
            styles.emptyContainer
          }
        >
          <Text
            style={
              styles.emptyText
            }
          >
            {userRole === "ADMIN"
              ? "No complaints found."
              : "No complaints are currently assigned to you."}
          </Text>
        </View>
      )}

      {/* COMPLAINTS */}

      {complaints.map(
        (complaint) => {
          const assignedStaff =
            complaint.assignments?.[0]
              ?.assignedStaff;

          return (
            <TouchableOpacity
              key={complaint.id}
              style={
                styles.complaintCard
              }
              onPress={() =>
                router.push({
                  pathname:
                    "/maintenance-complaint-details",

                  params: {
                    id:
                      complaint.id,
                  },
                })
              }
            >
              <View
                style={
                  styles.topRow
                }
              >
                <Text
                  style={
                    styles.complaintTitle
                  }
                >
                  {complaint.title}
                </Text>

                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        getStatusColor(
                          complaint.status
                        ),
                    },
                  ]}
                >
                  <Text
                    style={
                      styles.statusText
                    }
                  >
                    {complaint.status?.replace(
                      /_/g,
                      " "
                    )}
                  </Text>
                </View>
              </View>

              <Text
                style={
                  styles.description
                }
                numberOfLines={2}
              >
                {
                  complaint.description
                }
              </Text>

              <Text
                style={
                  styles.info
                }
              >
                <Text
                  style={
                    styles.label
                  }
                >
                  Complaint:
                </Text>{" "}
                {
                  complaint.complaintNo ||
                  "N/A"
                }
              </Text>

              <Text
                style={
                  styles.info
                }
              >
                <Text
                  style={
                    styles.label
                  }
                >
                  Priority:
                </Text>{" "}
                {
                  complaint.priority
                }
              </Text>

              <Text
                style={
                  styles.info
                }
              >
                <Text
                  style={
                    styles.label
                  }
                >
                  Room:
                </Text>{" "}
                {complaint.room
                  ?.roomNumber ||
                  "Not available"}
              </Text>

              {assignedStaff && (
                <Text
                  style={
                    styles.assignedTo
                  }
                >
                  <Text
                    style={
                      styles.label
                    }
                  >
                    Assigned to:
                  </Text>{" "}
                  {
                    assignedStaff.firstName
                  }{" "}
                  {
                    assignedStaff.lastName
                  }
                </Text>
              )}

              <Text
                style={
                  styles.manageText
                }
              >
                {userRole === "ADMIN"
                  ? "Tap to assign →"
                  : "Tap to manage →"}
              </Text>
            </TouchableOpacity>
          );
        }
      )}
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#F1F5F9",
    },

    content: {
      padding: 20,
      paddingTop: 50,
      paddingBottom: 40,
    },

    center: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
      backgroundColor:
        "#F1F5F9",
    },

    loadingText: {
      marginTop: 12,
      color: "#64748B",
    },

    header: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      marginBottom: 25,
    },

    title: {
      fontSize: 26,
      fontWeight: "bold",
      color: "#1E293B",
    },

    refreshButton: {
      backgroundColor:
        "#2563EB",
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 10,
    },

    refreshButtonText: {
      color: "#FFFFFF",
      fontWeight: "bold",
    },

    complaintCard: {
      backgroundColor:
        "#FFFFFF",
      borderRadius: 16,
      padding: 18,
      marginBottom: 16,
    },

    topRow: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems:
        "flex-start",
    },

    complaintTitle: {
      flex: 1,
      fontSize: 20,
      fontWeight: "bold",
      color: "#1E293B",
      marginRight: 10,
    },

    statusBadge: {
      paddingHorizontal: 13,
      paddingVertical: 7,
      borderRadius: 20,
    },

    statusText: {
      color: "#FFFFFF",
      fontWeight: "bold",
      fontSize: 12,
    },

    description: {
      fontSize: 15,
      color: "#64748B",
      marginTop: 12,
      marginBottom: 10,
    },

    info: {
      fontSize: 15,
      color: "#64748B",
      marginTop: 5,
    },

    label: {
      fontWeight: "bold",
      color: "#334155",
    },

    assignedTo: {
      fontSize: 15,
      color: "#16A34A",
      marginTop: 8,
    },

    manageText: {
      color: "#2563EB",
      fontWeight: "600",
      marginTop: 15,
    },

    emptyContainer: {
      backgroundColor:
        "#FFFFFF",
      padding: 25,
      borderRadius: 12,
      alignItems:
        "center",
    },

    emptyText: {
      color: "#64748B",
      fontSize: 16,
      textAlign: "center",
    },
  });