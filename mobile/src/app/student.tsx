import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config/api";

// ==========================================================
// TYPES
// ==========================================================

interface HostelBuilding {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isActive: boolean;
}

interface Block {
  id: string;
  hostelBuildingId: string;
  name: string;
  type: string;
  isActive: boolean;
  hostelBuilding: HostelBuilding;
}

interface Floor {
  id: string;
  blockId: string;
  floorNumber: number;
  name: string;
  block: Block;
}

interface Room {
  id: string;
  floorId: string;
  roomNumber: string;
  capacity: number;
  isActive: boolean;
  floor: Floor;
}

interface RoomAllocation {
  id: string;
  studentId: string;
  roomId: string;
  allocatedAt: string;
  vacatedAt: string | null;
  status: string;
  room: Room;
}

interface ParentContact {
  id: string;
  studentId: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string | null;
  isPrimary: boolean;
  isEmergencyContact: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  isActive: boolean;
  role: string;
}

interface Student {
  id: string;
  userId: string;
  studentNumber: string;
  gender: string;
  department: string;
  course: string;
  year: number;
  status: string;
  user: User;
  roomAllocations: RoomAllocation[];
  parentContacts: ParentContact[];
}

interface StudentResponse {
  success: boolean;
  data?: Student;
  message?: string;
}

// ==========================================================
// STUDENT DASHBOARD
// ==========================================================

