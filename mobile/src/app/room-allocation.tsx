import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";

import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const API_URL = "http://192.168.31.239:5000";

// ==========================================================
// TYPES
// ==========================================================

type Gender = "MALE" | "FEMALE";

type Student = {
  id: string;
  studentNumber: string;
  gender: Gender;
  department?: string | null;
  course?: string | null;
  year?: number | null;
  status: string;

  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    isActive: boolean;
  };

  roomAllocations?: RoomAllocation[];
};

type Room = {
  id: string;
  floorId: string;
  roomNumber: string;
  capacity: number;
  isActive: boolean;

  floor?: {
    id: string;
    floorNumber: number;
    name: string;

    block?: {
      id: string;
      name: string;
      type: "BOYS" | "GIRLS" | string;

      hostelBuilding?: {
        id: string;
        name: string;
      };
    };
  };
};

type RoomAllocation = {
  id: string;
  studentId: string;
  roomId: string;
  status: string;
  allocatedAt?: string;
  vacatedAt?: string | null;
};


// ==========================================================
// MAIN COMPONENT
// ==========================================================

export default function RoomAllocationPage() {
  const router = useRouter();

  const [students, setStudents] = useState<Student[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [allocations, setAllocations] = useState<
    RoomAllocation[]
  >([]);

  const [selectedStudent, setSelectedStudent] =
    useState<Student | null>(null);

  const [selectedRoom, setSelectedRoom] =
    useState<Room | null>(null);

  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState(false);

  const [showStudents, setShowStudents] = useState(false);
  const [showRooms, setShowRooms] = useState(false);

  // Success popup
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);


  // ==========================================================
  // CHECK ADMIN
  // ==========================================================

  const checkAdminAndLoadData = async () => {
    try {
      setLoading(true);

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
          "Only administrators can allocate rooms."
        );

        router.replace("/login");
        return;
      }

      await loadAllData(token);
    } catch (error) {
      console.log(
        "Room allocation page error:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to load room allocation data."
      );
    } finally {
      setLoading(false);
    }
  };


  // ==========================================================
  // LOAD ALL DATA
  // ==========================================================

  const loadAllData = async (token: string) => {
    await Promise.all([
      loadStudents(token),
      loadRooms(token),
      loadAllocations(token),
    ]);
  };


  // ==========================================================
  // LOAD STUDENTS
  // ==========================================================

  const loadStudents = async (token: string) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/students`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success) {
        const allStudents: Student[] =
          response.data.data || [];

        /*
         * Only show:
         *
         * 1. ACTIVE students
         * 2. Students who don't already
         *    have an ACTIVE room
         */

        const studentsWithoutRoom =
          allStudents.filter((student) => {
            const hasActiveRoom =
              student.roomAllocations?.some(
                (allocation) =>
                  allocation.status === "ACTIVE"
              );

            return (
              student.status === "ACTIVE" &&
              !hasActiveRoom
            );
          });

        setStudents(studentsWithoutRoom);
      } else {
        setStudents([]);
      }
    } catch (error: any) {
      console.log(
        "Load students error:",
        error?.response?.data || error
      );

      if (
        error?.response?.status === 401
      ) {
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
          "Unable to load students."
      );
    }
  };


  // ==========================================================
  // LOAD ROOMS
  // ==========================================================

  const loadRooms = async (token: string) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/rooms`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success) {
        setRooms(response.data.data || []);
      } else {
        setRooms([]);
      }
    } catch (error: any) {
      console.log(
        "Load rooms error:",
        error?.response?.data || error
      );

      if (
        error?.response?.status === 401
      ) {
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
          "Unable to load rooms."
      );
    }
  };


  // ==========================================================
  // LOAD ROOM ALLOCATIONS
  // ==========================================================

  const loadAllocations = async (token: string) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/room-allocations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success) {
        setAllocations(
          response.data.data || []
        );
      } else {
        setAllocations([]);
      }
    } catch (error: any) {
      console.log(
        "Load allocations error:",
        error?.response?.data || error
      );

      if (
        error?.response?.status === 401
      ) {
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
          "Unable to load room allocations."
      );
    }
  };


  // ==========================================================
  // ROOM OCCUPANCY
  // ==========================================================

  const getRoomOccupancy = (roomId: string) => {
    return allocations.filter(
      (allocation) =>
        allocation.roomId === roomId &&
        allocation.status === "ACTIVE"
    ).length;
  };


  // ==========================================================
  // GET EXPECTED BLOCK TYPE
  // ==========================================================

  const getExpectedBlockType = (
    gender: Gender
  ) => {
    return gender === "MALE"
      ? "BOYS"
      : "GIRLS";
  };


  // ==========================================================
  // GET EXPECTED BLOCK LABEL
  // ==========================================================

  const getGenderLabel = (
    gender: Gender
  ) => {
    return gender === "MALE"
      ? "Male"
      : "Female";
  };


  // ==========================================================
  // FILTER ROOMS BY STUDENT GENDER
  // ==========================================================

  const getFilteredRooms = () => {
    if (!selectedStudent) {
      return [];
    }

    const expectedBlockType =
      getExpectedBlockType(
        selectedStudent.gender
      );

    return rooms.filter((room) => {
      if (!room.isActive) {
        return false;
      }

      const blockType =
        room.floor?.block?.type;

      return (
        blockType === expectedBlockType
      );
    });
  };


  // ==========================================================
  // ALLOCATE ROOM
  // ==========================================================

  const handleAllocate = async () => {
    if (!selectedStudent) {
      Alert.alert(
        "Select Student",
        "Please select a student first."
      );

      return;
    }

    if (!selectedRoom) {
      Alert.alert(
        "Select Room",
        "Please select a room first."
      );

      return;
    }

    // ========================================================
    // FRONTEND GENDER CHECK
    // ========================================================

    const expectedBlockType =
      getExpectedBlockType(
        selectedStudent.gender
      );

    const actualBlockType =
      selectedRoom.floor?.block?.type;

    if (
      actualBlockType !==
      expectedBlockType
    ) {
      Alert.alert(
        "Invalid Room",
        selectedStudent.gender === "MALE"
          ? "Male students can only be allocated to boys blocks."
          : "Female students can only be allocated to girls blocks."
      );

      return;
    }

    // ========================================================
    // CAPACITY CHECK
    // ========================================================

    const occupancy =
      getRoomOccupancy(
        selectedRoom.id
      );

    if (
      occupancy >=
      selectedRoom.capacity
    ) {
      Alert.alert(
        "Room Full",
        `Room ${selectedRoom.roomNumber} has reached its maximum capacity.`
      );

      return;
    }

    try {
      setAllocating(true);

      const token =
        await AsyncStorage.getItem("token");

      if (!token) {
        await AsyncStorage.multiRemove([
          "token",
          "user",
        ]);

        router.replace("/login");
        return;
      }

      const studentName =
        `${selectedStudent.user.firstName} ${selectedStudent.user.lastName}`;

      const roomNumber =
        selectedRoom.roomNumber;

      console.log(
        "================================"
      );

      console.log(
        "Allocating room..."
      );

      console.log(
        "Student:",
        studentName
      );

      console.log(
        "Student ID:",
        selectedStudent.id
      );

      console.log(
        "Student Gender:",
        selectedStudent.gender
      );

      console.log(
        "Room:",
        roomNumber
      );

      console.log(
        "Room ID:",
        selectedRoom.id
      );

      console.log(
        "Block:",
        selectedRoom.floor?.block?.name
      );

      console.log(
        "Block Type:",
        actualBlockType
      );

      console.log(
        "================================"
      );

      const response = await axios.post(
        `${API_URL}/api/room-allocations`,
        {
          studentId:
            selectedStudent.id,

          roomId:
            selectedRoom.id,
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
        "Allocation response:",
        response.data
      );

      // ======================================================
      // SUCCESS
      // ======================================================

      if (response.data?.success) {
        setSuccessMessage(
          `${studentName} has been successfully allocated Room ${roomNumber}.`
        );

        setShowSuccess(true);

        // Clear current selection
        setSelectedStudent(null);
        setSelectedRoom(null);

        setShowStudents(false);
        setShowRooms(false);

        // Refresh data
        await loadAllData(token);
      } else {
        Alert.alert(
          "Allocation Failed",
          response.data?.message ||
            "Unable to allocate room."
        );
      }

    } catch (error: any) {
      console.log(
        "Room allocation error:",
        error?.response?.data ||
          error
      );

      if (
        error?.response?.status ===
        401
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
        "Allocation Failed",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to allocate room."
      );

    } finally {
      setAllocating(false);
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

      router.replace("/login");

    } catch (error) {
      console.log(
        "Logout error:",
        error
      );

      Alert.alert(
        "Logout Error",
        "Unable to logout. Please try again."
      );
    }
  };


  // ==========================================================
  // LOADING
  // ==========================================================

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
          Loading room allocation...
        </Text>
      </View>
    );
  }


  // ==========================================================
  // FILTERED ROOMS
  // ==========================================================

  const filteredRooms =
    getFilteredRooms();


  // ==========================================================
  // UI
  // ==========================================================

  return (
    <View style={styles.pageContainer}>

      {/* ====================================================
          SUCCESS POPUP
      ==================================================== */}

      {showSuccess && (
        <View style={styles.successOverlay}>

          <View style={styles.successModal}>

            <View
              style={
                styles.successIconCircle
              }
            >
              <Text
                style={styles.successIcon}
              >
                ✓
              </Text>
            </View>

            <Text
              style={styles.successTitle}
            >
              Room Allocated
            </Text>

            <Text
              style={styles.successMessage}
            >
              {successMessage}
            </Text>

            <Text
              style={styles.successSubtext}
            >
              The student's room allocation
              has been saved successfully.
            </Text>

            <TouchableOpacity
              style={styles.successButton}
              onPress={() => {
                setShowSuccess(false);
              }}
              activeOpacity={0.8}
            >
              <Text
                style={
                  styles.successButtonText
                }
              >
                OK
              </Text>
            </TouchableOpacity>

          </View>

        </View>
      )}


      {/* ====================================================
          MAIN CONTENT
      ==================================================== */}

      <ScrollView
        style={styles.container}
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >

        {/* ==================================================
            BACK
        ================================================== */}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.replace("/admin")
          }
        >
          <Text style={styles.backText}>
            ← Back to Admin Dashboard
          </Text>
        </TouchableOpacity>


        {/* ==================================================
            HEADER
        ================================================== */}

        <View style={styles.header}>

          <View>
            <Text style={styles.title}>
              Room Allocation
            </Text>

            <Text
              style={styles.subtitle}
            >
              Allocate rooms to approved
              students
            </Text>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text
              style={styles.logoutText}
            >
              Logout
            </Text>
          </TouchableOpacity>

        </View>


        {/* ==================================================
            SELECT STUDENT
        ================================================== */}

        <View style={styles.section}>

          <Text
            style={styles.sectionTitle}
          >
            1. Select Student
          </Text>

          <TouchableOpacity
            style={[
              styles.dropdown,
              selectedStudent &&
                styles.dropdownSelected,
            ]}
            onPress={() => {
              setShowStudents(
                !showStudents
              );

              setShowRooms(false);
            }}
            activeOpacity={0.8}
          >

            <View
              style={
                styles.dropdownContent
              }
            >

              {selectedStudent ? (
                <>

                  <View
                    style={
                      styles.selectedStudentHeader
                    }
                  >

                    <Text
                      style={
                        styles.selectedTitle
                      }
                    >
                      {
                        selectedStudent.user
                          .firstName
                      }{" "}
                      {
                        selectedStudent.user
                          .lastName
                      }
                    </Text>

                    <View
                      style={[
                        styles.genderBadge,
                        selectedStudent.gender ===
                          "MALE"
                          ? styles.maleBadge
                          : styles.femaleBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.genderBadgeText,
                          selectedStudent.gender ===
                            "MALE"
                            ? styles.maleText
                            : styles.femaleText,
                        ]}
                      >
                        {getGenderLabel(
                          selectedStudent.gender
                        )}
                      </Text>
                    </View>

                  </View>

                  <Text
                    style={
                      styles.selectedSubtitle
                    }
                  >
                    {
                      selectedStudent.studentNumber
                    }{" "}
                    •{" "}
                    {
                      selectedStudent.course
                    }
                  </Text>

                </>
              ) : (
                <Text
                  style={styles.placeholder}
                >
                  Select an approved student
                </Text>
              )}

            </View>

            <Text
              style={styles.dropdownArrow}
            >
              {showStudents
                ? "▲"
                : "▼"}
            </Text>

          </TouchableOpacity>


          {/* STUDENT LIST */}

          {showStudents && (
            <View
              style={styles.dropdownList}
            >

              {students.length === 0 ? (

                <View
                  style={
                    styles.emptyDropdown
                  }
                >
                  <Text
                    style={
                      styles.emptyDropdownText
                    }
                  >
                    No approved students are
                    waiting for room allocation.
                  </Text>
                </View>

              ) : (

                students.map((student) => (

                  <TouchableOpacity
                    key={student.id}
                    style={
                      styles.dropdownItem
                    }
                    onPress={() => {

                      /*
                       * Change student.
                       *
                       * Clear the previous room
                       * because the previous room
                       * may belong to a different
                       * gender block.
                       */

                      setSelectedStudent(
                        student
                      );

                      setSelectedRoom(
                        null
                      );

                      setShowStudents(
                        false
                      );

                    }}
                    activeOpacity={0.8}
                  >

                    <View
                      style={
                        styles.studentIcon
                      }
                    >
                      <Text
                        style={
                          styles.studentIconText
                        }
                      >
                        🎓
                      </Text>
                    </View>


                    <View
                      style={
                        styles.itemContent
                      }
                    >

                      <View
                        style={
                          styles.studentItemHeader
                        }
                      >

                        <Text
                          style={
                            styles.itemTitle
                          }
                        >
                          {
                            student.user.firstName
                          }{" "}
                          {
                            student.user.lastName
                          }
                        </Text>

                        <View
                          style={[
                            styles.genderBadgeSmall,
                            student.gender ===
                              "MALE"
                              ? styles.maleBadge
                              : styles.femaleBadge,
                          ]}
                        >
                          <Text
                            style={[
                              styles.genderBadgeTextSmall,
                              student.gender ===
                                "MALE"
                                ? styles.maleText
                                : styles.femaleText,
                            ]}
                          >
                            {getGenderLabel(
                              student.gender
                            )}
                          </Text>
                        </View>

                      </View>

                      <Text
                        style={
                          styles.itemSubtitle
                        }
                      >
                        {
                          student.studentNumber
                        }
                      </Text>

                      <Text
                        style={
                          styles.itemDetails
                        }
                      >
                        {
                          student.department
                        }{" "}
                        •{" "}
                        {student.course}{" "}
                        • Year{" "}
                        {student.year || "-"}
                      </Text>

                    </View>

                  </TouchableOpacity>

                ))

              )}

            </View>
          )}

        </View>


        {/* ==================================================
            GENDER INFORMATION
        ================================================== */}

        {selectedStudent && (
          <View
            style={styles.genderInfoCard}
          >

            <View
              style={styles.genderInfoIcon}
            >
              <Text
                style={styles.genderInfoIconText}
              >
                {selectedStudent.gender ===
                "MALE"
                  ? "♂"
                  : "♀"}
              </Text>
            </View>

            <View
              style={
                styles.genderInfoContent
              }
            >

              <Text
                style={
                  styles.genderInfoTitle
                }
              >
                {getGenderLabel(
                  selectedStudent.gender
                )}{" "}
                Student
              </Text>

              <Text
                style={
                  styles.genderInfoText
                }
              >
                Only{" "}
                <Text
                  style={
                    styles.genderInfoBold
                  }
                >
                  {
                    getExpectedBlockType(
                      selectedStudent.gender
                    )
                  }
                </Text>{" "}
                blocks and their rooms are
                available for this student.
              </Text>

            </View>

          </View>
        )}


        {/* ==================================================
            SELECT ROOM
        ================================================== */}

        <View style={styles.section}>

          <Text
            style={styles.sectionTitle}
          >
            2. Select Room
          </Text>

          <TouchableOpacity
            style={[
              styles.dropdown,
              !selectedStudent &&
                styles.dropdownDisabled,
              selectedRoom &&
                styles.dropdownSelected,
            ]}
            onPress={() => {

              if (!selectedStudent) {
                Alert.alert(
                  "Select Student",
                  "Please select a student before choosing a room."
                );

                return;
              }

              setShowRooms(
                !showRooms
              );

              setShowStudents(false);

            }}
            activeOpacity={0.8}
          >

            <View
              style={
                styles.dropdownContent
              }
            >

              {selectedRoom ? (

                <>

                  <Text
                    style={
                      styles.selectedTitle
                    }
                  >
                    Room{" "}
                    {
                      selectedRoom.roomNumber
                    }
                  </Text>

                  <Text
                    style={
                      styles.selectedSubtitle
                    }
                  >
                    {
                      selectedRoom.floor
                        ?.name
                    }{" "}
                    •{" "}
                    {
                      selectedRoom.floor
                        ?.block?.name
                    }
                  </Text>

                </>

              ) : (

                <Text
                  style={[
                    styles.placeholder,
                    !selectedStudent &&
                      styles.disabledPlaceholder,
                  ]}
                >
                  {selectedStudent
                    ? `Select an available ${getExpectedBlockType(
                        selectedStudent.gender
                      )} room`
                    : "Select a student first"}
                </Text>

              )}

            </View>

            <Text
              style={[
                styles.dropdownArrow,
                !selectedStudent &&
                  styles.disabledArrow,
              ]}
            >
              {showRooms
                ? "▲"
                : "▼"}
            </Text>

          </TouchableOpacity>


          {/* =================================================
              ROOM LIST
          ================================================= */}

          {showRooms &&
            selectedStudent && (

              <View
                style={
                  styles.dropdownList
                }
              >

                {filteredRooms.length ===
                0 ? (

                  <View
                    style={
                      styles.emptyDropdown
                    }
                  >

                    <View
                      style={
                        styles.noRoomIcon
                      }
                    >
                      <Text
                        style={
                          styles.noRoomIconText
                        }
                      >
                        🏠
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.noRoomTitle
                      }
                    >
                      No available rooms
                    </Text>

                    <Text
                      style={
                        styles.emptyDropdownText
                      }
                    >
                      There are no available{" "}
                      {
                        getExpectedBlockType(
                          selectedStudent.gender
                        )
                      } rooms with available
                      capacity.
                    </Text>

                  </View>

                ) : (

                  filteredRooms.map((room) => {

                    const occupancy =
                      getRoomOccupancy(
                        room.id
                      );

                    const isFull =
                      occupancy >=
                      room.capacity;

                    return (
                      <TouchableOpacity
                        key={room.id}
                        style={[
                          styles.dropdownItem,
                          isFull &&
                            styles.fullRoomItem,
                        ]}
                        disabled={isFull}
                        onPress={() => {

                          setSelectedRoom(
                            room
                          );

                          setShowRooms(
                            false
                          );

                        }}
                        activeOpacity={0.8}
                      >

                        <View
                          style={
                            styles.roomIcon
                          }
                        >
                          <Text
                            style={
                              styles.roomIconText
                            }
                          >
                            🏠
                          </Text>
                        </View>


                        <View
                          style={
                            styles.itemContent
                          }
                        >

                          <View
                            style={
                              styles.roomTitleRow
                            }
                          >

                            <Text
                              style={
                                styles.itemTitle
                              }
                            >
                              Room{" "}
                              {
                                room.roomNumber
                              }
                            </Text>

                            <View
                              style={[
                                styles.capacityBadge,
                                isFull &&
                                  styles.fullBadge,
                              ]}
                            >

                              <Text
                                style={[
                                  styles.capacityText,
                                  isFull &&
                                    styles.fullText,
                                ]}
                              >
                                {occupancy}/
                                {
                                  room.capacity
                                }
                              </Text>

                            </View>

                          </View>


                          <Text
                            style={
                              styles.itemSubtitle
                            }
                          >
                            {
                              room.floor
                                ?.name
                            }{" "}
                            •{" "}
                            {
                              room.floor
                                ?.block
                                ?.name
                            }
                          </Text>


                          <Text
                            style={
                              styles.itemDetails
                            }
                          >
                            {
                              room.floor
                                ?.block
                                ?.type
                            }{" "}
                            • Capacity:{" "}
                            {
                              room.capacity
                            }{" "}
                            •{" "}
                            {isFull
                              ? "FULL"
                              : `${
                                  room.capacity -
                                  occupancy
                                } space${
                                  room.capacity -
                                    occupancy !==
                                  1
                                    ? "s"
                                    : ""
                                } available`}
                          </Text>

                        </View>

                      </TouchableOpacity>
                    );
                  })

                )}

              </View>

            )}

        </View>


        {/* ==================================================
            ALLOCATION SUMMARY
        ================================================== */}

        {(selectedStudent ||
          selectedRoom) && (

          <View
            style={styles.summaryCard}
          >

            <Text
              style={styles.summaryTitle}
            >
              Allocation Summary
            </Text>


            {/* STUDENT */}

            {selectedStudent && (
              <>

                <View
                  style={
                    styles.summaryRow
                  }
                >

                  <Text
                    style={
                      styles.summaryLabel
                    }
                  >
                    Student
                  </Text>

                  <Text
                    style={
                      styles.summaryValue
                    }
                  >
                    {
                      selectedStudent.user
                        .firstName
                    }{" "}
                    {
                      selectedStudent.user
                        .lastName
                    }
                  </Text>

                </View>


                {/* STUDENT NUMBER */}

                <View
                  style={
                    styles.summaryRow
                  }
                >

                  <Text
                    style={
                      styles.summaryLabel
                    }
                  >
                    Student Number
                  </Text>

                  <Text
                    style={
                      styles.summaryValue
                    }
                  >
                    {
                      selectedStudent.studentNumber
                    }
                  </Text>

                </View>


                {/* GENDER */}

                <View
                  style={
                    styles.summaryRow
                  }
                >

                  <Text
                    style={
                      styles.summaryLabel
                    }
                  >
                    Gender
                  </Text>

                  <View
                    style={[
                      styles.summaryGenderBadge,
                      selectedStudent.gender ===
                        "MALE"
                        ? styles.maleBadge
                        : styles.femaleBadge,
                    ]}
                  >

                    <Text
                      style={[
                        styles.summaryGenderText,
                        selectedStudent.gender ===
                          "MALE"
                          ? styles.maleText
                          : styles.femaleText,
                      ]}
                    >
                      {getGenderLabel(
                        selectedStudent.gender
                      )}
                    </Text>

                  </View>

                </View>

              </>
            )}


            {/* ROOM */}

            {selectedRoom && (
              <>

                <View
                  style={
                    styles.summaryRow
                  }
                >

                  <Text
                    style={
                      styles.summaryLabel
                    }
                  >
                    Room
                  </Text>

                  <Text
                    style={
                      styles.summaryValue
                    }
                  >
                    {
                      selectedRoom.roomNumber
                    }
                  </Text>

                </View>


                {/* BLOCK */}

                <View
                  style={
                    styles.summaryRow
                  }
                >

                  <Text
                    style={
                      styles.summaryLabel
                    }
                  >
                    Block
                  </Text>

                  <Text
                    style={
                      styles.summaryValue
                    }
                  >
                    {
                      selectedRoom.floor
                        ?.block?.name
                    }
                  </Text>

                </View>


                {/* BLOCK TYPE */}

                <View
                  style={
                    styles.summaryRow
                  }
                >

                  <Text
                    style={
                      styles.summaryLabel
                    }
                  >
                    Block Type
                  </Text>

                  <Text
                    style={
                      styles.summaryValue
                    }
                  >
                    {
                      selectedRoom.floor
                        ?.block?.type
                    }
                  </Text>

                </View>


                {/* OCCUPANCY */}

                <View
                  style={
                    styles.summaryRow
                  }
                >

                  <Text
                    style={
                      styles.summaryLabel
                    }
                  >
                    Occupancy
                  </Text>

                  <Text
                    style={
                      styles.summaryValue
                    }
                  >
                    {
                      getRoomOccupancy(
                        selectedRoom.id
                      )
                    }{" "}
                    /{" "}
                    {
                      selectedRoom.capacity
                    }
                  </Text>

                </View>


                {/* LOCATION */}

                <View
                  style={
                    styles.summaryRow
                  }
                >

                  <Text
                    style={
                      styles.summaryLabel
                    }
                  >
                    Location
                  </Text>

                  <Text
                    style={
                      styles.summaryValue
                    }
                  >
                    {
                      selectedRoom.floor
                        ?.name
                    }{" "}
                    •{" "}
                    {
                      selectedRoom.floor
                        ?.block?.name
                    }
                  </Text>

                </View>

              </>
            )}

          </View>

        )}


        {/* ==================================================
            ALLOCATE BUTTON
        ================================================== */}

        <TouchableOpacity
          style={[
            styles.allocateButton,
            (!selectedStudent ||
              !selectedRoom ||
              allocating) &&
              styles.disabledButton,
          ]}
          onPress={
            handleAllocate
          }
          disabled={
            !selectedStudent ||
            !selectedRoom ||
            allocating
          }
          activeOpacity={0.8}
        >

          {allocating ? (

            <>

              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.allocateButtonText
                }
              >
                Allocating...
              </Text>

            </>

          ) : (

            <Text
              style={
                styles.allocateButtonText
              }
            >
              Allocate Room
            </Text>

          )}

        </TouchableOpacity>


        {/* ==================================================
            RULES
        ================================================== */}

        <View
          style={styles.infoCard}
        >

          <Text
            style={styles.infoTitle}
          >
            Room Allocation Rules
          </Text>

          <Text
            style={styles.infoText}
          >
            • Only approved students can be
            allocated a room.
          </Text>

          <Text
            style={styles.infoText}
          >
            • A student can have only one
            active room.
          </Text>

          <Text
            style={styles.infoText}
          >
            • Male students can only be
            allocated to BOYS blocks.
          </Text>

          <Text
            style={styles.infoText}
          >
            • Female students can only be
            allocated to GIRLS blocks.
          </Text>

          <Text
            style={styles.infoText}
          >
            • Inactive rooms cannot be
            allocated.
          </Text>

          <Text
            style={styles.infoText}
          >
            • Rooms cannot exceed their
            configured capacity.
          </Text>

        </View>


        {/* ==================================================
            BOTTOM LOGOUT
        ================================================== */}

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

    </View>
  );
}


