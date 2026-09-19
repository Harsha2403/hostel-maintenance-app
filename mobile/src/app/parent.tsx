import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

import { API_URL } from "../config/api";


interface Parent {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

interface Student {
  id: string;
  studentNumber: string;
  department?: string | null;
  course?: string | null;
  year?: number | null;
  status?: string | null;
}

interface Room {
  id?: string;
  roomNumber?: string | null;
  allocatedAt?: string | null;
  hostel?: {
    id?: string;
    name?: string | null;
  } | null;
  block?: {
    id?: string;
    name?: string | null;
  } | null;
  floor?: {
    id?: string;
    name?: string | null;
  } | null;
}

interface Complaint {
  id: string;
  title?: string | null;
  description?: string | null;
  status?: string | null;
  createdAt?: string | null;
}

interface HealthRequest {
  id: string;
  type?: string | null;
  description?: string | null;
  status?: string | null;
  createdAt?: string | null;
}

interface Emergency {
  id: string;
  type?: string | null;
  description?: string | null;
  status?: string | null;
  createdAt?: string | null;
}

interface Notification {
  id: string;
  title?: string | null;
  message?: string | null;
  isRead?: boolean;
  createdAt?: string | null;
}

interface Announcement {
  id: string;
  title?: string | null;
  content?: string | null;
  priority?: string | null;
  publishedAt?: string | null;
  expiresAt?: string | null;
}

interface DashboardData {
  parent?: Parent;
  student?: Student | null;
  room?: Room | null;
  complaints?: Complaint[];
  healthRequests?: HealthRequest[];
  emergencies?: Emergency[];
  notifications?: Notification[];
  announcements?: Announcement[];
}

const formatDate = (date?: string | null) => {
  if (!date) {
    return "N/A";
  }

  try {
    return new Date(date).toLocaleDateString();
  } catch {
    return "N/A";
  }
};

const getStatusStyle = (status?: string | null) => {
  if (!status) {
    return styles.statusDefault;
  }

  const value = status.toLowerCase();

  if (
    value === "active" ||
    value === "approved" ||
    value === "resolved" ||
    value === "completed"
  ) {
    return styles.statusSuccess;
  }

  if (
    value === "pending" ||
    value === "open" ||
    value === "in_progress" ||
    value === "in-progress"
  ) {
    return styles.statusPending;
  }

  if (
    value === "rejected" ||
    value === "cancelled" ||
    value === "canceled"
  ) {
    return styles.statusDanger;
  }

  return styles.statusDefault;
};

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) => {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>

      <Text style={styles.infoValue}>
        {value !== undefined && value !== null && value !== ""
          ? String(value)
          : "N/A"}
      </Text>
    </View>
  );
};

const EmptyState = ({ message }: { message: string }) => {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
};

