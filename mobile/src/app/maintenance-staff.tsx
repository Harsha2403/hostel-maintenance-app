import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";

import { useRouter, useFocusEffect } from "expo-router";

import axios from "axios";

import AsyncStorage from
  "@react-native-async-storage/async-storage";

import { API_URL } from "../config/api";



interface ComplaintStats {
  open: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  closed: number;
  activeWorkload: number;
  totalAssigned: number;
}

interface MaintenanceStaff {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: string;
  isActive: boolean;
  createdAt?: string;
  complaintStats?: ComplaintStats;
}

export default function MaintenanceStaffPage() {
  const router = useRouter();

  const [staff, setStaff] =
    useState<MaintenanceStaff[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [creating, setCreating] =
    useState(false);

  const [firstName, setFirstName] =
    useState("");

  const [lastName, setLastName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  // ==========================================
  // GET ADMIN TOKEN
  // ==========================================

  const getToken = async () => {
    const token =
      await AsyncStorage.getItem("token");

    const userString =
      await AsyncStorage.getItem("user");

    if (!token || !userString) {
      throw new Error(
        "Admin session not found."
      );
    }

    const user = JSON.parse(userString);

    if (user.role !== "ADMIN") {
      throw new Error(
        "Only administrators can manage maintenance staff."
      );
    }

    return token;
  };

  // ==========================================
  // FETCH STAFF
  // ==========================================

  const fetchStaff = async () => {
    try {
      const token = await getToken();

      const response = await axios.get(
        `${API_URL}/api/auth/maintenance-staff?includeInactive=true`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data =
        response.data?.data || [];

      if (Array.isArray(data)) {
        setStaff(data);
      } else {
        setStaff([]);
      }
    } catch (error: any) {
      console.log(
        "Fetch maintenance staff error:",
        error.response?.data ||
          error.message
      );

      Alert.alert(
        "Error",
        error.response?.data?.message ||
          error.message ||
          "Failed to load maintenance staff."
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
    fetchStaff();
  }, []);

  // ==========================================
  // REFRESH WHEN SCREEN OPENS
  // ==========================================

  useFocusEffect(
    useCallback(() => {
      fetchStaff();
    }, [])
  );

  // ==========================================
  // REFRESH
  // ==========================================

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStaff();
  };

  // ==========================================
  // RESET FORM
  // ==========================================

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
  };

  // ==========================================
  // CREATE STAFF
  // ==========================================

  const handleCreateStaff = async () => {
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert(
        "Missing Information",
        "Please fill all required fields."
      );

      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Password Error",
        "Passwords do not match."
      );

      return;
    }

    if (password.length < 8) {
      Alert.alert(
        "Password Error",
        "Password must contain at least 8 characters."
      );

      return;
    }

    try {
      setCreating(true);

      const token = await getToken();

      const payload = {
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || null,
      };

      console.log(
        "Creating maintenance staff:",
        {
          email: payload.email,
          firstName: payload.firstName,
          lastName: payload.lastName,
        }
      );

      const response = await axios.post(
        `${API_URL}/api/auth/maintenance-staff`,
        payload,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
        }
      );

      console.log(
        "Create staff response:",
        response.data
      );

      if (response.data?.success) {
        Alert.alert(
          "Success",
          "Maintenance staff created successfully.",
          [
            {
              text: "OK",
              onPress: async () => {
                resetForm();
                setShowCreateForm(false);
                await fetchStaff();
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "Error",
          response.data?.message ||
            "Failed to create maintenance staff."
        );
      }
    } catch (error: any) {
      console.log(
        "Create staff error:",
        error.response?.data ||
          error.message
      );

      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Failed to create maintenance staff."
      );
    } finally {
      setCreating(false);
    }
  };

  // ==========================================
  // ACTIVATE / DEACTIVATE STAFF
  // ==========================================

  const handleToggleStatus = (member: MaintenanceStaff) => {
    const nextStatus = !member.isActive;

    Alert.alert(
      nextStatus
        ? "Activate Staff"
        : "Deactivate Staff",
      nextStatus
        ? `Activate ${member.firstName} ${member.lastName}?`
        : `Deactivate ${member.firstName} ${member.lastName}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: nextStatus
            ? "Activate"
            : "Deactivate",
          style: nextStatus
            ? "default"
            : "destructive",
          onPress: async () => {
            try {
              const token = await getToken();

              const response =
                await axios.patch(
                  `${API_URL}/api/auth/maintenance-staff/${member.id}/status`,
                  {
                    isActive: nextStatus,
                  },
                  {
                    headers: {
                      Authorization:
                        `Bearer ${token}`,
                      "Content-Type":
                        "application/json",
                    },
                  }
                );

              if (response.data?.success) {
                Alert.alert(
                  "Success",
                  response.data.message ||
                    "Staff status updated successfully."
                );

                await fetchStaff();
              } else {
                Alert.alert(
                  "Error",
                  response.data?.message ||
                    "Failed to update staff status."
                );
              }
            } catch (error: any) {
              console.log(
                "Toggle staff status error:",
                error?.response?.data ||
                  error?.message
              );

              Alert.alert(
                "Error",
                error?.response?.data?.message ||
                  error?.message ||
                  "Failed to update staff status."
              );
            }
          },
        },
      ]
    );
  };

  // ==========================================
  // WORKLOAD HELPERS
  // ==========================================

  const getComplaintStats = (
    member: MaintenanceStaff
  ): ComplaintStats => {
    return (
      member.complaintStats || {
        open: 0,
        assigned: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
        activeWorkload: 0,
        totalAssigned: 0,
      }
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
          Loading maintenance staff...
        </Text>
      </View>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      }
    >
      {/* HEADER */}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>
          ← Back to Admin
        </Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            Maintenance Staff
          </Text>

          <Text style={styles.subtitle}>
            Manage your maintenance team
          </Text>
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {staff.filter((member) => member.isActive).length}
          </Text>

          <Text style={styles.countLabel}>
            Active Staff
          </Text>

          <Text style={styles.totalStaffText}>
            Total: {staff.length}
          </Text>
        </View>
      </View>

      {/* CREATE BUTTON */}

      {!showCreateForm && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() =>
            setShowCreateForm(true)
          }
          activeOpacity={0.8}
        >
          <Text style={styles.createButtonText}>
            + Create Maintenance Staff
          </Text>
        </TouchableOpacity>
      )}

      {/* CREATE FORM */}

      {showCreateForm && (
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>
              Create Maintenance Staff
            </Text>

            <TouchableOpacity
              onPress={() => {
                resetForm();
                setShowCreateForm(false);
              }}
            >
              <Text style={styles.cancelText}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>

          {/* FIRST NAME */}

          <Text style={styles.inputLabel}>
            First Name *
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter first name"
            placeholderTextColor="#94A3B8"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />

          {/* LAST NAME */}

          <Text style={styles.inputLabel}>
            Last Name *
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter last name"
            placeholderTextColor="#94A3B8"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />

          {/* EMAIL */}

          <Text style={styles.inputLabel}>
            Email *
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter email address"
            placeholderTextColor="#94A3B8"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* PHONE */}

          <Text style={styles.inputLabel}>
            Phone
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter phone number"
            placeholderTextColor="#94A3B8"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          {/* PASSWORD */}

          <Text style={styles.inputLabel}>
            Password *
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor="#94A3B8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          {/* CONFIRM PASSWORD */}

          <Text style={styles.inputLabel}>
            Confirm Password *
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Confirm password"
            placeholderTextColor="#94A3B8"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          {/* SUBMIT */}

          <TouchableOpacity
            style={[
              styles.submitButton,
              creating &&
                styles.disabledButton,
            ]}
            onPress={handleCreateStaff}
            disabled={creating}
            activeOpacity={0.8}
          >
            {creating ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <Text
                style={styles.submitButtonText}
              >
                Create Staff
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* STAFF LIST */}

      <Text style={styles.sectionTitle}>
        Maintenance Staff
      </Text>

      {staff.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>
            No Maintenance Staff
          </Text>

          <Text style={styles.emptyText}>
            Create your first maintenance staff
            member using the button above.
          </Text>
        </View>
      ) : (
        staff.map((member) => {
          const stats = getComplaintStats(member);

          return (
            <View
              key={member.id}
              style={[
                styles.staffCard,
                !member.isActive &&
                  styles.inactiveStaffCard,
              ]}
            >
              <View
                style={[
                  styles.avatar,
                  !member.isActive &&
                    styles.inactiveAvatar,
                ]}
              >
                <Text style={styles.avatarText}>
                  {member.firstName
                    ?.charAt(0)
                    ?.toUpperCase()}
                  {member.lastName
                    ?.charAt(0)
                    ?.toUpperCase()}
                </Text>
              </View>

              <View style={styles.staffInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.staffName}>
                    {member.firstName}{" "}
                    {member.lastName}
                  </Text>

                  <View
                    style={[
                      styles.statusBadge,
                      member.isActive
                        ? styles.activeStatusBadge
                        : styles.inactiveStatusBadge,
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        member.isActive
                          ? styles.activeDot
                          : styles.inactiveDot,
                      ]}
                    />

                    <Text
                      style={[
                        styles.activeText,
                        member.isActive
                          ? styles.activeText
                          : styles.inactiveText,
                      ]}
                    >
                      {member.isActive
                        ? "Active"
                        : "Inactive"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.staffEmail}>
                  {member.email}
                </Text>

                {member.phone && (
                  <Text style={styles.staffPhone}>
                    {member.phone}
                  </Text>
                )}

                {/* WORKLOAD */}
                <View style={styles.workloadCard}>
                  <View style={styles.workloadHeader}>
                    <Text style={styles.workloadTitle}>
                      Complaint Workload
                    </Text>

                    <Text
                      style={styles.workloadActiveText}
                    >
                      Active: {stats.activeWorkload}
                    </Text>
                  </View>

                  <View style={styles.statsGrid}>
                    <View style={styles.miniStat}>
                      <Text style={styles.miniStatValue}>
                        {stats.open}
                      </Text>
                      <Text style={styles.miniStatLabel}>
                        Open
                      </Text>
                    </View>

                    <View style={styles.miniStat}>
                      <Text style={styles.miniStatValue}>
                        {stats.assigned}
                      </Text>
                      <Text style={styles.miniStatLabel}>
                        Assigned
                      </Text>
                    </View>

                    <View style={styles.miniStat}>
                      <Text style={styles.miniStatValue}>
                        {stats.inProgress}
                      </Text>
                      <Text style={styles.miniStatLabel}>
                        In Progress
                      </Text>
                    </View>

                    <View style={styles.miniStat}>
                      <Text style={styles.miniStatValue}>
                        {stats.resolved}
                      </Text>
                      <Text style={styles.miniStatLabel}>
                        Resolved
                      </Text>
                    </View>

                    <View style={styles.miniStat}>
                      <Text style={styles.miniStatValue}>
                        {stats.closed}
                      </Text>
                      <Text style={styles.miniStatLabel}>
                        Closed
                      </Text>
                    </View>
                  </View>
                </View>

                <View
                  style={styles.staffActionRow}
                >
                  <Text style={styles.roleText}>
                    Maintenance Staff
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      member.isActive
                        ? styles.deactivateButton
                        : styles.activateButton,
                    ]}
                    onPress={() =>
                      handleToggleStatus(member)
                    }
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.toggleButtonText,
                        member.isActive
                          ? styles.deactivateButtonText
                          : styles.activateButtonText,
                      ]}
                    >
                      {member.isActive
                        ? "Deactivate"
                        : "Activate"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },

  content: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 50,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
  },

  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 15,
  },

  backButton: {
    alignSelf: "flex-start",
    marginBottom: 20,
  },

  backText: {
    color: "#2563EB",
    fontSize: 16,
    fontWeight: "600",
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
    color: "#1E293B",
  },

  subtitle: {
    fontSize: 15,
    color: "#64748B",
    marginTop: 5,
  },

  countBadge: {
    backgroundColor: "#DBEAFE",
    minWidth: 65,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  countText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1D4ED8",
  },

  countLabel: {
    fontSize: 11,
    color: "#475569",
    marginTop: 2,
  },

  createButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 25,
  },

  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },

  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  formTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
  },

  cancelText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "600",
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 7,
    marginTop: 12,
  },

  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: "#1E293B",
    backgroundColor: "#FFFFFF",
  },

  submitButton: {
    backgroundColor: "#16A34A",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 22,
  },

  disabledButton: {
    opacity: 0.6,
  },

  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 15,
  },

  staffCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    flexDirection: "row",
  },

  avatar: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },

  avatarText: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1D4ED8",
  },

  staffInfo: {
    flex: 1,
  },

  staffName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 5,
  },

  staffEmail: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 4,
  },

  staffPhone: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 8,
  },

  staffBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 5,
  },

  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },

  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#16A34A",
    marginRight: 5,
  },

  activeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#15803D",
  },

  roleText: {
    fontSize: 12,
    color: "#64748B",
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  inactiveStaffCard: {
    opacity: 0.92,
  },

  inactiveAvatar: {
    backgroundColor: "#E2E8F0",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },

  activeStatusBadge: {
    backgroundColor: "#DCFCE7",
  },

  inactiveStatusBadge: {
    backgroundColor: "#FEE2E2",
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },

  inactiveDot: {
    backgroundColor: "#DC2626",
  },

  inactiveText: {
    color: "#B91C1C",
  },

  workloadCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },

  workloadHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  workloadTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },

  workloadActiveText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563EB",
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  miniStat: {
    minWidth: 70,
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 9,
    paddingVertical: 9,
    paddingHorizontal: 8,
    alignItems: "center",
  },

  miniStatValue: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#0F172A",
  },

  miniStatLabel: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
    textAlign: "center",
  },

  staffActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },

  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },

  deactivateButton: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
  },

  activateButton: {
    backgroundColor: "#F0FDF4",
    borderColor: "#86EFAC",
  },

  toggleButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },

  deactivateButtonText: {
    color: "#B91C1C",
  },

  activateButtonText: {
    color: "#15803D",
  },

  totalStaffText: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#334155",
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
});                                         