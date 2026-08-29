import React, {
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
  TextInput,
  RefreshControl,
} from "react-native";

import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";

import axios from "axios";

import AsyncStorage from
  "@react-native-async-storage/async-storage";

// ==================================================
// API
// ==================================================

const API_URL =
  "http://192.168.31.239:5000";

// ==================================================
// TYPES
// ==================================================

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: string;
}

interface Student {
  user?: User | null;
}

interface Room {
  id: string;
  roomNumber?: string;
}

interface Category {
  id: string;
  name: string;
}

interface MaintenanceStaff {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role?: string;
}

interface Assignment {
  id: string;

  assignedTo?:
    | string
    | MaintenanceStaff;

  assignedStaff?:
    MaintenanceStaff;

  assignedAt?: string;
  unassignedAt?: string | null;
}

interface Complaint {
  id: string;

  complaintNumber?: string;
  complaintNo?: string;

  title: string;
  description: string;

  status: string;
  priority: string;

  room?: Room | null;

  category?: Category | null;

  student?: Student | null;

  assignments?: Assignment[];

  resolution?: any;
}

// ==================================================
// COMPONENT
// ==================================================

export default function MaintenanceComplaintDetails() {

  const { id } =
    useLocalSearchParams<{
      id: string;
    }>();

  // ==================================================
  // STATE
  // ==================================================

  const [complaint, setComplaint] =
    useState<Complaint | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [updating, setUpdating] =
    useState(false);

  const [assigning, setAssigning] =
    useState(false);

  const [remark, setRemark] =
    useState("");

  const [userRole, setUserRole] =
    useState("");

  const [roleLoaded, setRoleLoaded] =
    useState(false);

  const [staff, setStaff] =
    useState<MaintenanceStaff[]>([]);

  const [selectedStaff, setSelectedStaff] =
    useState("");

  // ==================================================
  // GET LOGGED-IN USER
  // ==================================================

  const getLoggedInUser = async () => {
    try {
      const storedUser =
        await AsyncStorage.getItem("user");

      console.log(
        "================================"
      );

      console.log(
        "GET LOGGED-IN USER"
      );

      console.log(
        "Stored user:",
        storedUser
      );

      if (!storedUser) {
        setUserRole("");
        setRoleLoaded(true);
        return null;
      }

      const user =
        JSON.parse(storedUser);

      const role =
        String(user?.role || "")
          .trim()
          .toUpperCase();

      console.log(
        "Logged-in user:",
        user
      );

      console.log(
        "Logged-in role:",
        role
      );

      console.log(
        "================================"
      );

      setUserRole(role);
      setRoleLoaded(true);

      return {
        ...user,
        role,
      };

    } catch (error) {

      console.log(
        "Get logged-in user error:",
        error
      );

      setUserRole("");
      setRoleLoaded(true);

      return null;
    }
  };

  // ==================================================
  // FETCH COMPLAINT
  // ==================================================

  const fetchComplaint = async () => {

    try {

      if (!id) {
        console.log(
          "Complaint ID missing"
        );

        return;
      }

      const token =
        await AsyncStorage.getItem(
          "token"
        );

      if (!token) {

        Alert.alert(
          "Authentication Error",
          "Please login again."
        );

        router.replace(
          "/maintenance-login"
        );

        return;
      }

      console.log(
        "================================"
      );

      console.log(
        "FETCHING COMPLAINT"
      );

      console.log(
        "Complaint ID:",
        id
      );

      console.log(
        "================================"
      );

      const response =
        await axios.get(
          `${API_URL}/api/complaints/${id}`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      console.log(
        "Complaint response:",
        response.data
      );

      const data =
        response.data?.data ||
        response.data;

      setComplaint(data);

    } catch (error: any) {

      console.log(
        "Fetch complaint error:",
        error?.response?.data ||
          error?.message
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Failed to load complaint details."
      );

    } finally {

      setLoading(false);
      setRefreshing(false);
    }
  };

  // ==================================================
  // FETCH MAINTENANCE STAFF
  //
  // IMPORTANT:
  // ONLY ADMIN SHOULD CALL THIS.
  // ==================================================

  const fetchMaintenanceStaff =
    async () => {

      try {

        // NEVER fetch staff for
        // maintenance staff users.

        if (
          userRole !== "ADMIN"
        ) {
          console.log(
            "Skipping maintenance staff fetch because user is not ADMIN."
          );

          return;
        }

        const token =
          await AsyncStorage.getItem(
            "token"
          );

        if (!token) {
          return;
        }

        console.log(
          "Fetching maintenance staff for ADMIN..."
        );

        const response =
          await axios.get(
            `${API_URL}/api/auth/maintenance-staff`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        console.log(
          "Maintenance staff response:",
          response.data
        );

        const staffData =
          response.data?.data ||
          response.data ||
          [];

        if (
          Array.isArray(staffData)
        ) {

          setStaff(
            staffData
          );

          if (
            staffData.length > 0
          ) {

            setSelectedStaff(
              current =>
                current ||
                staffData[0].id
            );
          }

        } else {

          setStaff([]);
        }

      } catch (error: any) {

        console.log(
          "Fetch maintenance staff error:",
          error?.response?.data ||
            error?.message
        );

        setStaff([]);
      }
    };

  // ==================================================
  // INITIAL LOAD
  //
  // ROLE FIRST
  // THEN COMPLAINT
  // THEN STAFF ONLY FOR ADMIN
  // ==================================================

  useEffect(() => {

    const loadPage =
      async () => {

        setLoading(true);

        const user =
          await getLoggedInUser();

        await fetchComplaint();

        if (
          user?.role === "ADMIN"
        ) {

          await fetchMaintenanceStaff();

        } else {

          setStaff([]);
          setSelectedStaff("");
        }

      };

    loadPage();

  }, [id]);

  // ==================================================
  // REFRESH WHEN SCREEN FOCUSES
  // ==================================================

  useFocusEffect(
    useCallback(() => {

      if (!roleLoaded) {
        return;
      }

      fetchComplaint();

    }, [id, roleLoaded])
  );

  // ==================================================
  // ASSIGN COMPLAINT
  // ADMIN ONLY
  // ==================================================

  const handleAssignComplaint =
    async () => {

      console.log(
        "================================"
      );

      console.log(
        "ASSIGN COMPLAINT BUTTON CLICKED"
      );

      console.log(
        "User role:",
        userRole
      );

      console.log(
        "Complaint ID:",
        id
      );

      console.log(
        "Selected staff:",
        selectedStaff
      );

      console.log(
        "================================"
      );

      // ----------------------------------------------
      // ADMIN CHECK
      // ----------------------------------------------

      if (
        userRole !== "ADMIN"
      ) {

        Alert.alert(
          "Access Denied",
          "Only admin can assign complaints."
        );

        return;
      }

      // ----------------------------------------------
      // COMPLAINT ID
      // ----------------------------------------------

      if (!id) {

        Alert.alert(
          "Error",
          "Complaint ID is missing."
        );

        return;
      }

      // ----------------------------------------------
      // STAFF CHECK
      // ----------------------------------------------

      if (!selectedStaff) {

        Alert.alert(
          "Select Staff",
          "Please select a maintenance staff member."
        );

        return;
      }

      try {

        setAssigning(true);

        const token =
          await AsyncStorage.getItem(
            "token"
          );

        if (!token) {

          Alert.alert(
            "Authentication Error",
            "Please login again."
          );

          return;
        }

        // ------------------------------------------
        // ASSIGNMENT REQUEST
        //
        // POST:
        // /api/complaints/:id/assign
        // ------------------------------------------

        const url =
          `${API_URL}/api/complaints/${id}/assign`;

        console.log(
          "Assignment URL:",
          url
        );

        console.log(
          "Assignment body:",
          {
            assignedTo:
              selectedStaff,
          }
        );

        const response =
          await axios.post(
            url,
            {
              assignedTo:
                selectedStaff,
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

        console.log(
          "Assignment response:",
          response.data
        );

        if (
          response.data?.success === false
        ) {

          Alert.alert(
            "Assignment Failed",
            response.data?.message ||
              "Failed to assign complaint."
          );

          return;
        }

        // ------------------------------------------
        // FIND STAFF
        // ------------------------------------------

        const selectedMember =
          staff.find(
            member =>
              member.id ===
              selectedStaff
          );

        const staffName =
          selectedMember
            ? `${selectedMember.firstName} ${selectedMember.lastName}`.trim()
            : "Maintenance Staff";

        // ------------------------------------------
        // UPDATE LOCAL UI
        // ------------------------------------------

        setComplaint(
          previous => {

            if (!previous) {
              return previous;
            }

            return {
              ...previous,

              status:
                "ASSIGNED",

              assignments:
                [
                  {
                    id:
                      `local-${Date.now()}`,

                    assignedTo:
                      selectedStaff,

                    assignedStaff:
                      selectedMember,

                    assignedAt:
                      new Date().toISOString(),

                    unassignedAt:
                      null,
                  },

                  ...(previous.assignments ||
                    []),
                ],
            };
          }
        );

        // ------------------------------------------
        // SUCCESS
        // ------------------------------------------

        Alert.alert(
          "Complaint Assigned!",
          `Complaint has been successfully assigned to ${staffName}.`,
          [
            {
              text: "OK",

              onPress:
                async () => {

                  await fetchComplaint();

                  router.replace(
                    "/maintenance"
                  );
                },
            },
          ]
        );

      } catch (error: any) {

        console.log(
          "================================"
        );

        console.log(
          "ASSIGNMENT ERROR"
        );

        console.log(
          "Status:",
          error?.response?.status
        );

        console.log(
          "Response:",
          error?.response?.data
        );

        console.log(
          "Message:",
          error?.message
        );

        console.log(
          "================================"
        );

        Alert.alert(
          "Assignment Failed",
          error?.response?.data?.message ||
            error?.message ||
            "Failed to assign complaint."
        );

      } finally {

        setAssigning(false);
      }
    };

  // ==================================================
  // UPDATE STATUS
  //
  // MAINTENANCE STAFF ONLY
  // ==================================================

  const updateStatus =
    async (
      newStatus: string
    ) => {

      console.log(
        "================================"
      );

      console.log(
        "STATUS UPDATE"
      );

      console.log(
        "Role:",
        userRole
      );

      console.log(
        "Complaint:",
        id
      );

      console.log(
        "New status:",
        newStatus
      );

      console.log(
        "Remark:",
        remark
      );

      console.log(
        "================================"
      );

      // ----------------------------------------------
      // ROLE CHECK
      // ----------------------------------------------

      if (
        userRole !==
        "MAINTENANCE_STAFF"
      ) {

        Alert.alert(
          "Access Denied",
          "Only maintenance staff can update complaint status."
        );

        return;
      }

      // ----------------------------------------------
      // ID CHECK
      // ----------------------------------------------

      if (!id) {

        Alert.alert(
          "Error",
          "Complaint ID is missing."
        );

        return;
      }

      try {

        setUpdating(true);

        const token =
          await AsyncStorage.getItem(
            "token"
          );

        if (!token) {

          Alert.alert(
            "Authentication Error",
            "Please login again."
          );

          return;
        }

        // ------------------------------------------
        // UPDATE STATUS
        // ------------------------------------------

        const response =
          await axios.put(
            `${API_URL}/api/complaints/${id}/status`,
            {
              status:
                newStatus,

              remark:
                remark.trim(),

              remarks:
                remark.trim(),
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

        console.log(
          "Status response:",
          response.data
        );

        if (
          response.data?.success === false
        ) {

          Alert.alert(
            "Update Failed",
            response.data?.message ||
              "Failed to update complaint."
          );

          return;
        }

        // ------------------------------------------
        // UPDATE LOCAL STATE
        // ------------------------------------------

        setComplaint(
          previous => {

            if (!previous) {
              return previous;
            }

            return {
              ...previous,

              status:
                newStatus,
            };
          }
        );

        setRemark("");

        // ------------------------------------------
        // SUCCESS MESSAGE
        // ------------------------------------------

        Alert.alert(
          "Success",
          `Complaint status changed to ${newStatus.replace(
            /_/g,
            " "
          )}.`
        );

        // ------------------------------------------
        // REFRESH
        // ------------------------------------------

        await fetchComplaint();

      } catch (error: any) {

        console.log(
          "Status update error:",
          error?.response?.data ||
            error?.message
        );

        Alert.alert(
          "Error",
          error?.response?.data?.message ||
            error?.message ||
            "Failed to update complaint status."
        );

      } finally {

        setUpdating(false);
      }
    };

  // ==================================================
  // REFRESH
  // ==================================================

  const handleRefresh =
    () => {

      setRefreshing(true);

      fetchComplaint();
    };

  // ==================================================
  // STATUS COLOR
  // ==================================================

  const getStatusColor =
    (
      status?: string
    ) => {

      switch (
        status?.toUpperCase()
      ) {

        case "OPEN":
          return "#F59E0B";

        case "PENDING":
          return "#F59E0B";

        case "ASSIGNED":
          return "#7C3AED";

        case "IN_PROGRESS":
          return "#2563EB";

        case "RESOLVED":
          return "#16A34A";

        case "CLOSED":
          return "#64748B";

        case "REOPENED":
          return "#F97316";

        case "CANCELLED":
          return "#DC2626";

        default:
          return "#64748B";
      }
    };

  // ==================================================
  // LOADING
  // ==================================================

  if (
    loading ||
    !roleLoaded
  ) {

    return (
      <View
        style={styles.center}
      >

        <ActivityIndicator
          size="large"
          color="#2563EB"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading complaint...
        </Text>

      </View>
    );
  }

  // ==================================================
  // NOT FOUND
  // ==================================================

  if (!complaint) {

    return (
      <View
        style={styles.center}
      >

        <Text
          style={
            styles.errorText
          }
        >
          Complaint not found.
        </Text>

        <TouchableOpacity
          style={
            styles.backButton
          }
          onPress={() =>
            router.back()
          }
        >

          <Text
            style={
              styles.backButtonText
            }
          >
            ← Back
          </Text>

        </TouchableOpacity>

      </View>
    );
  }

  // ==================================================
  // DATA
  // ==================================================

  const studentUser =
    complaint.student?.user;

  const currentStatus =
    String(
      complaint.status || ""
    ).toUpperCase();

  const isAdmin =
    userRole === "ADMIN";

  const isMaintenanceStaff =
    userRole ===
    "MAINTENANCE_STAFF";

  // Find active assignment
  const activeAssignment =
    complaint.assignments?.find(
      assignment =>
        assignment.unassignedAt ===
          null ||
        assignment.unassignedAt ===
          undefined
    );

  let assignedStaff:
    MaintenanceStaff | undefined;

  if (
    activeAssignment?.assignedStaff
  ) {

    assignedStaff =
      activeAssignment.assignedStaff;

  } else if (
    activeAssignment?.assignedTo &&
    typeof activeAssignment.assignedTo ===
      "object"
  ) {

    assignedStaff =
      activeAssignment.assignedTo;
  }

  // ==================================================
  // MAIN UI
  // ==================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
      refreshControl={
        <RefreshControl
          refreshing={
            refreshing
          }
          onRefresh={
            handleRefresh
          }
        />
      }
    >

      {/* ==========================================
          BACK
      ========================================== */}

      <TouchableOpacity
        style={
          styles.backButton
        }
        onPress={() =>
          router.back()
        }
      >

        <Text
          style={
            styles.backButtonText
          }
        >
          ← Back
        </Text>

      </TouchableOpacity>

      {/* ==========================================
          COMPLAINT HEADER
      ========================================== */}

      <View
        style={styles.card}
      >

        <Text
          style={styles.title}
        >
          {complaint.title}
        </Text>

        <Text
          style={
            styles.complaintId
          }
        >
          Complaint ID:{" "}
          {complaint.complaintNumber ||
            complaint.complaintNo ||
            complaint.id}
        </Text>

        <View
          style={
            styles.badgeContainer
          }
        >

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
                styles.badgeText
              }
            >
              {complaint.status?.replace(
                /_/g,
                " "
              )}
            </Text>

          </View>

          <View
            style={
              styles.priorityBadge
            }
          >

            <Text
              style={
                styles.badgeText
              }
            >
              {complaint.priority}
            </Text>

          </View>

        </View>

      </View>

      {/* ==========================================
          DESCRIPTION
      ========================================== */}

      <View
        style={styles.card}
      >

        <Text
          style={
            styles.sectionTitle
          }
        >
          Complaint Description
        </Text>

        <Text
          style={
            styles.description
          }
        >
          {complaint.description}
        </Text>

      </View>

      {/* ==========================================
          COMPLAINT INFORMATION
      ========================================== */}

      <View
        style={styles.card}
      >

        <Text
          style={
            styles.sectionTitle
          }
        >
          Complaint Information
        </Text>

        <InfoRow
          label="Complaint Number"
          value={
            complaint.complaintNumber ||
            complaint.complaintNo ||
            "Not available"
          }
        />

        <InfoRow
          label="Room"
          value={
            complaint.room?.roomNumber ||
            "Not available"
          }
        />

        <InfoRow
          label="Category"
          value={
            complaint.category?.name ||
            "Not available"
          }
        />

        <InfoRow
          label="Priority"
          value={
            complaint.priority ||
            "Not available"
          }
        />

      </View>

      {/* ==========================================
          STUDENT INFORMATION
      ========================================== */}

      <View
        style={styles.card}
      >

        <Text
          style={
            styles.sectionTitle
          }
        >
          Student Information
        </Text>

        <InfoRow
          label="Name"
          value={
            studentUser
              ? `${studentUser.firstName || ""} ${
                  studentUser.lastName || ""
                }`.trim() ||
                "Not available"
              : "Not available"
          }
        />

        <InfoRow
          label="Email"
          value={
            studentUser?.email ||
            "Not available"
          }
        />

        <InfoRow
          label="Phone"
          value={
            studentUser?.phone ||
            "Not available"
          }
        />

      </View>

      {/* =================================================
          ADMIN ONLY
          ASSIGN MAINTENANCE STAFF
      ================================================= */}

      {isAdmin &&
        currentStatus !==
          "CLOSED" &&
        currentStatus !==
          "CANCELLED" && (

          <View
            style={styles.card}
          >

            <Text
              style={
                styles.sectionTitle
              }
            >
              Assign Maintenance Staff
            </Text>

            {staff.length === 0 ? (

              <View>

                <Text
                  style={
                    styles.noStaffText
                  }
                >
                  No maintenance staff
                  available.
                </Text>

                <TouchableOpacity
                  style={
                    styles.refreshStaffButton
                  }
                  onPress={
                    fetchMaintenanceStaff
                  }
                  disabled={
                    assigning
                  }
                >

                  <Text
                    style={
                      styles.buttonText
                    }
                  >
                    Refresh Staff
                  </Text>

                </TouchableOpacity>

              </View>

            ) : (

              <>

                {staff.map(
                  member => {

                    const isSelected =
                      selectedStaff ===
                      member.id;

                    return (
                      <TouchableOpacity
                        key={
                          member.id
                        }
                        activeOpacity={
                          0.8
                        }
                        style={[
                          styles.staffButton,

                          isSelected &&
                            styles.staffButtonSelected,
                        ]}
                        onPress={() =>
                          setSelectedStaff(
                            member.id
                          )
                        }
                        disabled={
                          assigning
                        }
                      >

                        <View
                          style={
                            styles.staffInfo
                          }
                        >

                          <Text
                            style={[
                              styles.staffName,

                              isSelected &&
                                styles.staffNameSelected,
                            ]}
                          >
                            {
                              member.firstName
                            }{" "}
                            {
                              member.lastName
                            }
                          </Text>

                          <Text
                            style={[
                              styles.staffEmail,

                              isSelected &&
                                styles.staffEmailSelected,
                            ]}
                          >
                            {
                              member.email ||
                              "No email"
                            }
                          </Text>

                          {member.phone && (
                            <Text
                              style={[
                                styles.staffPhone,

                                isSelected &&
                                  styles.staffEmailSelected,
                              ]}
                            >
                              {
                                member.phone
                              }
                            </Text>
                          )}

                        </View>

                        <View
                          style={[
                            styles.radioOuter,

                            isSelected &&
                              styles.radioOuterSelected,
                          ]}
                        >

                          {isSelected && (
                            <View
                              style={
                                styles.radioInner
                              }
                            />
                          )}

                        </View>

                      </TouchableOpacity>
                    );
                  }
                )}

                <TouchableOpacity
                  activeOpacity={
                    0.8
                  }
                  style={[
                    styles.assignButton,

                    assigning &&
                      styles.disabledButton,
                  ]}
                  onPress={
                    handleAssignComplaint
                  }
                  disabled={
                    assigning
                  }
                >

                  {assigning ? (

                    <View
                      style={
                        styles.loadingButtonContent
                      }
                    >

                      <ActivityIndicator
                        color="#FFFFFF"
                      />

                      <Text
                        style={[
                          styles.buttonText,
                          {
                            marginLeft: 10,
                          },
                        ]}
                      >
                        Assigning...
                      </Text>

                    </View>

                  ) : (

                    <Text
                      style={
                        styles.buttonText
                      }
                    >
                      Assign Complaint
                    </Text>

                  )}

                </TouchableOpacity>

              </>

            )}

          </View>
        )}

      {/* =================================================
          ASSIGNED STAFF
          VISIBLE TO ADMIN AND MAINTENANCE STAFF
      ================================================= */}

      {assignedStaff && (

        <View
          style={styles.card}
        >

          <Text
            style={
              styles.sectionTitle
            }
          >
            Assigned Maintenance Staff
          </Text>

          <InfoRow
            label="Name"
            value={
              `${assignedStaff.firstName} ${assignedStaff.lastName}`.trim()
            }
          />

          <InfoRow
            label="Email"
            value={
              assignedStaff.email ||
              "Not available"
            }
          />

          {assignedStaff.phone && (
            <InfoRow
              label="Phone"
              value={
                assignedStaff.phone
              }
            />
          )}

        </View>
      )}

      {/* =================================================
          MAINTENANCE STAFF ONLY
          WORK ACTIONS
      ================================================= */}

      {isMaintenanceStaff && (

        <>

          {/* ==========================================
              WORK REMARK
          ========================================== */}

          {currentStatus !==
            "RESOLVED" &&
            currentStatus !==
              "CLOSED" &&
            currentStatus !==
              "CANCELLED" && (

            <View
              style={styles.card}
            >

              <Text
                style={
                  styles.sectionTitle
                }
              >
                Add Work Remark
              </Text>

              <TextInput
                style={
                  styles.remarkInput
                }
                placeholder={
                  "Example: Started repairing the issue..."
                }
                placeholderTextColor="#94A3B8"
                multiline
                value={remark}
                onChangeText={
                  setRemark
                }
                editable={
                  !updating
                }
              />

            </View>
          )}

          {/* ==========================================
              UPDATE STATUS
          ========================================== */}

          <View
            style={styles.card}
          >

            <Text
              style={
                styles.sectionTitle
              }
            >
              Update Complaint Status
            </Text>

            {/* ======================================
                ASSIGNED → START WORK
            ====================================== */}

            {currentStatus ===
              "ASSIGNED" && (

              <TouchableOpacity
                style={[
                  styles.startButton,

                  updating &&
                    styles.disabledButton,
                ]}
                disabled={
                  updating
                }
                onPress={() =>
                  updateStatus(
                    "IN_PROGRESS"
                  )
                }
              >

                {updating ? (

                  <ActivityIndicator
                    color="#FFFFFF"
                  />

                ) : (

                  <Text
                    style={
                      styles.buttonText
                    }
                  >
                    Start Work
                  </Text>

                )}

              </TouchableOpacity>
            )}

            {/* ======================================
                IN PROGRESS → RESOLVE
            ====================================== */}

            {currentStatus ===
              "IN_PROGRESS" && (

              <TouchableOpacity
                style={[
                  styles.resolveButton,

                  updating &&
                    styles.disabledButton,
                ]}
                disabled={
                  updating
                }
                onPress={() =>
                  updateStatus(
                    "RESOLVED"
                  )
                }
              >

                {updating ? (

                  <ActivityIndicator
                    color="#FFFFFF"
                  />

                ) : (

                  <Text
                    style={
                      styles.buttonText
                    }
                  >
                    Mark as Resolved
                  </Text>

                )}

              </TouchableOpacity>
            )}

            {/* ======================================
                RESOLVED
            ====================================== */}

            {currentStatus ===
              "RESOLVED" && (

              <View
                style={
                  styles.completedContainer
                }
              >

                <Text
                  style={
                    styles.completedText
                  }
                >
                  ✓ This complaint has
                  been resolved successfully.
                </Text>

              </View>
            )}

            {/* ======================================
                CLOSED
            ====================================== */}

            {currentStatus ===
              "CLOSED" && (

              <View
                style={
                  styles.completedContainer
                }
              >

                <Text
                  style={
                    styles.completedText
                  }
                >
                  This complaint is closed.
                </Text>

              </View>
            )}

          </View>

        </>
      )}

      {/* =================================================
          ADMIN INFORMATION
      ================================================= */}

      {isAdmin && (

        <View
          style={
            styles.adminCard
          }
        >

          <Text
            style={
              styles.adminText
            }
          >
            Admin access: You can assign
            this complaint to a maintenance
            staff member.
          </Text>

        </View>
      )}

      {/* =================================================
          CURRENT STATUS
      ================================================= */}

      <View
        style={styles.card}
      >

        <Text
          style={
            styles.sectionTitle
          }
        >
          Current Status
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
              styles.badgeText
            }
          >
            {complaint.status?.replace(
              /_/g,
              " "
            )}
          </Text>

        </View>

      </View>

      {/* =================================================
          REFRESH
      ================================================= */}

      <TouchableOpacity
        style={
          styles.refreshButton
        }
        onPress={
          handleRefresh
        }
        disabled={
          refreshing
        }
      >

        <Text
          style={
            styles.buttonText
          }
        >
          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </Text>

      </TouchableOpacity>

    </ScrollView>
  );
}

// ==================================================
// INFO ROW
// ==================================================

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (

    <View
      style={
        styles.infoRow
      }
    >

      <Text
        style={
          styles.infoLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.infoValue
        }
      >
        {value}
      </Text>

    </View>
  );
}

// ==================================================
// STYLES
// ==================================================

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
      paddingBottom: 50,
    },

    center: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
      backgroundColor:
        "#F1F5F9",
      padding: 20,
    },

    loadingText: {
      marginTop: 15,
      fontSize: 16,
      color: "#64748B",
    },

    errorText: {
      fontSize: 18,
      color: "#DC2626",
      marginBottom: 20,
      textAlign: "center",
    },

    backButton: {
      alignSelf:
        "flex-start",
      backgroundColor:
        "#E2E8F0",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
      marginBottom: 20,
    },

    backButtonText: {
      color: "#334155",
      fontWeight: "bold",
      fontSize: 15,
    },

    card: {
      backgroundColor:
        "#FFFFFF",
      borderRadius: 16,
      padding: 18,
      marginBottom: 16,
    },

    title: {
      fontSize: 25,
      fontWeight: "bold",
      color: "#1E293B",
      marginBottom: 8,
    },

    complaintId: {
      fontSize: 13,
      color: "#64748B",
      marginBottom: 16,
    },

    badgeContainer: {
      flexDirection:
        "row",
      gap: 10,
    },

    statusBadge: {
      alignSelf:
        "flex-start",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
    },

    priorityBadge: {
      backgroundColor:
        "#F59E0B",
      alignSelf:
        "flex-start",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
    },

    badgeText: {
      color: "#FFFFFF",
      fontWeight: "bold",
      fontSize: 12,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#334155",
      marginBottom: 15,
    },

    description: {
      fontSize: 16,
      lineHeight: 24,
      color: "#64748B",
    },

    infoRow: {
      borderBottomWidth: 1,
      borderBottomColor:
        "#E2E8F0",
      paddingVertical: 12,
    },

    infoLabel: {
      fontSize: 13,
      fontWeight: "bold",
      color: "#64748B",
      marginBottom: 5,
      textTransform:
        "uppercase",
    },

    infoValue: {
      fontSize: 16,
      color: "#1E293B",
    },

    // ================================================
    // ADMIN ASSIGNMENT
    // ================================================

    staffButton: {
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#CBD5E1",
      borderRadius: 12,
      padding: 15,
      marginBottom: 10,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    staffButtonSelected: {
      backgroundColor:
        "#2563EB",
      borderColor:
        "#2563EB",
    },

    staffInfo: {
      flex: 1,
      paddingRight: 12,
    },

    staffName: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#1E293B",
    },

    staffNameSelected: {
      color: "#FFFFFF",
    },

    staffEmail: {
      marginTop: 4,
      fontSize: 13,
      color: "#64748B",
    },

    staffEmailSelected: {
      color: "#DBEAFE",
    },

    staffPhone: {
      marginTop: 3,
      fontSize: 13,
      color: "#64748B",
    },

    radioOuter: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor:
        "#94A3B8",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    radioOuterSelected: {
      borderColor:
        "#FFFFFF",
    },

    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor:
        "#FFFFFF",
    },

    assignButton: {
      backgroundColor:
        "#16A34A",
      paddingVertical: 16,
      borderRadius: 10,
      alignItems:
        "center",
      justifyContent:
        "center",
      marginTop: 8,
      minHeight: 52,
    },

    loadingButtonContent: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    refreshStaffButton: {
      backgroundColor:
        "#64748B",
      paddingVertical: 13,
      borderRadius: 10,
      alignItems:
        "center",
    },

    noStaffText: {
      color: "#64748B",
      fontSize: 15,
      marginBottom: 12,
    },

    disabledButton: {
      opacity: 0.6,
    },

    // ================================================
    // MAINTENANCE STAFF
    // ================================================

    remarkInput: {
      minHeight: 120,
      borderWidth: 1,
      borderColor:
        "#CBD5E1",
      borderRadius: 12,
      padding: 15,
      textAlignVertical:
        "top",
      fontSize: 16,
      color: "#1E293B",
    },

    startButton: {
      backgroundColor:
        "#2563EB",
      paddingVertical: 16,
      borderRadius: 10,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    resolveButton: {
      backgroundColor:
        "#16A34A",
      paddingVertical: 16,
      borderRadius: 10,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    completedContainer: {
      backgroundColor:
        "#DCFCE7",
      padding: 15,
      borderRadius: 10,
    },

    completedText: {
      color: "#166534",
      fontSize: 15,
      fontWeight: "bold",
      textAlign: "center",
      lineHeight: 22,
    },

    // ================================================
    // ADMIN MESSAGE
    // ================================================

    adminCard: {
      backgroundColor:
        "#DBEAFE",
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },

    adminText: {
      color: "#1E40AF",
      fontSize: 15,
      lineHeight: 22,
    },

    // ================================================
    // GENERAL BUTTON
    // ================================================

    buttonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "bold",
    },

    refreshButton: {
      backgroundColor:
        "#64748B",
      paddingVertical: 16,
      borderRadius: 10,
      alignItems:
        "center",
      justifyContent:
        "center",
      marginBottom: 20,
    },

  });