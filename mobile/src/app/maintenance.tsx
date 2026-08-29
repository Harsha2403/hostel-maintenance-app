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

        // ==========================================
        // ADMIN SEES ALL COMPLAINTS
        // ==========================================

        if (
          user.role === "ADMIN"
        ) {
          endpoint =
            `${API_URL}/api/complaints`;
        }

        // ==========================================
        // MAINTENANCE STAFF SEES ONLY ASSIGNED
        // ==========================================

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

  // ==========================================
  // REFRESH
  // ==========================================

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

      {/* ==========================================
          NAVIGATION
      ========================================== */}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          if (userRole === "ADMIN") {
            router.replace("/admin");
          } else if (
            userRole ===
            "MAINTENANCE_STAFF"
          ) {
            router.replace(
              "/maintenance-home"
            );
          }
        }}
      >
        <Text
          style={
            styles.backButtonText
          }
        >
          ← Back to Home
        </Text>
      </TouchableOpacity>


      {/* ==========================================
          HEADER
      ========================================== */}

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


      {/* ==========================================
          EMPTY STATE
      ========================================== */}

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


      {/* ==========================================
          COMPLAINTS
      ========================================== */}

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

              {/* TOP ROW */}

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


              {/* DESCRIPTION */}

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


              {/* COMPLAINT NUMBER */}

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


              {/* PRIORITY */}

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


              {/* ROOM */}

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


              {/* ASSIGNED STAFF */}

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


              {/* ACTION */}

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


// ==========================================
// STYLES
// ==========================================

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


    // ==========================================
    // BACK BUTTON
    // ==========================================

    backButton: {
      alignSelf: "flex-start",
      backgroundColor: "#E2E8F0",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
      marginBottom: 15,
    },

    backButtonText: {
      color: "#1E3A8A",
      fontSize: 15,
      fontWeight: "700",
    },


    // ==========================================
    // HEADER
    // ==========================================

    header: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      marginBottom: 25,
    },

    title: {
      flex: 1,
      fontSize: 26,
      fontWeight: "bold",
      color: "#1E293B",
      marginRight: 10,
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


    // ==========================================
    // COMPLAINT CARD
    // ==========================================

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


    // ==========================================
    // EMPTY STATE
    // ==========================================

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