export default function ParentDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Dropdown states
  const [complaintsExpanded, setComplaintsExpanded] = useState(false);
  const [healthExpanded, setHealthExpanded] = useState(false);
  const [emergencyExpanded, setEmergencyExpanded] = useState(false);

  // Search states
  const [complaintSearch, setComplaintSearch] = useState("");
  const [healthSearch, setHealthSearch] = useState("");
  const [emergencySearch, setEmergencySearch] = useState("");

  const fetchDashboard = useCallback(async () => {
    try {
      setError("");

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await axios.get(`${API_URL}/api/parent/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data?.success) {
        setDashboard(response.data.data);
      } else {
        setError(
          response.data?.message || "Unable to load parent dashboard."
        );
      }
    } catch (err: any) {
      console.error("Parent dashboard error:", err);

      if (err?.response?.status === 401) {
        await AsyncStorage.multiRemove([
          "token",
          "user",
          "mustChangePassword",
        ]);

        router.replace("/login");
        return;
      }

      setError(
        err?.response?.data?.message ||
          "Failed to load dashboard. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove([
        "token",
        "user",
        "mustChangePassword",
      ]);
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      router.replace("/login");
    }
  };

  const complaints = dashboard?.complaints || [];
  const healthRequests = dashboard?.healthRequests || [];
  const emergencies = dashboard?.emergencies || [];

  // =========================
  // COMPLAINT SEARCH
  // =========================
  const filteredComplaints = useMemo(() => {
    const search = complaintSearch.trim().toLowerCase();

    if (!search) {
      return complaints;
    }

    return complaints.filter((complaint) => {
      const title = complaint.title?.toLowerCase() || "";
      const description = complaint.description?.toLowerCase() || "";
      const status = complaint.status?.toLowerCase() || "";

      return (
        title.includes(search) ||
        description.includes(search) ||
        status.includes(search)
      );
    });
  }, [complaints, complaintSearch]);

  // =========================
  // HEALTH SEARCH
  // =========================
  const filteredHealthRequests = useMemo(() => {
    const search = healthSearch.trim().toLowerCase();

    if (!search) {
      return healthRequests;
    }

    return healthRequests.filter((request) => {
      const type = request.type?.toLowerCase() || "";
      const description = request.description?.toLowerCase() || "";
      const status = request.status?.toLowerCase() || "";

      return (
        type.includes(search) ||
        description.includes(search) ||
        status.includes(search)
      );
    });
  }, [healthRequests, healthSearch]);

  // =========================
  // EMERGENCY SEARCH
  // =========================
  const filteredEmergencies = useMemo(() => {
    const search = emergencySearch.trim().toLowerCase();

    if (!search) {
      return emergencies;
    }

    return emergencies.filter((emergency) => {
      const type = emergency.type?.toLowerCase() || "";
      const description = emergency.description?.toLowerCase() || "";
      const status = emergency.status?.toLowerCase() || "";

      return (
        type.includes(search) ||
        description.includes(search) ||
        status.includes(search)
      );
    });
  }, [emergencies, emergencySearch]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Loading Parent Dashboard...
        </Text>
      </View>
    );
  }

  const parent = dashboard?.parent;
  const student = dashboard?.student;
  const room = dashboard?.room;

  const notifications = dashboard?.notifications || [];
  const announcements = dashboard?.announcements || [];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* =========================
            HEADER
        ========================= */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              Parent Dashboard
            </Text>

            <Text style={styles.headerSubtitle}>
              Hostel Maintenance System
            </Text>
          </View>

          {/* TOP LOGOUT */}
          <TouchableOpacity
            style={styles.topLogoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.topLogoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* ERROR */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchDashboard}
              activeOpacity={0.8}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* =========================
            PARENT ACCOUNT
        ========================= */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Parent Account
          </Text>

          <InfoRow label="Name" value={parent?.name} />

          <InfoRow label="Email" value={parent?.email} />

          <InfoRow label="Phone" value={parent?.phone} />
        </View>

        {/* =========================
            STUDENT DETAILS
        ========================= */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            My Child
          </Text>

          {student ? (
            <>
              <InfoRow
                label="Student Number"
                value={student.studentNumber}
              />

              <InfoRow
                label="Department"
                value={student.department}
              />

              <InfoRow
                label="Course"
                value={student.course}
              />

              <InfoRow
                label="Year"
                value={student.year}
              />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  Status
                </Text>

                <View
                  style={[
                    styles.statusBadge,
                    getStatusStyle(student.status),
                  ]}
                >
                  <Text style={styles.statusText}>
                    {student.status || "N/A"}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <EmptyState message="No student information found." />
          )}
        </View>

        {/* =========================
            ROOM DETAILS
        ========================= */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Room Details
          </Text>

          {room ? (
            <>
              <InfoRow
                label="Hostel"
                value={room.hostel?.name}
              />

              <InfoRow
                label="Block"
                value={room.block?.name}
              />

              <InfoRow
                label="Floor"
                value={room.floor?.name}
              />

              <InfoRow
                label="Room"
                value={room.roomNumber}
              />

              <InfoRow
                label="Allocated On"
                value={formatDate(room.allocatedAt)}
              />
            </>
          ) : (
            <EmptyState message="No active room allocation found." />
          )}
        </View>

        {/* =========================
            COMPLAINTS DROPDOWN
        ========================= */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.dropdownHeader}
            onPress={() =>
              setComplaintsExpanded(!complaintsExpanded)
            }
            activeOpacity={0.7}
          >
            <View style={styles.dropdownTitleContainer}>
              <Text style={styles.sectionTitle}>
                Complaints
              </Text>

              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {complaints.length}
                </Text>
              </View>
            </View>

            <Text style={styles.dropdownArrow}>
              {complaintsExpanded ? "▲" : "▼"}
            </Text>
          </TouchableOpacity>

          {complaintsExpanded ? (
            <View style={styles.dropdownContent}>
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search complaints..."
                  placeholderTextColor="#9CA3AF"
                  value={complaintSearch}
                  onChangeText={setComplaintSearch}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                {complaintSearch.length > 0 ? (
                  <TouchableOpacity
                    style={styles.clearSearchButton}
                    onPress={() => setComplaintSearch("")}
                  >
                    <Text style={styles.clearSearchText}>
                      ×
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {complaintSearch.trim().length > 0 ? (
                <Text style={styles.searchResultText}>
                  {filteredComplaints.length} complaint
                  {filteredComplaints.length !== 1 ? "s" : ""} found
                </Text>
              ) : null}

              {filteredComplaints.length > 0 ? (
                filteredComplaints.map((complaint) => (
                  <View
                    key={complaint.id}
                    style={styles.listItem}
                  >
                    <View style={styles.listHeader}>
                      <Text style={styles.listTitle}>
                        {complaint.title || "Complaint"}
                      </Text>

                      <View
                        style={[
                          styles.statusBadge,
                          getStatusStyle(complaint.status),
                        ]}
                      >
                        <Text style={styles.statusText}>
                          {complaint.status || "N/A"}
                        </Text>
                      </View>
                    </View>

                    {complaint.description ? (
                      <Text style={styles.listDescription}>
                        {complaint.description}
                      </Text>
                    ) : null}

                    <Text style={styles.listDate}>
                      {formatDate(complaint.createdAt)}
                    </Text>
                  </View>
                ))
              ) : (
                <EmptyState
                  message={
                    complaintSearch.trim()
                      ? "No complaints match your search."
                      : "No complaints found."
                  }
                />
              )}
            </View>
          ) : null}
        </View>

        {/* =========================
            HEALTH REQUESTS DROPDOWN
        ========================= */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.dropdownHeader}
            onPress={() =>
              setHealthExpanded(!healthExpanded)
            }
            activeOpacity={0.7}
          >
            <View style={styles.dropdownTitleContainer}>
              <Text style={styles.sectionTitle}>
                Health Requests
              </Text>

              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {healthRequests.length}
                </Text>
              </View>
            </View>

            <Text style={styles.dropdownArrow}>
              {healthExpanded ? "▲" : "▼"}
            </Text>
          </TouchableOpacity>

          {healthExpanded ? (
            <View style={styles.dropdownContent}>
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search health requests..."
                  placeholderTextColor="#9CA3AF"
                  value={healthSearch}
                  onChangeText={setHealthSearch}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                {healthSearch.length > 0 ? (
                  <TouchableOpacity
                    style={styles.clearSearchButton}
                    onPress={() => setHealthSearch("")}
                  >
                    <Text style={styles.clearSearchText}>
                      ×
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {healthSearch.trim().length > 0 ? (
                <Text style={styles.searchResultText}>
                  {filteredHealthRequests.length} request
                  {filteredHealthRequests.length !== 1 ? "s" : ""} found
                </Text>
              ) : null}

              {filteredHealthRequests.length > 0 ? (
                filteredHealthRequests.map((request) => (
                  <View
                    key={request.id}
                    style={styles.listItem}
                  >
                    <View style={styles.listHeader}>
                      <Text style={styles.listTitle}>
                        {request.type || "Health Request"}
                      </Text>

                      <View
                        style={[
                          styles.statusBadge,
                          getStatusStyle(request.status),
                        ]}
                      >
                        <Text style={styles.statusText}>
                          {request.status || "N/A"}
                        </Text>
                      </View>
                    </View>

                    {request.description ? (
                      <Text style={styles.listDescription}>
                        {request.description}
                      </Text>
                    ) : null}

                    <Text style={styles.listDate}>
                      {formatDate(request.createdAt)}
                    </Text>
                  </View>
                ))
              ) : (
                <EmptyState
                  message={
                    healthSearch.trim()
                      ? "No health requests match your search."
                      : "No health requests found."
                  }
                />
              )}
            </View>
          ) : null}
        </View>

        {/* =========================
            EMERGENCY DROPDOWN
        ========================= */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.dropdownHeader}
            onPress={() =>
              setEmergencyExpanded(!emergencyExpanded)
            }
            activeOpacity={0.7}
          >
            <View style={styles.dropdownTitleContainer}>
              <Text style={styles.sectionTitle}>
                Emergency
              </Text>

              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {emergencies.length}
                </Text>
              </View>
            </View>

            <Text style={styles.dropdownArrow}>
              {emergencyExpanded ? "▲" : "▼"}
            </Text>
          </TouchableOpacity>

          {emergencyExpanded ? (
            <View style={styles.dropdownContent}>
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search emergencies..."
                  placeholderTextColor="#9CA3AF"
                  value={emergencySearch}
                  onChangeText={setEmergencySearch}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                {emergencySearch.length > 0 ? (
                  <TouchableOpacity
                    style={styles.clearSearchButton}
                    onPress={() => setEmergencySearch("")}
                  >
                    <Text style={styles.clearSearchText}>
                      ×
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {emergencySearch.trim().length > 0 ? (
                <Text style={styles.searchResultText}>
                  {filteredEmergencies.length} emergency
                  {filteredEmergencies.length !== 1 ? "ies" : ""} found
                </Text>
              ) : null}

              {filteredEmergencies.length > 0 ? (
                filteredEmergencies.map((emergency) => (
                  <View
                    key={emergency.id}
                    style={styles.listItem}
                  >
                    <View style={styles.listHeader}>
                      <Text style={styles.listTitle}>
                        {emergency.type || "Emergency"}
                      </Text>

                      <View
                        style={[
                          styles.statusBadge,
                          getStatusStyle(emergency.status),
                        ]}
                      >
                        <Text style={styles.statusText}>
                          {emergency.status || "N/A"}
                        </Text>
                      </View>
                    </View>

                    {emergency.description ? (
                      <Text style={styles.listDescription}>
                        {emergency.description}
                      </Text>
                    ) : null}

                    <Text style={styles.listDate}>
                      {formatDate(emergency.createdAt)}
                    </Text>
                  </View>
                ))
              ) : (
                <EmptyState
                  message={
                    emergencySearch.trim()
                      ? "No emergencies match your search."
                      : "No emergency records found."
                  }
                />
              )}
            </View>
          ) : null}
        </View>

        {/* =========================
            NOTIFICATIONS
        ========================= */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Notifications
          </Text>

          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <View
                key={notification.id}
                style={[
                  styles.listItem,
                  !notification.isRead && styles.unreadItem,
                ]}
              >
                <View style={styles.listHeader}>
                  <Text style={styles.listTitle}>
                    {notification.title || "Notification"}
                  </Text>

                  {!notification.isRead ? (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>
                        New
                      </Text>
                    </View>
                  ) : null}
                </View>

                {notification.message ? (
                  <Text style={styles.listDescription}>
                    {notification.message}
                  </Text>
                ) : null}

                <Text style={styles.listDate}>
                  {formatDate(notification.createdAt)}
                </Text>
              </View>
            ))
          ) : (
            <EmptyState message="No notifications found." />
          )}
        </View>

        {/* =========================
            ANNOUNCEMENTS
        ========================= */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Announcements
          </Text>

          {announcements.length > 0 ? (
            announcements.map((announcement) => (
              <View
                key={announcement.id}
                style={styles.listItem}
              >
                <View style={styles.listHeader}>
                  <Text style={styles.listTitle}>
                    {announcement.title || "Announcement"}
                  </Text>

                  {announcement.priority ? (
                    <View
                      style={[
                        styles.statusBadge,
                        getStatusStyle(announcement.priority),
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {announcement.priority}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {announcement.content ? (
                  <Text style={styles.listDescription}>
                    {announcement.content}
                  </Text>
                ) : null}

                <Text style={styles.listDate}>
                  {formatDate(announcement.publishedAt)}
                </Text>
              </View>
            ))
          ) : (
            <EmptyState message="Announcements will appear here." />
          )}
        </View>

        {/* =========================
            BOTTOM LOGOUT
        ========================= */}
        <TouchableOpacity
          style={styles.bottomLogoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.bottomLogoutText}>
            Logout
          </Text>
        </TouchableOpacity>

        {/* =========================
            FOOTER
        ========================= */}
        <Text style={styles.footerText}>
          Hostel Maintenance System
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },

  scrollView: {
    flex: 1,
  },

  contentContainer: {
    padding: 16,
    paddingBottom: 30,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#4B5563",
  },

  /* =========================
     HEADER
     ========================= */

  header: {
    backgroundColor: "#1D4ED8",
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTextContainer: {
    flex: 1,
    paddingRight: 10,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: "#DBEAFE",
    fontSize: 13,
    marginTop: 5,
  },

  topLogoutButton: {
    backgroundColor: "#DC2626",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  topLogoutText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  /* =========================
     ERROR
     ========================= */

  errorContainer: {
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },

  errorText: {
    color: "#991B1B",
    fontSize: 14,
    marginBottom: 10,
  },

  retryButton: {
    backgroundColor: "#991B1B",
    borderRadius: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  retryText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  /* =========================
     CARDS
     ========================= */

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 14,
  },

  /* =========================
     INFO ROWS
     ========================= */

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 11,
  },

  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    flex: 1,
  },

  infoValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
    flex: 1.3,
    textAlign: "right",
  },

  /* =========================
     STATUS
     ========================= */

  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },

  statusSuccess: {
    backgroundColor: "#DCFCE7",
  },

  statusPending: {
    backgroundColor: "#FEF3C7",
  },

  statusDanger: {
    backgroundColor: "#FEE2E2",
  },

  statusDefault: {
    backgroundColor: "#E5E7EB",
  },

  /* =========================
     EMPTY
     ========================= */

  emptyContainer: {
    paddingVertical: 12,
  },

  emptyText: {
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
  },

  /* =========================
     DROPDOWN
     ========================= */

  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dropdownTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  countBadge: {
    backgroundColor: "#DBEAFE",
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
    marginBottom: 14,
  },

  countBadgeText: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "800",
  },

  dropdownArrow: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 14,
  },

  dropdownContent: {
    marginTop: 2,
  },

  /* =========================
     SEARCH
     ========================= */

  searchContainer: {
    position: "relative",
    marginBottom: 10,
  },

  searchInput: {
    height: 46,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingRight: 45,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },

  clearSearchButton: {
    position: "absolute",
    right: 10,
    top: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E5E7EB",
  },

  clearSearchText: {
    fontSize: 22,
    color: "#4B5563",
    lineHeight: 24,
  },

  searchResultText: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 10,
  },

  /* =========================
     LIST ITEMS
     ========================= */

  listItem: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },

  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 7,
  },

  listTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    paddingRight: 8,
  },

  listDescription: {
    color: "#4B5563",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 7,
  },

  listDate: {
    color: "#9CA3AF",
    fontSize: 12,
  },

  /* =========================
     NOTIFICATIONS
     ========================= */

  unreadItem: {
    borderLeftWidth: 4,
    borderLeftColor: "#2563EB",
  },

  unreadBadge: {
    backgroundColor: "#DBEAFE",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },

  unreadText: {
    color: "#1D4ED8",
    fontSize: 11,
    fontWeight: "700",
  },

  /* =========================
     BOTTOM LOGOUT
     ========================= */

  bottomLogoutButton: {
    backgroundColor: "#DC2626",
    borderRadius: 10,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 15,
  },

  bottomLogoutText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  /* =========================
     FOOTER
     ========================= */

  footerText: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 13,
    marginBottom: 20,
  },
});