// ==========================================================
// STYLES
// ==========================================================

const styles = StyleSheet.create({

  pageContainer: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },

  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },

  content: {
    padding: 20,
    paddingTop: 55,
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


  // ========================================================
  // BACK
  // ========================================================

  backButton: {
    marginBottom: 20,
  },

  backText: {
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "600",
  },


  // ========================================================
  // HEADER
  // ========================================================

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
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
  // SECTIONS
  // ========================================================

  section: {
    marginBottom: 22,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 10,
  },


  // ========================================================
  // DROPDOWN
  // ========================================================

  dropdown: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    minHeight: 68,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dropdownSelected: {
    borderColor: "#2563EB",
  },

  dropdownDisabled: {
    opacity: 0.65,
    backgroundColor: "#F8FAFC",
  },

  dropdownContent: {
    flex: 1,
  },

  placeholder: {
    color: "#94A3B8",
    fontSize: 15,
  },

  disabledPlaceholder: {
    color: "#CBD5E1",
  },

  selectedStudentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 10,
  },

  selectedTitle: {
    color: "#1E293B",
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },

  selectedSubtitle: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 4,
  },

  dropdownArrow: {
    color: "#2563EB",
    fontSize: 15,
    marginLeft: 10,
  },

  disabledArrow: {
    color: "#CBD5E1",
  },

  dropdownList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    marginTop: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  dropdownItem: {
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  fullRoomItem: {
    opacity: 0.45,
  },


  // ========================================================
  // STUDENT
  // ========================================================

  studentIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  studentIconText: {
    fontSize: 21,
  },

  studentItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },


  // ========================================================
  // ROOM
  // ========================================================

  roomIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  roomIconText: {
    fontSize: 21,
  },


  // ========================================================
  // ITEMS
  // ========================================================

  itemContent: {
    flex: 1,
  },

  itemTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    flex: 1,
  },

  itemSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 3,
  },

  itemDetails: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 4,
  },


  // ========================================================
  // GENDER BADGES
  // ========================================================

  genderBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginLeft: 8,
  },

  genderBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    marginLeft: 8,
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

  genderBadgeTextSmall: {
    fontSize: 10,
    fontWeight: "700",
  },

  maleText: {
    color: "#1D4ED8",
  },

  femaleText: {
    color: "#BE185D",
  },


  // ========================================================
  // GENDER INFORMATION
  // ========================================================

  genderInfoCard: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 14,
    padding: 15,
    marginBottom: 22,
    flexDirection: "row",
    alignItems: "center",
  },

  genderInfoIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  genderInfoIconText: {
    fontSize: 25,
    color: "#2563EB",
    fontWeight: "700",
  },

  genderInfoContent: {
    flex: 1,
  },

  genderInfoTitle: {
    color: "#1E40AF",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },

  genderInfoText: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 19,
  },

  genderInfoBold: {
    fontWeight: "700",
    color: "#1E40AF",
  },


  // ========================================================
  // ROOM TITLE / CAPACITY
  // ========================================================

  roomTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  capacityBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    marginLeft: 10,
  },

  fullBadge: {
    backgroundColor: "#FEE2E2",
  },

  capacityText: {
    color: "#15803D",
    fontSize: 12,
    fontWeight: "700",
  },

  fullText: {
    color: "#DC2626",
  },


  // ========================================================
  // EMPTY
  // ========================================================

  emptyDropdown: {
    padding: 20,
    alignItems: "center",
  },

  emptyDropdownText: {
    color: "#64748B",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  noRoomIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  noRoomIconText: {
    fontSize: 27,
  },

  noRoomTitle: {
    color: "#1E293B",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },


  // ========================================================
  // SUMMARY
  // ========================================================

  summaryCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },

  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E40AF",
    marginBottom: 12,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 7,
  },

  summaryLabel: {
    color: "#64748B",
    fontSize: 14,
    flex: 1,
  },

  summaryValue: {
    color: "#1E293B",
    fontSize: 14,
    fontWeight: "700",
    flex: 1.5,
    textAlign: "right",
  },

  summaryGenderBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },

  summaryGenderText: {
    fontSize: 12,
    fontWeight: "700",
  },


  // ========================================================
  // ALLOCATE BUTTON
  // ========================================================

  allocateButton: {
    backgroundColor: "#16A34A",
    borderRadius: 12,
    minHeight: 54,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 22,
    flexDirection: "row",
    gap: 10,
  },

  allocateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  disabledButton: {
    backgroundColor: "#94A3B8",
  },


  // ========================================================
  // INFO
  // ========================================================

  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },

  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 12,
  },

  infoText: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 23,
    marginBottom: 5,
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


  // ========================================================
  // SUCCESS OVERLAY
  // ========================================================

  successOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    backgroundColor:
      "rgba(15, 23, 42, 0.60)",

    justifyContent: "center",
    alignItems: "center",

    padding: 20,

    zIndex: 9999,
    elevation: 9999,
  },


  // ========================================================
  // SUCCESS MODAL
  // ========================================================

  successModal: {
    width: "100%",
    maxWidth: 430,

    backgroundColor: "#FFFFFF",

    borderRadius: 20,

    padding: 28,

    alignItems: "center",

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 6,
    },

    shadowOpacity: 0.20,

    shadowRadius: 15,

    elevation: 10,
  },


  // ========================================================
  // SUCCESS ICON
  // ========================================================

  successIconCircle: {
    width: 72,
    height: 72,

    borderRadius: 36,

    backgroundColor: "#DCFCE7",

    justifyContent: "center",
    alignItems: "center",

    marginBottom: 18,
  },

  successIcon: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#16A34A",
  },


  // ========================================================
  // SUCCESS TITLE
  // ========================================================

  successTitle: {
    fontSize: 24,
    fontWeight: "bold",

    color: "#1E293B",

    marginBottom: 12,

    textAlign: "center",
  },


  // ========================================================
  // SUCCESS MESSAGE
  // ========================================================

  successMessage: {
    fontSize: 16,
    fontWeight: "600",

    color: "#334155",

    textAlign: "center",

    lineHeight: 24,

    marginBottom: 10,
  },


  // ========================================================
  // SUCCESS SUBTEXT
  // ========================================================

  successSubtext: {
    fontSize: 14,

    color: "#64748B",

    textAlign: "center",

    lineHeight: 21,

    marginBottom: 22,
  },


  // ========================================================
  // SUCCESS BUTTON
  // ========================================================

  successButton: {
    width: "100%",

    backgroundColor: "#16A34A",

    borderRadius: 12,

    paddingVertical: 14,

    alignItems: "center",
  },

  successButtonText: {
    color: "#FFFFFF",

    fontSize: 16,

    fontWeight: "bold",
  },
});