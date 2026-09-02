import { useEffect, useState, useCallback } from "react";

import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";

import {
  router,
  useFocusEffect,
} from "expo-router";

import axios from "axios";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL } from "../config/api";



interface Complaint {
  id: string;
  complaintNumber?: string;
  title: string;
  description: string;
  status: string;
  priority: string;

  category?: {
    id: string;
    name: string;
  };

  room?: {
    id: string;
    roomNumber: string;
  };

  assignments?: Array<{
    id: string;

    assignedStaff?: {
      id: string;
      firstName: string;
      lastName: string;
      email?: string;
    };
  }>;
}


export default function MyComplaints() {

  const [complaints, setComplaints] =
    useState<Complaint[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");


  // ==========================================
  // FETCH STUDENT'S OWN COMPLAINTS
  // ==========================================

  const fetchComplaints = async () => {

    try {

      setError("");

      const token =
        await AsyncStorage.getItem("token");


      if (!token) {

        setError(
          "You are not logged in."
        );

        return;

      }


      const response =
        await axios.get(
          `${API_URL}/api/complaints/my-complaints`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );


      console.log(
        "My complaints:",
        response.data
      );


      const data =
        response.data?.data || [];


      if (Array.isArray(data)) {

        setComplaints(data);

      } else {

        setComplaints([]);

      }

    } catch (error: any) {

      console.log(
        "Fetch my complaints error:",
        error?.response?.data ||
        error?.message
      );


      setError(
        error?.response?.data?.message ||
        "Unable to load your complaints."
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
  // REFRESH WHEN SCREEN OPENS
  // ==========================================

  useFocusEffect(
    useCallback(() => {

      fetchComplaints();

    }, [])
  );


  // ==========================================
  // PULL TO REFRESH
  // ==========================================

  const handleRefresh = () => {

    setRefreshing(true);

    fetchComplaints();

  };


  // ==========================================
  // GET STATUS COLOR
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

      case "REJECTED":
        return "#DC2626";

      default:
        return "#64748B";

    }

  };


  // ==========================================
  // FORMAT STATUS
  // ==========================================

  const formatStatus = (
    status?: string
  ) => {

    if (!status) {

      return "OPEN";

    }

    return status.replace(
      /_/g,
      " "
    );

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

        <Text style={styles.loadingText}>
          Loading your complaints...
        </Text>

      </View>

    );

  }


  // ==========================================
  // ERROR
  // ==========================================

  if (error) {

    return (

      <View style={styles.center}>

        <Text style={styles.errorTitle}>
          Unable to load complaints
        </Text>

        <Text style={styles.errorText}>
          {error}
        </Text>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {

            setLoading(true);

            fetchComplaints();

          }}
        >

          <Text style={styles.retryButtonText}>
            Try Again
          </Text>

        </TouchableOpacity>

      </View>

    );

  }


  // ==========================================
  // RENDER COMPLAINT
  // ==========================================

  const renderComplaint = ({
    item,
  }: {
    item: Complaint;
  }) => {

    const assignment =
      item.assignments?.[0];

    const staff =
      assignment?.assignedStaff;


    return (

      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push({
            pathname:
              "/complaint-details",

            params: {
              id: String(item.id),
            },
          })
        }
      >

        <View style={styles.topRow}>

          <Text style={styles.cardTitle}>
            {item.title}
          </Text>


          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  getStatusColor(
                    item.status
                  ),
              },
            ]}
          >

            <Text style={styles.statusText}>
              {formatStatus(
                item.status
              )}
            </Text>

          </View>

        </View>


        {item.complaintNumber && (

          <Text style={styles.complaintNumber}>
            Complaint: {item.complaintNumber}
          </Text>

        )}


        <Text
          style={styles.description}
          numberOfLines={2}
        >
          {item.description}
        </Text>


        <Text style={styles.info}>

          <Text style={styles.label}>
            Category:
          </Text>{" "}

          {item.category?.name ||
            "Not available"}

        </Text>


        <Text style={styles.info}>

          <Text style={styles.label}>
            Room:
          </Text>{" "}

          {item.room?.roomNumber ||
            "Not available"}

        </Text>


        <Text style={styles.info}>

          <Text style={styles.label}>
            Priority:
          </Text>{" "}

          {item.priority ||
            "Normal"}

        </Text>


        {staff && (

          <Text style={styles.assignedTo}>

            <Text style={styles.label}>
              Assigned to:
            </Text>{" "}

            {staff.firstName}{" "}
            {staff.lastName}

          </Text>

        )}


        {!staff &&
          item.status === "OPEN" && (

          <Text style={styles.waitingText}>
            Waiting for admin assignment
          </Text>

        )}


        <Text style={styles.trackText}>
          Tap to track complaint →
        </Text>

      </TouchableOpacity>

    );

  };


  // ==========================================
  // MAIN SCREEN
  // ==========================================

  return (

    <View style={styles.container}>


      {/* BACK TO HOME */}

      <TouchableOpacity
        style={styles.backHomeButton}
        onPress={() => router.replace("/student")}
      >
        <Text style={styles.backHomeButtonText}>
          ← Back to Home
        </Text>
      </TouchableOpacity>


      {/* HEADER */}

      <View style={styles.header}>

        <Text style={styles.title}>
          My Complaints
        </Text>


        <TouchableOpacity
          style={styles.newButton}
          onPress={() =>
            router.push(
              "/create-complaint"
            )
          }
        >

          <Text style={styles.newButtonText}>
            + New
          </Text>

        </TouchableOpacity>

      </View>


      {/* COMPLAINT LIST */}

      <FlatList

        data={complaints}

        keyExtractor={(item) =>
          String(item.id)
        }

        renderItem={renderComplaint}

        showsVerticalScrollIndicator={false}

        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }

        ListEmptyComponent={

          <View style={styles.emptyContainer}>

            <Text style={styles.emptyTitle}>
              No complaints yet
            </Text>

            <Text style={styles.emptyText}>
              You haven't raised any maintenance
              complaints yet.
            </Text>

          </View>

        }

      />

    </View>

  );

}


const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    padding: 20,
    paddingTop: 60,
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
  },

  backHomeButton: {
    alignSelf: "flex-start",
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 15,
  },

  backHomeButtonText: {
    color: "#1E3A8A",
    fontSize: 15,
    fontWeight: "700",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0F172A",
  },

  newButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },

  newButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  card: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 14,
    marginBottom: 14,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: "#0F172A",
    marginRight: 10,
  },

  complaintNumber: {
    marginTop: 5,
    fontSize: 12,
    color: "#64748B",
  },

  description: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 10,
    marginBottom: 8,
  },

  info: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 5,
  },

  label: {
    fontWeight: "bold",
    color: "#334155",
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },

  assignedTo: {
    marginTop: 10,
    fontSize: 14,
    color: "#16A34A",
  },

  waitingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#F59E0B",
    fontWeight: "600",
  },

  trackText: {
    marginTop: 15,
    color: "#2563EB",
    fontWeight: "600",
  },

  emptyContainer: {
    paddingTop: 100,
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#334155",
  },

  emptyText: {
    marginTop: 10,
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#B91C1C",
    marginBottom: 8,
  },

  errorText: {
    color: "#64748B",
    textAlign: "center",
    marginBottom: 20,
  },

  retryButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },

  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

});