export default function StudentDashboard() {
  const [student, setStudent] =
    useState<Student | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ========================================================
  // FETCH LOGGED-IN STUDENT
  // ========================================================

  const fetchStudentProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/students/me`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result: StudentResponse =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Failed to fetch student profile"
        );
      }

      if (!result.data) {
        throw new Error(
          "Student profile not found"
        );
      }

      // Make sure parentContacts always exists
      const studentData: Student = {
        ...result.data,
        parentContacts:
          result.data.parentContacts || [],
      };

      setStudent(studentData);
    } catch (err: any) {
      console.error(
        "Student profile error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load student dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================================
  // LOAD PROFILE
  // ========================================================

  useEffect(() => {
    fetchStudentProfile();
  }, []);

  // ========================================================
  // LOGOUT
  // ========================================================

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");

      router.replace("/login");
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }
  };

  // ========================================================
  // LOADING
  // ========================================================

  if (loading) {
    return (
      <View
        style={styles.loadingContainer}
      >
        <ActivityIndicator
          size="large"
          color="#2563EB"
        />

        <Text
          style={styles.loadingText}
        >
          Loading your dashboard...
        </Text>
      </View>
    );
  }

  // ========================================================
  // ERROR
  // ========================================================

  if (error) {
    return (
      <View
        style={styles.loadingContainer}
      >
        <Text
          style={styles.errorTitle}
        >
          Unable to load dashboard
        </Text>

        <Text
          style={styles.errorText}
        >
          {error}
        </Text>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={
            fetchStudentProfile
          }
        >
          <Text
            style={styles.retryButtonText}
          >
            Retry
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={
            styles.errorLogoutButton
          }
          onPress={handleLogout}
        >
          <Text
            style={styles.logoutText}
          >
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ========================================================
  // ROOM DATA
  // ========================================================

  const activeAllocation =
    student?.roomAllocations?.find(
      (allocation) =>
        allocation.status === "ACTIVE"
    );

  const room =
    activeAllocation?.room;

  const floor =
    room?.floor;

  const block =
    floor?.block;

  const hostelBuilding =
    block?.hostelBuilding;

  // ========================================================
  // PARENT CONTACT DATA
  // ========================================================

  const parentContacts =
    student?.parentContacts || [];

  // ========================================================
  // DASHBOARD
  // ========================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.contentContainer
      }
      showsVerticalScrollIndicator={false}
    >
      {/* ==================================================
          HEADER
      ================================================== */}

      <View style={styles.header}>
        <Text
          style={styles.title}
        >
          Student Dashboard
        </Text>

        <Text
          style={styles.subtitle}
        >
          Welcome,{" "}
          {student?.user?.firstName ||
            "Student"}!
        </Text>
      </View>

      {/* ==================================================
          PROFILE CARD
      ================================================== */}

      <View
        style={styles.profileCard}
      >
        <View
          style={styles.profileHeader}
        >
          <View
            style={styles.avatar}
          >
            <Text
              style={styles.avatarText}
            >
              {student?.user?.firstName
                ?.charAt(0)
                ?.toUpperCase() || "S"}
            </Text>
          </View>

          <View
            style={styles.profileInfo}
          >
            <Text
              style={styles.profileName}
            >
              {student?.user?.firstName}{" "}
              {student?.user?.lastName}
            </Text>

            <Text
              style={
                styles.profileNumber
              }
            >
              {student?.studentNumber}
            </Text>
          </View>
        </View>

        <View
          style={styles.profileDetails}
        >
          <View
            style={styles.detailItem}
          >
            <Text
              style={styles.detailLabel}
            >
              Department
            </Text>

            <Text
              style={styles.detailValue}
            >
              {student?.department ||
                "N/A"}
            </Text>
          </View>

          <View
            style={styles.detailItem}
          >
            <Text
              style={styles.detailLabel}
            >
              Course
            </Text>

            <Text
              style={styles.detailValue}
            >
              {student?.course ||
                "N/A"}
            </Text>
          </View>

          <View
            style={styles.detailItem}
          >
            <Text
              style={styles.detailLabel}
            >
              Year
            </Text>

            <Text
              style={styles.detailValue}
            >
              {student?.year ?? "N/A"}
            </Text>
          </View>

          <View
            style={styles.detailItem}
          >
            <Text
              style={styles.detailLabel}
            >
              Gender
            </Text>

            <Text
              style={styles.detailValue}
            >
              {student?.gender ||
                "N/A"}
            </Text>
          </View>

          <View
            style={styles.detailItem}
          >
            <Text
              style={styles.detailLabel}
            >
              Phone Number
            </Text>

            <Text
              style={styles.detailValue}
            >
              {student?.user?.phone ||
                "Not provided"}
            </Text>
          </View>
        </View>
      </View>

      {/* ==================================================
          MY ROOM CARD
      ================================================== */}

      <View style={styles.roomCard}>
        <View
          style={styles.roomHeader}
        >
          <View
            style={styles.roomHeaderText}
          >
            <Text
              style={styles.roomTitle}
            >
              My Room
            </Text>

            <Text
              style={styles.roomSubtitle}
            >
              Your current hostel allocation
            </Text>
          </View>

          <View
            style={
              styles.roomIconContainer
            }
          >
            <Text
              style={styles.roomIcon}
            >
              🏠
            </Text>
          </View>
        </View>

        {activeAllocation && room ? (
          <>
            {/* HOSTEL */}

            <View
              style={styles.roomRow}
            >
              <Text
                style={styles.roomLabel}
              >
                Hostel
              </Text>

              <Text
                style={styles.roomValue}
              >
                {hostelBuilding?.name ||
                  "N/A"}
              </Text>
            </View>

            {/* BLOCK */}

            <View
              style={styles.roomRow}
            >
              <Text
                style={styles.roomLabel}
              >
                Block
              </Text>

              <Text
                style={styles.roomValue}
              >
                {block?.name ||
                  "N/A"}
              </Text>
            </View>

            {/* FLOOR */}

            <View
              style={styles.roomRow}
            >
              <Text
                style={styles.roomLabel}
              >
                Floor
              </Text>

              <Text
                style={styles.roomValue}
              >
                {floor?.name ||
                  `Floor ${
                    floor?.floorNumber ??
                    "N/A"
                  }`}
              </Text>
            </View>

            {/* ROOM NUMBER */}

            <View
              style={
                styles.roomNumberSection
              }
            >
              <Text
                style={
                  styles.roomNumberLabel
                }
              >
                Room Number
              </Text>

              <Text
                style={styles.roomNumber}
              >
                {room.roomNumber}
              </Text>
            </View>

            {/* ROOM INFORMATION */}

            <View
              style={styles.roomStats}
            >
              <View
                style={styles.statBox}
              >
                <Text
                  style={styles.statLabel}
                >
                  Capacity
                </Text>

                <Text
                  style={styles.statValue}
                >
                  {room.capacity}
                </Text>
              </View>

              <View
                style={styles.statBox}
              >
                <Text
                  style={styles.statLabel}
                >
                  Allocation
                </Text>

                <Text
                  style={styles.allocatedText}
                >
                  Active
                </Text>
              </View>
            </View>

            {/* GENDER COMPATIBILITY */}

            <View
              style={styles.genderInfo}
            >
              <Text
                style={
                  styles.genderInfoLabel
                }
              >
                Block Type
              </Text>

              <Text
                style={
                  styles.genderInfoValue
                }
              >
                {block?.type || "N/A"}
              </Text>
            </View>
          </>
        ) : (
          <View
            style={styles.noRoomContainer}
          >
            <Text
              style={styles.noRoomIcon}
            >
              🛏️
            </Text>

            <Text
              style={styles.noRoomTitle}
            >
              Room not allocated yet
            </Text>

            <Text
              style={styles.noRoomText}
            >
              Your hostel room has not been
              assigned yet. Please contact
              the hostel administration.
            </Text>
          </View>
        )}
      </View>

      {/* ==================================================
          PARENT / GUARDIAN CONTACTS
      ================================================== */}

      <View
        style={styles.parentCard}
      >
        <View
          style={styles.parentHeader}
        >
          <View
            style={styles.parentHeaderText}
          >
            <Text
              style={styles.parentTitle}
            >
              Parent / Guardian Contacts
            </Text>

            <Text
              style={styles.parentSubtitle}
            >
              Official contact information
              maintained by hostel
              administration
            </Text>
          </View>

          <View
            style={
              styles.parentIconContainer
            }
          >
            <Text
              style={styles.parentIcon}
            >
              👨‍👩‍👧
            </Text>
          </View>
        </View>

        {parentContacts.length > 0 ? (
          parentContacts.map(
            (contact) => (
              <View
                key={contact.id}
                style={
                  styles.parentContactBox
                }
              >
                {/* CONTACT HEADER */}

                <View
                  style={
                    styles.parentContactHeader
                  }
                >
                  <View
                    style={
                      styles.parentContactNameContainer
                    }
                  >
                    <Text
                      style={
                        styles.parentContactName
                      }
                    >
                      {contact.name}
                    </Text>

                    <Text
                      style={
                        styles.parentRelationship
                      }
                    >
                      {contact.relationship}
                    </Text>
                  </View>

                  {contact.isPrimary && (
                    <View
                      style={
                        styles.primaryBadge
                      }
                    >
                      <Text
                        style={
                          styles.primaryBadgeText
                        }
                      >
                        Primary
                      </Text>
                    </View>
                  )}
                </View>

                {/* PHONE */}

                <View
                  style={
                    styles.parentDetailRow
                  }
                >
                  <Text
                    style={
                      styles.parentDetailLabel
                    }
                  >
                    Phone
                  </Text>

                  <Text
                    style={
                      styles.parentDetailValue
                    }
                  >
                    {contact.phone ||
                      "Not provided"}
                  </Text>
                </View>

                {/* EMAIL */}

                <View
                  style={
                    styles.parentDetailRow
                  }
                >
                  <Text
                    style={
                      styles.parentDetailLabel
                    }
                  >
                    Email
                  </Text>

                  <Text
                    style={
                      styles.parentDetailValue
                    }
                  >
                    {contact.email ||
                      "Not provided"}
                  </Text>
                </View>

                {/* EMERGENCY CONTACT */}

                <View
                  style={
                    styles.parentDetailRow
                  }
                >
                  <Text
                    style={
                      styles.parentDetailLabel
                    }
                  >
                    Emergency Contact
                  </Text>

                  <Text
                    style={[
                      styles.parentDetailValue,
                      contact.isEmergencyContact &&
                        styles.emergencyContactText,
                    ]}
                  >
                    {contact.isEmergencyContact
                      ? "Yes"
                      : "No"}
                  </Text>
                </View>
              </View>
            )
          )
        ) : (
          <View
            style={
              styles.noParentContainer
            }
          >
            <Text
              style={styles.noParentIcon}
            >
              👤
            </Text>

            <Text
              style={styles.noParentTitle}
            >
              No parent contact available
            </Text>

            <Text
              style={styles.noParentText}
            >
              Parent or guardian contact
              details have not been added
              by the hostel administration
              yet.
            </Text>
          </View>
        )}
      </View>

      {/* ==================================================
          RAISE COMPLAINT
      ================================================== */}

      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push(
            "/create-complaint"
          )
        }
        activeOpacity={0.8}
      >
        <View
          style={
            styles.cardIconContainer
          }
        >
          <Text style={styles.cardIcon}>
            🛠️
          </Text>
        </View>

        <View
          style={styles.cardContent}
        >
          <Text
            style={styles.cardTitle}
          >
            Raise a Complaint
          </Text>

          <Text
            style={styles.cardText}
          >
            Report an issue in your hostel
            room.
          </Text>
        </View>
      </TouchableOpacity>

      {/* ==================================================
          MY COMPLAINTS
      ================================================== */}

      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push(
            "/my-complaints"
          )
        }
        activeOpacity={0.8}
      >
        <View
          style={
            styles.cardIconContainer
          }
        >
          <Text style={styles.cardIcon}>
            📋
          </Text>
        </View>

        <View
          style={styles.cardContent}
        >
          <Text
            style={styles.cardTitle}
          >
            My Complaints
          </Text>

          <Text
            style={styles.cardText}
          >
            Track the status of your
            maintenance requests.
          </Text>
        </View>
      </TouchableOpacity>

      {/* ==================================================
          LOGOUT
      ================================================== */}

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
    </ScrollView>
  );
}

// ==========================================================
// STYLES
// ==========================================================

const styles = StyleSheet.create({
  // ========================================================
  // MAIN
  // ========================================================

  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },

  contentContainer: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },

  // ========================================================
  // LOADING
  // ========================================================

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    padding: 20,
  },

  loadingText: {
    marginTop: 15,
    fontSize: 15,
    color: "#64748B",
  },

  // ========================================================
  // ERROR
  // ========================================================

  errorTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#DC2626",
    textAlign: "center",
  },

  errorText: {
    marginTop: 10,
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
  },

  retryButton: {
    marginTop: 25,
    backgroundColor: "#2563EB",
    paddingVertical: 13,
    paddingHorizontal: 30,
    borderRadius: 10,
  },

  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },

  errorLogoutButton: {
    marginTop: 15,
    backgroundColor: "#DC2626",
    paddingVertical: 13,
    paddingHorizontal: 30,
    borderRadius: 10,
  },

  // ========================================================
  // HEADER
  // ========================================================

  header: {
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0F172A",
  },

  subtitle: {
    fontSize: 15,
    color: "#64748B",
    marginTop: 7,
  },

  // ========================================================
  // PROFILE CARD
  // ========================================================

  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },

  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2563EB",
  },

  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },

  profileName: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#0F172A",
  },

  profileNumber: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 3,
  },

  profileDetails: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    marginTop: 18,
    paddingTop: 15,
  },

  detailItem: {
    marginBottom: 12,
  },

  detailLabel: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 3,
  },

  detailValue: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "500",
  },

  // ========================================================
  // ROOM CARD
  // ========================================================

  roomCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },

  roomHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  roomHeaderText: {
    flex: 1,
  },

  roomTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0F172A",
  },

  roomSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },

  roomIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },

  roomIcon: {
    fontSize: 23,
  },

  roomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  roomLabel: {
    fontSize: 14,
    color: "#64748B",
    flex: 1,
  },

  roomValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    flex: 1.5,
    textAlign: "right",
  },

  roomNumberSection: {
    marginTop: 20,
    marginBottom: 18,
    paddingVertical: 20,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
  },

  roomNumberLabel: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 5,
  },

  roomNumber: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#2563EB",
  },

  roomStats: {
    flexDirection: "row",
    gap: 12,
  },

  statBox: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 14,
  },

  statLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 5,
  },

  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0F172A",
  },

  allocatedText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#16A34A",
  },

  genderInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    padding: 13,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
  },

  genderInfoLabel: {
    fontSize: 13,
    color: "#64748B",
  },

  genderInfoValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#2563EB",
  },

  // ========================================================
  // NO ROOM
  // ========================================================

  noRoomContainer: {
    alignItems: "center",
    paddingVertical: 25,
  },

  noRoomIcon: {
    fontSize: 40,
    marginBottom: 12,
  },

  noRoomTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#0F172A",
    textAlign: "center",
  },

  noRoomText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
    textAlign: "center",
  },

  // ========================================================
  // PARENT / GUARDIAN CONTACTS
  // ========================================================

  parentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },

  parentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  parentHeaderText: {
    flex: 1,
    paddingRight: 12,
  },

  parentTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0F172A",
  },

  parentSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 5,
    lineHeight: 19,
  },

  parentIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },

  parentIcon: {
    fontSize: 23,
  },

  parentContactBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  parentContactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  parentContactNameContainer: {
    flex: 1,
    paddingRight: 10,
  },

  parentContactName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#0F172A",
  },

  parentRelationship: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 3,
  },

  primaryBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  primaryBadgeText: {
    color: "#166534",
    fontSize: 11,
    fontWeight: "bold",
  },

  parentDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },

  parentDetailLabel: {
    fontSize: 13,
    color: "#64748B",
    flex: 1,
  },

  parentDetailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    flex: 1.5,
    textAlign: "right",
  },

  emergencyContactText: {
    color: "#DC2626",
  },

  noParentContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },

  noParentIcon: {
    fontSize: 36,
    marginBottom: 10,
  },

  noParentTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0F172A",
    textAlign: "center",
  },

  noParentText: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
    textAlign: "center",
  },

  // ========================================================
  // ACTION CARDS
  // ========================================================

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 18,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },

  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },

  cardIcon: {
    fontSize: 24,
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#2563EB",
  },

  cardText: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 6,
    lineHeight: 20,
  },

  // ========================================================
  // LOGOUT
  // ========================================================

  logoutButton: {
    marginTop: 8,
    backgroundColor: "#DC2626",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },

  logoutText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});