import { useEffect, useState } from "react";
import { useRouter } from "expo-router";

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const API_URL = "http://192.168.31.239:5000";

type PendingStudent = {
  id: string;
  userId: string;
  studentNumber: string;
  gender: "MALE" | "FEMALE";
  department?: string | null;
  course?: string | null;
  year?: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;

  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    isActive: boolean;
  };
};

export default function AdminDashboard() {
  const router = useRouter();

  const [pendingStudents, setPendingStudents] =
    useState<PendingStudent[]>([]);

  const [loadingPending, setLoadingPending] =
    useState(true);

  const [processingStudentId, setProcessingStudentId] =
    useState<string | null>(null);

  // ==========================================================
  // CHECK ADMIN SESSION
  // ==========================================================

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

      const user = JSON.parse(userString);

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
        return;
      }

      loadPendingStudents();
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

  // ==========================================================
  // LOAD PENDING STUDENTS
  // ==========================================================

  const loadPendingStudents = async () => {
    try {
      setLoadingPending(true);

      const token =
        await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      console.log(
        "Loading pending students..."
      );

      const response = await axios.get(
        `${API_URL}/api/students/pending`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "Pending students response:",
        response.data
      );

      if (response.data?.success) {
        setPendingStudents(
          response.data.data || []
        );
      } else {
        setPendingStudents([]);
      }
    } catch (error: any) {
      console.log(
        "Load pending students error:",
        error?.response?.data || error
      );

      if (error?.response?.status === 401) {
        await AsyncStorage.multiRemove([
          "token",
          "user",
        ]);

        router.replace("/login");
        return;
      }

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Unable to load pending student registrations."
      );
    } finally {
      setLoadingPending(false);
    }
  };

  // ==========================================================
  // APPROVE STUDENT
  // ==========================================================

  const handleApprove = async (
    student: PendingStudent
  ) => {
    try {
      console.log(
        "================================"
      );

      console.log(
        "Approve button clicked"
      );

      console.log(
        "Student ID:",
        student.id
      );

      console.log(
        "Student:",
        student.user.firstName,
        student.user.lastName
      );

      console.log(
        "Gender:",
        student.gender
      );

      setProcessingStudentId(
        student.id
      );

      const token =
        await AsyncStorage.getItem(
          "token"
        );

      if (!token) {
        console.log(
          "No admin token found"
        );

        Alert.alert(
          "Session Expired",
          "Please login again."
        );

        router.replace("/login");
        return;
      }

      console.log(
        "Sending approve request..."
      );

      const response =
        await axios.put(
          `${API_URL}/api/students/${student.id}/approve`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type":
                "application/json",
            },
          }
        );

      console.log(
        "Approve response:",
        response.data
      );

      if (response.data?.success) {
        console.log(
          "Student approved successfully"
        );

        setPendingStudents(
          (currentStudents) =>
            currentStudents.filter(
              (item) =>
                item.id !== student.id
            )
        );

        Alert.alert(
          "Student Approved",
          `${student.user.firstName} ${student.user.lastName} has been approved successfully.`
        );
      } else {
        Alert.alert(
          "Approval Failed",
          response.data?.message ||
            "Unable to approve student."
        );
      }
    } catch (error: any) {
      console.log(
        "Approve student error:",
        error?.response?.data ||
          error
      );

      console.log(
        "HTTP status:",
        error?.response?.status
      );

      if (
        error?.response?.status === 401
      ) {
        await AsyncStorage.multiRemove([
          "token",
          "user",
        ]);

        Alert.alert(
          "Session Expired",
          "Please login again."
        );

        router.replace("/login");
        return;
      }

      Alert.alert(
        "Approval Failed",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to approve student."
      );
    } finally {
      setProcessingStudentId(
        null
      );
    }
  };

  // ==========================================================
  // REJECT STUDENT
  // ==========================================================

  const handleReject = async (
    student: PendingStudent
  ) => {
    try {
      console.log(
        "Reject button clicked"
      );

      console.log(
        "Student ID:",
        student.id
      );

      console.log(
        "Gender:",
        student.gender
      );

      setProcessingStudentId(
        student.id
      );

      const token =
        await AsyncStorage.getItem(
          "token"
        );

      if (!token) {
        Alert.alert(
          "Session Expired",
          "Please login again."
        );

        router.replace("/login");
        return;
      }

      console.log(
        "Sending reject request..."
      );

      const response =
        await axios.put(
          `${API_URL}/api/students/${student.id}/reject`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type":
                "application/json",
            },
          }
        );

      console.log(
        "Reject response:",
        response.data
      );

      if (response.data?.success) {
        setPendingStudents(
          (currentStudents) =>
            currentStudents.filter(
              (item) =>
                item.id !== student.id
            )
        );

        Alert.alert(
          "Registration Rejected",
          `${student.user.firstName} ${student.user.lastName}'s registration has been rejected.`
        );
      } else {
        Alert.alert(
          "Rejection Failed",
          response.data?.message ||
            "Unable to reject student."
        );
      }
    } catch (error: any) {
      console.log(
        "Reject student error:",
        error?.response?.data ||
          error
      );

      Alert.alert(
        "Rejection Failed",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to reject student."
      );
    } finally {
      setProcessingStudentId(
        null
      );
    }
  };

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove([
        "token",
        "user",
      ]);

      console.log(
        "Admin logout successful"
      );

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

  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  const formatDate = (
    dateString: string
  ) => {
    try {
      return new Date(
        dateString
      ).toLocaleString();
    } catch {
      return dateString;
    }
  };

  // ==========================================================
  // FORMAT GENDER
  // ==========================================================

  const formatGender = (
    gender: "MALE" | "FEMALE"
  ) => {
    return gender === "MALE"
      ? "Male"
      : "Female";
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
      showsVerticalScrollIndicator={
        false
      }
    >

      {/* ====================================================
          HEADER
      ==================================================== */}

      <View style={styles.header}>

        <View
          style={styles.headerContent}
        >
          <Text style={styles.title}>
            Admin Dashboard
          </Text>

          <Text style={styles.subtitle}>
            Manage hostel maintenance
            operations
          </Text>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text
            style={styles.logoutText}
          >
            Logout
          </Text>
        </TouchableOpacity>

      </View>


      {/* ====================================================
          PENDING STUDENT REGISTRATIONS
      ==================================================== */}

      <View
        style={styles.sectionHeader}
      >

        <View
          style={styles.sectionHeaderText}
        >
          <Text
            style={styles.sectionTitle}
          >
            Pending Student Registrations
          </Text>

          <Text
            style={styles.sectionSubtitle}
          >
            Review and approve new
            student accounts
          </Text>
        </View>

        <View
          style={styles.countBadge}
        >
          <Text
            style={styles.countText}
          >
            {pendingStudents.length}
          </Text>
        </View>

      </View>


      {/* ====================================================
          LOADING
      ==================================================== */}

      {loadingPending ? (

        <View
          style={styles.loadingCard}
        >
          <ActivityIndicator
            size="large"
            color="#2563EB"
          />

          <Text
            style={styles.loadingText}
          >
            Loading pending registrations...
          </Text>
        </View>

      ) : pendingStudents.length ===
        0 ? (

        /* ==================================================
            EMPTY STATE
        ================================================== */

        <View
          style={styles.emptyCard}
        >

          <View
            style={styles.emptyIconCircle}
          >
            <Text
              style={styles.emptyIcon}
            >
              ✓
            </Text>
          </View>

          <Text
            style={styles.emptyTitle}
          >
            No Pending Registrations
          </Text>

          <Text
            style={styles.emptyText}
          >
            There are currently no
            student registrations waiting
            for approval.
          </Text>

        </View>

      ) : (

        /* ==================================================
            STUDENT LIST
        ================================================== */

        pendingStudents.map(
          (student) => {

            const isProcessing =
              processingStudentId ===
              student.id;

            return (
              <View
                key={student.id}
                style={styles.studentCard}
              >

                {/* =================================================
                    STUDENT HEADER
                ================================================= */}

                <View
                  style={
                    styles.studentHeader
                  }
                >

                  <View
                    style={
                      styles.studentIconCircle
                    }
                  >
                    <Text
                      style={
                        styles.studentIcon
                      }
                    >
                      🎓
                    </Text>
                  </View>

                  <View
                    style={
                      styles.studentHeaderText
                    }
                  >

                    <Text
                      style={
                        styles.studentName
                      }
                    >
                      {
                        student.user
                          .firstName
                      }{" "}
                      {
                        student.user
                          .lastName
                      }
                    </Text>

                    <Text
                      style={
                        styles.studentEmail
                      }
                    >
                      {student.user.email}
                    </Text>

                  </View>

                  <View
                    style={
                      styles.pendingBadge
                    }
                  >
                    <Text
                      style={
                        styles.pendingBadgeText
                      }
                    >
                      PENDING
                    </Text>
                  </View>

                </View>


                {/* =================================================
                    STUDENT DETAILS
                ================================================= */}

                <View
                  style={styles.detailsBox}
                >

                  {/* STUDENT NUMBER */}

                  <View
                    style={
                      styles.detailRow
                    }
                  >
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      Student Number
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {
                        student.studentNumber
                      }
                    </Text>
                  </View>


                  {/* GENDER */}

                  <View
                    style={[
                      styles.detailRow,
                      styles.genderRow,
                    ]}
                  >
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      Gender
                    </Text>

                    <View
                      style={[
                        styles.genderBadge,
                        student.gender ===
                          "MALE"
                          ? styles.maleBadge
                          : styles.femaleBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.genderBadgeText,
                          student.gender ===
                            "MALE"
                            ? styles.maleText
                            : styles.femaleText,
                        ]}
                      >
                        {formatGender(
                          student.gender
                        )}
                      </Text>
                    </View>
                  </View>


                  {/* PHONE */}

                  <View
                    style={
                      styles.detailRow
                    }
                  >
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      Phone
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {student.user.phone ||
                        "Not provided"}
                    </Text>
                  </View>


                  {/* DEPARTMENT */}

                  <View
                    style={
                      styles.detailRow
                    }
                  >
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      Department
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {student.department ||
                        "Not provided"}
                    </Text>
                  </View>


                  {/* COURSE */}

                  <View
                    style={
                      styles.detailRow
                    }
                  >
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      Course
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {student.course ||
                        "Not provided"}
                    </Text>
                  </View>


                  {/* YEAR */}

                  <View
                    style={
                      styles.detailRow
                    }
                  >
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      Year
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {student.year
                        ? `Year ${student.year}`
                        : "Not provided"}
                    </Text>
                  </View>


                  {/* REGISTERED */}

                  <View
                    style={
                      styles.detailRow
                    }
                  >
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      Registered
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {formatDate(
                        student.createdAt
                      )}
                    </Text>
                  </View>

                </View>


                {/* =================================================
                    APPROVE / REJECT
                ================================================= */}

                <View
                  style={
                    styles.actionContainer
                  }
                >

                  {/* REJECT */}

                  <TouchableOpacity
                    style={[
                      styles.rejectButton,
                      isProcessing &&
                        styles.disabledButton,
                    ]}
                    onPress={() =>
                      handleReject(
                        student
                      )
                    }
                    disabled={
                      isProcessing
                    }
                    activeOpacity={0.8}
                  >

                    {isProcessing ? (
                      <ActivityIndicator
                        size="small"
                        color="#DC2626"
                      />
                    ) : (
                      <Text
                        style={
                          styles.rejectButtonText
                        }
                      >
                        Reject
                      </Text>
                    )}

                  </TouchableOpacity>


                  {/* APPROVE */}

                  <TouchableOpacity
                    style={[
                      styles.approveButton,
                      isProcessing &&
                        styles.disabledButton,
                    ]}
                    onPress={() =>
                      handleApprove(
                        student
                      )
                    }
                    disabled={
                      isProcessing
                    }
                    activeOpacity={0.8}
                  >

                    {isProcessing ? (
                      <ActivityIndicator
                        size="small"
                        color="#FFFFFF"
                      />
                    ) : (
                      <Text
                        style={
                          styles.approveButtonText
                        }
                      >
                        Approve
                      </Text>
                    )}

                  </TouchableOpacity>

                </View>

              </View>
            );
          }
        )
      )}


      {/* ====================================================
          MAINTENANCE COMPLAINTS
      ==================================================== */}

      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push(
            "/maintenance"
          )
        }
        activeOpacity={0.8}
      >

        <View
          style={styles.iconBox}
        >
          <Text style={styles.icon}>
            🔧
          </Text>
        </View>

        <View
          style={styles.cardContent}
        >
          <Text
            style={styles.cardTitle}
          >
            Maintenance Complaints
          </Text>

          <Text
            style={styles.cardDescription}
          >
            View, assign and manage
            maintenance complaints.
          </Text>
        </View>

        <Text style={styles.arrow}>
          →
        </Text>

      </TouchableOpacity>


      {/* ====================================================
          ROOM ALLOCATION
      ==================================================== */}

      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push(
            "/room-allocation"
          )
        }
        activeOpacity={0.8}
      >

        <View
          style={styles.iconBox}
        >
          <Text style={styles.icon}>
            🏠
          </Text>
        </View>

        <View
          style={styles.cardContent}
        >
          <Text
            style={styles.cardTitle}
          >
            Room Allocation
          </Text>

          <Text
            style={styles.cardDescription}
          >
            Allocate hostel rooms to
            approved students.
          </Text>
        </View>

        <Text style={styles.arrow}>
          →
        </Text>

      </TouchableOpacity>


      {/* ====================================================
          MAINTENANCE STAFF
      ==================================================== */}

      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push(
            "/maintenance-staff"
          )
        }
        activeOpacity={0.8}
      >

        <View
          style={styles.iconBox}
        >
          <Text style={styles.icon}>
            👷
          </Text>
        </View>

        <View
          style={styles.cardContent}
        >
          <Text
            style={styles.cardTitle}
          >
            Maintenance Staff
          </Text>

          <Text
            style={styles.cardDescription}
          >
            Create and manage
            maintenance staff members.
          </Text>
        </View>

        <Text style={styles.arrow}>
          →
        </Text>

      </TouchableOpacity>


      {/* ====================================================
          ADMIN RESPONSIBILITIES
      ==================================================== */}

      <View
        style={styles.infoCard}
      >

        <Text
          style={styles.infoTitle}
        >
          Admin Responsibilities
        </Text>

        <Text
          style={styles.infoText}
        >
          • Review student registrations
        </Text>

        <Text
          style={styles.infoText}
        >
          • Approve or reject students
        </Text>

        <Text
          style={styles.infoText}
        >
          • Allocate rooms to students
        </Text>

        <Text
          style={styles.infoText}
        >
          • Manage maintenance staff
        </Text>

        <Text
          style={styles.infoText}
        >
          • Assign complaints to staff
        </Text>

        <Text
          style={styles.infoText}
        >
          • Monitor complaint progress
        </Text>

        <Text
          style={styles.infoText}
        >
          • Review resolved complaints
        </Text>

      </View>


      {/* ====================================================
          BOTTOM LOGOUT
      ==================================================== */}

      <TouchableOpacity
        style={
          styles.logoutBottomButton
        }
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Text
          style={
            styles.logoutBottomText
          }
        >
          Logout
        </Text>
      </TouchableOpacity>

    </ScrollView>
  );
}


// ==========================================================
// STYLES
// ==========================================================

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

  // ========================================================
  // HEADER
  // ========================================================

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 25,
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

  // ========================================================
  // LOGOUT
  // ========================================================

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

  // ========================================================
  // PENDING SECTION
  // ========================================================

  sectionHeader: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,

    elevation: 2,
  },

  sectionHeaderText: {
    flex: 1,
    paddingRight: 10,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#1E293B",
  },

  sectionSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },

  countBadge: {
    minWidth: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },

  countText: {
    color: "#1D4ED8",
    fontSize: 16,
    fontWeight: "bold",
  },

  // ========================================================
  // LOADING
  // ========================================================

  loadingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 35,
    marginBottom: 20,
    alignItems: "center",
  },

  loadingText: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 12,
  },

  // ========================================================
  // EMPTY
  // ========================================================

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 30,
    marginBottom: 20,
    alignItems: "center",
  },

  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  emptyIcon: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#16A34A",
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 7,
  },

  emptyText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },

  // ========================================================
  // STUDENT CARD
  // ========================================================

  studentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,

    elevation: 3,
  },

  studentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  studentIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  studentIcon: {
    fontSize: 23,
  },

  studentHeaderText: {
    flex: 1,
  },

  studentName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
  },

  studentEmail: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 3,
  },

  pendingBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },

  pendingBadgeText: {
    color: "#B45309",
    fontSize: 10,
    fontWeight: "bold",
  },

  // ========================================================
  // DETAILS
  // ========================================================

  detailsBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 7,
  },

  genderRow: {
    alignItems: "center",
  },

  detailLabel: {
    fontSize: 13,
    color: "#64748B",
    flex: 1,
  },

  detailValue: {
    fontSize: 13,
    color: "#1E293B",
    fontWeight: "600",
    flex: 1.3,
    textAlign: "right",
  },

  // ========================================================
  // GENDER BADGE
  // ========================================================

  genderBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },

  maleBadge: {
    backgroundColor: "#DBEAFE",
  },

  femaleBadge: {
    backgroundColor: "#FCE7F3",
  },

  genderBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  maleText: {
    color: "#1D4ED8",
  },

  femaleText: {
    color: "#BE185D",
  },

  // ========================================================
  // ACTIONS
  // ========================================================

  actionContainer: {
    flexDirection: "row",
    gap: 10,
  },

  rejectButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  rejectButtonText: {
    color: "#DC2626",
    fontSize: 15,
    fontWeight: "bold",
  },

  approveButton: {
    flex: 1,
    height: 48,
    backgroundColor: "#16A34A",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  approveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },

  disabledButton: {
    opacity: 0.6,
  },

  // ========================================================
  // GENERAL CARDS
  // ========================================================

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

  // ========================================================
  // INFO
  // ========================================================

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

  // ========================================================
  // BOTTOM LOGOUT
  // ========================================================

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