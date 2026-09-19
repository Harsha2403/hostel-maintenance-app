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
  TextInput,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_URL } from "../config/api";

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


type ParentContactStatus =
  | "PENDING"
  | "PHONE_VERIFIED"
  | "APPROVED"
  | "REJECTED";

type PendingParentContact = {
  id: string;
  studentId: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string | null;
  isPrimary: boolean;
  isEmergencyContact: boolean;
  phoneVerified: boolean;
  phoneVerifiedAt?: string | null;
  status: ParentContactStatus;
  approvedAt?: string | null;
  approvedBy?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    studentNumber: string;
    gender: "MALE" | "FEMALE";
    department?: string | null;
    course?: string | null;
    year?: number | null;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string | null;
    };
  };
};


type ParentAccount = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string | null;
  isPrimary: boolean;
  isEmergencyContact: boolean;
  phoneVerified: boolean;
  status: ParentContactStatus;
  parentUserId?: string | null;
  createdAt: string;
  updatedAt: string;

  student?: {
    id: string;
    studentNumber: string;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string | null;
    };
  };
};



type HealthRequestStatus =
  | "REPORTED"
  | "ACKNOWLEDGED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED";

type HealthRequestItem = {
  id: string;
  studentId: string;
  requestType: string;
  description: string;
  priority: "NORMAL" | "HIGH" | "EMERGENCY" | string;
  status: HealthRequestStatus;
  handledById?: string | null;
  reportedAt: string;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    studentNumber: string;
    user?: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string | null;
    };
  };
  handledBy?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
};

type EmergencyStatus =
  | "ACTIVE"
  | "ACKNOWLEDGED"
  | "RESOLVED"
  | "CLOSED";

type EmergencyNotification = {
  id: string;
  notificationType: "SMS" | "PUSH" | "EMAIL" | string;
  status: "PENDING" | "SENT" | "DELIVERED" | "FAILED" | string;
  sentAt?: string | null;
  deliveredAt?: string | null;
  failureReason?: string | null;
  parentContact?: {
    id: string;
    name: string;
    relationship: string;
    phone: string;
    email?: string | null;
  };
};

type EmergencyItem = {
  id: string;
  healthRequestId: string;
  studentId: string;
  severity: "HIGH" | "CRITICAL" | string;
  description: string;
  status: EmergencyStatus;
  handledById?: string | null;
  reportedById: string;
  parentNotified: boolean;
  reportedAt: string;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    studentNumber: string;
    user?: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string | null;
    };
  };
  handledBy?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
  parentNotifications?: EmergencyNotification[];
};

export default function AdminDashboard() {
  const router = useRouter();

  const [pendingStudents, setPendingStudents] =
    useState<PendingStudent[]>([]);

  const [loadingPending, setLoadingPending] =
    useState(true);

  const [processingStudentId, setProcessingStudentId] =
    useState<string | null>(null);

  const [pendingParentContacts, setPendingParentContacts] =
    useState<PendingParentContact[]>([]);

  const [loadingParentContacts, setLoadingParentContacts] =
    useState(true);

  const [parentAccounts, setParentAccounts] = 
  useState<ParentAccount[]>([]);

  const [loadingParentAccounts, setLoadingParentAccounts] = 
  useState(true);

  const [processingParentId, setProcessingParentId] =
    useState<string | null>(null);

  const [healthRequests, setHealthRequests] =
    useState<HealthRequestItem[]>([]);

  const [emergencies, setEmergencies] =
    useState<EmergencyItem[]>([]);

  const [loadingHealthEmergency,
  setLoadingHealthEmergency] =
    useState(true);

  const [processingHealthId, setProcessingHealthId] =
    useState<string | null>(null);

  const [processingEmergencyId, setProcessingEmergencyId] =
    useState<string | null>(null);
  const [parentAccountsExpanded, setParentAccountsExpanded] = useState(true);
  const [parentAccountSearch, setParentAccountSearch] = useState("");
  const [healthEmergencyExpanded, setHealthEmergencyExpanded] = useState(true);
  const [healthEmergencySearch, setHealthEmergencySearch] = useState("");


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
      loadPendingParentContacts();
      loadParentAccounts();
      loadHealthEmergencyData();
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
  // LOAD PENDING PARENT CONTACTS
  // ==========================================================

  const loadPendingParentContacts = async () => {
    try {
      setLoadingParentContacts(true);

      const token =
        await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await axios.get(
        `${API_URL}/api/parent-contacts/pending`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success) {
        setPendingParentContacts(
          response.data.data || []
        );
      } else {
        setPendingParentContacts([]);
      }
    } catch (error: any) {
      console.log(
        "Load pending parent contacts error:",
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
          "Unable to load parent verification requests."
      );
    } finally {
      setLoadingParentContacts(false);
    }
  };

  // ==========================================================
// LOAD ALL APPROVED PARENT ACCOUNTS
// ==========================================================

const loadParentAccounts = async () => {
  try {
    setLoadingParentAccounts(true);

    const token =
      await AsyncStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    const response = await axios.get(
      `${API_URL}/api/parent-contacts/all`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(
      "Parent accounts response:",
      response.data
    );

    if (response.data?.success) {
      setParentAccounts(
        response.data.data || []
      );
    } else {
      setParentAccounts([]);
    }
  } catch (error: any) {
    console.log(
      "Load parent accounts error:",
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
        "Unable to load parent accounts."
    );
  } finally {
    setLoadingParentAccounts(false);
  }
};

  // ==========================================================
  // APPROVE PARENT CONTACT
  // ==========================================================

const handleApproveParent = async (
  contact: PendingParentContact
) => {
  try {
    setProcessingParentId(contact.id);

    const token = await AsyncStorage.getItem("token");

    if (!token) {
      Alert.alert(
        "Session Expired",
        "Please login again."
      );

      router.replace("/login");
      return;
    }

    if (!contact.phoneVerified) {
      Alert.alert(
        "Cannot Approve",
        "The parent's mobile number has not been verified yet."
      );
      return;
    }

    console.log(
      "=========================================="
    );
    console.log("PARENT APPROVAL STARTED");
    console.log("Contact ID:", contact.id);
    console.log("Parent Name:", contact.name);
    console.log("Parent Email:", contact.email);
    console.log("Parent Phone:", contact.phone);
    console.log(
      "=========================================="
    );

    const response = await axios.put(
      `${API_URL}/api/parent-contacts/${contact.id}/approve`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(
      "=========================================="
    );
    console.log("PARENT APPROVAL API RESPONSE");
    console.log(
      JSON.stringify(response.data, null, 2)
    );
    console.log(
      "=========================================="
    );

    if (!response.data?.success) {
      Alert.alert(
        "Approval Failed",
        response.data?.message ||
          "Unable to approve parent contact."
      );
      return;
    }

    // Remove approved request from pending list
    setPendingParentContacts((current) =>
      current.filter(
        (item) => item.id !== contact.id
      )
    );

    // Read backend response
    const approvalData =
      response.data?.data;

    const parentAccount =
      approvalData?.parentAccount;

    const temporaryPassword =
      approvalData?.temporaryPassword;

    const parentEmail =
      parentAccount?.email ||
      contact.email ||
      "Not provided";

    console.log(
      "Parent Account:",
      parentAccount
    );

    console.log(
      "Temporary Password:",
      temporaryPassword
    );

    // Refresh approved parent accounts so the newly approved
    // parent appears immediately in the Parent Accounts section.
    await loadParentAccounts();

    /*
     * NEW PARENT ACCOUNT
     *
     * Backend created a brand-new Parent user
     * and returned a temporary password.
     */
    if (
      typeof temporaryPassword === "string" &&
      temporaryPassword.trim().length > 0
    ) {
      Alert.alert(
        "Parent Approved",
        `Parent: ${contact.name}\n\n` +
          `Relationship: ${contact.relationship}\n\n` +
          `Email: ${parentEmail}\n\n` +
          `Temporary Password:\n${temporaryPassword}\n\n` +
          `Parent account created successfully.\n\n` +
          `The parent can now login using the email and temporary password.\n\n` +
          `The parent must change this password after the first login.`,
        [
          {
            text: "OK",
            style: "default",
          },
        ]
      );

      return;
    }

    /*
     * EXISTING PARENT ACCOUNT
     *
     * Backend found an existing Parent user,
     * so no new password was generated.
     */
    Alert.alert(
      "Parent Approved",
      `Parent: ${contact.name}\n\n` +
        `Email: ${parentEmail}\n\n` +
        `Parent contact approved successfully.\n\n` +
        `An existing Parent account was linked to this contact.\n\n` +
        `No new temporary password was generated.`,
      [
        {
          text: "OK",
          style: "default",
        },
      ]
    );
  } catch (error: any) {
    console.log(
      "=========================================="
    );
    console.log("PARENT APPROVAL ERROR");
    console.log(
      error?.response?.data || error
    );
    console.log(
      "=========================================="
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
        "Unable to approve parent contact."
    );
  } finally {
    setProcessingParentId(null);
  }
};

  // ==========================================================
  // REJECT PARENT CONTACT
  // ==========================================================

  const handleRejectParent = async (
    contact: PendingParentContact
  ) => {
    Alert.prompt(
      "Reject Parent Contact",
      "Enter the reason for rejection:",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reject",
          style: "destructive",
          onPress: async (reason?: string) => {
            try {
              setProcessingParentId(contact.id);

              const token =
                await AsyncStorage.getItem("token");

              if (!token) {
                router.replace("/login");
                return;
              }

              const response = await axios.put(
                `${API_URL}/api/parent-contacts/${contact.id}/reject`,
                {
                  rejectionReason:
                    reason?.trim() ||
                    "Rejected by Admin",
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
                setPendingParentContacts(
                  (current) =>
                    current.filter(
                      (item) =>
                        item.id !== contact.id
                    )
                );

                Alert.alert(
                  "Parent Rejected",
                  `${contact.name} has been rejected.`
                );
              } else {
                Alert.alert(
                  "Rejection Failed",
                  response.data?.message ||
                    "Unable to reject parent contact."
                );
              }
            } catch (error: any) {
              console.log(
                "Reject parent contact error:",
                error?.response?.data || error
              );

              Alert.alert(
                "Rejection Failed",
                error?.response?.data?.message ||
                  error?.message ||
                  "Unable to reject parent contact."
              );
            } finally {
              setProcessingParentId(null);
            }
          },
        },
      ],
      "plain-text"
    );
  };




  // ==========================================================
// DELETE PARENT ACCOUNT
// ==========================================================

const handleDeleteParent = async (
  contact: ParentAccount
) => {
  Alert.alert(
    "Delete Parent",
    `Are you sure you want to delete ${contact.name}?\n\nThis will remove the parent contact and deactivate the parent account.`,
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",

        onPress: async () => {
          try {
            setProcessingParentId(
              contact.id
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

            const response =
              await axios.delete(
                `${API_URL}/api/parent-contacts/${contact.id}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

            console.log(
              "Delete parent response:",
              response.data
            );

            if (response.data?.success) {
              setParentAccounts(
                (current) =>
                  current.filter(
                    (item) =>
                      item.id !== contact.id
                  )
              );

              Alert.alert(
                "Parent Deleted",
                `${contact.name}'s parent contact has been deleted and the parent account has been deactivated successfully.`
              );
            } else {
              Alert.alert(
                "Delete Failed",
                response.data?.message ||
                  "Unable to delete parent."
              );
            }
          } catch (error: any) {
            console.log(
              "Delete parent error:",
              error?.response?.data ||
                error
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
              "Delete Failed",
              error?.response?.data?.message ||
                error?.message ||
                "Unable to delete parent."
            );
          } finally {
            setProcessingParentId(null);
          }
        },
      },
    ]
  );
};


  // ==========================================================
  // LOAD HEALTH & EMERGENCY DATA
  // ==========================================================

  const loadHealthEmergencyData = async () => {
    try {
      setLoadingHealthEmergency(true);

      const token =
        await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [healthResponse, emergencyResponse] =
        await Promise.all([
          axios.get(
            `${API_URL}/api/health-requests`,
            { headers }
          ),
          axios.get(
            `${API_URL}/api/emergencies`,
            { headers }
          ),
        ]);

      if (healthResponse.data?.success) {
        setHealthRequests(
          healthResponse.data.data || []
        );
      }

      if (emergencyResponse.data?.success) {
        setEmergencies(
          emergencyResponse.data.data || []
        );
      }
    } catch (error: any) {
      console.log(
        "Load health and emergency data error:",
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
          "Unable to load health and emergency records."
      );
    } finally {
      setLoadingHealthEmergency(false);
    }
  };

  // ==========================================================
  // HEALTH REQUEST STATUS UPDATE
  // ==========================================================

  const updateHealthStatus = async (
    request: HealthRequestItem,
    status: HealthRequestStatus
  ) => {
    try {
      setProcessingHealthId(request.id);

      const token =
        await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await axios.put(
        `${API_URL}/api/health-requests/${request.id}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Unable to update health request."
        );
      }

      setHealthRequests((current) =>
        current.map((item) =>
          item.id === request.id
            ? {
                ...item,
                ...response.data.data,
              }
            : item
        )
      );

      Alert.alert(
        "Status Updated",
        `Health request moved to ${status}.`
      );
    } catch (error: any) {
      console.log(
        "Health status update error:",
        error?.response?.data || error
      );

      Alert.alert(
        "Update Failed",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to update health request."
      );
    } finally {
      setProcessingHealthId(null);
    }
  };

  // ==========================================================
  // EMERGENCY STATUS UPDATE
  // ==========================================================

  const updateEmergencyStatus = async (
    emergency: EmergencyItem,
    status: EmergencyStatus
  ) => {
    try {
      setProcessingEmergencyId(
        emergency.id
      );

      const token =
        await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await axios.put(
        `${API_URL}/api/emergencies/${emergency.id}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Unable to update emergency."
        );
      }

      setEmergencies((current) =>
        current.map((item) =>
          item.id === emergency.id
            ? {
                ...item,
                ...response.data.data,
              }
            : item
        )
      );

      Alert.alert(
        "Emergency Updated",
        `Emergency moved to ${status}.`
      );
    } catch (error: any) {
      console.log(
        "Emergency status update error:",
        error?.response?.data || error
      );

      Alert.alert(
        "Update Failed",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to update emergency."
      );
    } finally {
      setProcessingEmergencyId(null);
    }
  };

  // ==========================================================
  // LOGOUT
  // ==========================================================

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

  const filteredParentAccounts = parentAccounts.filter((contact) => {
    const studentName =
      `${contact.student?.user?.firstName || ""} ${
        contact.student?.user?.lastName || ""
      }`.trim();

    return [
      contact.name,
      contact.relationship,
      contact.phone,
      contact.email,
      contact.student?.studentNumber,
      studentName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(parentAccountSearch.trim().toLowerCase());
  });

  const filteredHealthRequests = healthRequests.filter((request) => {
    const studentName =
      `${request.student?.user?.firstName || ""} ${
        request.student?.user?.lastName || ""
      }`.trim();

    return [
      request.requestType,
      request.description,
      request.priority,
      request.status,
      request.student?.studentNumber,
      studentName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(healthEmergencySearch.trim().toLowerCase());
  });

  const filteredEmergencies = emergencies.filter((emergency) => {
    const studentName =
      `${emergency.student?.user?.firstName || ""} ${
        emergency.student?.user?.lastName || ""
      }`.trim();

    return [
      emergency.severity,
      emergency.description,
      emergency.status,
      emergency.student?.studentNumber,
      studentName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(healthEmergencySearch.trim().toLowerCase());
  });

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
          <Text style={styles.brandTitle}>
            Hostel Maintenance
          </Text>

          <Text style={styles.title}>
            Admin Dashboard
          </Text>

          <Text style={styles.subtitle}>
            Hostel Maintenance System
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
          PARENT VERIFICATION REQUESTS
      ==================================================== */}

      <View style={styles.parentSectionHeader}>
        <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionTitle}>
            Parent Verification Requests
          </Text>

          <Text style={styles.sectionSubtitle}>
            Review verified parent contacts before they become
            official hostel records
          </Text>
        </View>

        <View style={styles.parentCountBadge}>
          <Text style={styles.parentCountText}>
            {pendingParentContacts.length}
          </Text>
        </View>
      </View>

      {loadingParentContacts ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator
            size="large"
            color="#2563EB"
          />

          <Text style={styles.loadingText}>
            Loading parent requests...
          </Text>
        </View>
      ) : pendingParentContacts.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <Text style={styles.emptyIcon}>
              ✓
            </Text>
          </View>

          <Text style={styles.emptyTitle}>
            No Parent Requests
          </Text>

          <Text style={styles.emptyText}>
            There are currently no parent contacts waiting
            for Admin verification or approval.
          </Text>
        </View>
      ) : (
        pendingParentContacts.map((contact) => {
          const processing =
            processingParentId === contact.id;

          const studentName =
            `${contact.student?.user?.firstName || ""} ${
              contact.student?.user?.lastName || ""
            }`.trim() || "Unknown Student";

          return (
            <View
              key={contact.id}
              style={styles.parentCard}
            >
              <View style={styles.parentCardHeader}>
                <View style={styles.parentAvatar}>
                  <Text style={styles.parentAvatarText}>
                    👨‍👩‍👧
                  </Text>
                </View>

                <View style={styles.parentHeaderContent}>
                  <Text style={styles.parentContactName}>
                    {contact.name}
                  </Text>

                  <Text style={styles.parentRelationship}>
                    {contact.relationship}
                  </Text>
                </View>

                <View
                  style={[
                    styles.parentStatusBadge,
                    contact.phoneVerified
                      ? styles.parentVerifiedBadge
                      : styles.parentPendingBadge,
                  ]}
                >
                  <Text style={styles.parentStatusText}>
                    {contact.phoneVerified
                      ? "PHONE VERIFIED"
                      : "PENDING"}
                  </Text>
                </View>
              </View>

              <View style={styles.parentDetailsBox}>
                <View style={styles.parentDetailRow}>
                  <Text style={styles.parentDetailLabel}>
                    Student
                  </Text>

                  <Text style={styles.parentDetailValue}>
                    {studentName}
                  </Text>
                </View>

                <View style={styles.parentDetailRow}>
                  <Text style={styles.parentDetailLabel}>
                    Student Number
                  </Text>

                  <Text style={styles.parentDetailValue}>
                    {contact.student?.studentNumber ||
                      "N/A"}
                  </Text>
                </View>

                <View style={styles.parentDetailRow}>
                  <Text style={styles.parentDetailLabel}>
                    Parent Phone
                  </Text>

                  <Text style={styles.parentDetailValue}>
                    {contact.phone}
                  </Text>
                </View>

                <View style={styles.parentDetailRow}>
                  <Text style={styles.parentDetailLabel}>
                    Email
                  </Text>

                  <Text style={styles.parentDetailValue}>
                    {contact.email || "Not provided"}
                  </Text>
                </View>

                <View style={styles.parentDetailRow}>
                  <Text style={styles.parentDetailLabel}>
                    Primary Contact
                  </Text>

                  <Text style={styles.parentDetailValue}>
                    {contact.isPrimary ? "Yes" : "No"}
                  </Text>
                </View>

                <View style={styles.parentDetailRow}>
                  <Text style={styles.parentDetailLabel}>
                    Emergency Contact
                  </Text>

                  <Text style={styles.parentDetailValue}>
                    {contact.isEmergencyContact
                      ? "Yes"
                      : "No"}
                  </Text>
                </View>
              </View>



              {!contact.phoneVerified ? (
                <View style={styles.parentWarningBox}>
                  <Text style={styles.parentWarningText}>
                    The parent's mobile number has not been
                    OTP verified yet. This contact cannot be
                    approved until verification is complete.
                  </Text>
                </View>
              ) : (
                <View style={styles.parentSuccessBox}>
                  <Text style={styles.parentSuccessText}>
                    ✓ Parent mobile number verified. This
                    request is ready for Admin approval.
                  </Text>
                </View>
              )}

              <View style={styles.parentActionContainer}>
                <TouchableOpacity
                  style={[
                    styles.parentRejectButton,
                    processing && styles.disabledButton,
                  ]}
                  onPress={() =>
                    handleRejectParent(contact)
                  }
                  disabled={processing}
                  activeOpacity={0.8}
                >
                  {processing ? (
                    <ActivityIndicator
                      size="small"
                      color="#DC2626"
                    />
                  ) : (
                    <Text style={styles.parentRejectText}>
                      Reject
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.parentApproveButton,
                    (!contact.phoneVerified ||
                      processing) &&
                      styles.disabledButton,
                  ]}
                  onPress={() =>
                    handleApproveParent(contact)
                  }
                  disabled={
                    !contact.phoneVerified ||
                    processing
                  }
                  activeOpacity={0.8}
                >
                  {processing ? (
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />
                  ) : (
                    <Text style={styles.parentApproveText}>
                      Approve
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

 {/* ====================================================
    PARENT ACCOUNTS
==================================================== */}

<TouchableOpacity
  style={styles.parentSectionHeader}
  onPress={() =>
    setParentAccountsExpanded((current) => !current)
  }
  activeOpacity={0.8}
>
  <View style={styles.sectionHeaderText}>
    <Text style={styles.sectionTitle}>
      Parent Accounts
    </Text>

    <Text style={styles.sectionSubtitle}>
      Manage approved parent accounts
    </Text>
  </View>

  <View style={styles.parentHeaderRight}>
    <View style={styles.parentCountBadge}>
      <Text style={styles.parentCountText}>
        {parentAccounts.length}
      </Text>
    </View>

    <Text style={styles.dropdownArrow}>
      {parentAccountsExpanded ? "▲" : "▼"}
    </Text>
  </View>
</TouchableOpacity>

{parentAccountsExpanded && (
  <>
    <View style={styles.searchContainer}>
      <TextInput
        style={styles.searchInput}
        value={parentAccountSearch}
        onChangeText={setParentAccountSearch}
        placeholder="Search parent accounts..."
        placeholderTextColor="#94A3B8"
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />
    </View>

    {loadingParentAccounts ? (
  <View style={styles.loadingCard}>
    <ActivityIndicator
      size="large"
      color="#2563EB"
    />

    <Text style={styles.loadingText}>
      Loading parent accounts...
    </Text>
  </View>
) : parentAccounts.length === 0 ? (
  <View style={styles.emptyCard}>
    <View style={styles.emptyIconCircle}>
      <Text style={styles.emptyIcon}>
        ✓
      </Text>
    </View>

    <Text style={styles.emptyTitle}>
      No Parent Accounts
    </Text>

    <Text style={styles.emptyText}>
      There are currently no approved parent
      accounts.
    </Text>
  </View>
) : (
  filteredParentAccounts.map((contact) => {
    const processing =
      processingParentId === contact.id;

    const studentName =
      `${contact.student?.user?.firstName || ""} ${
        contact.student?.user?.lastName || ""
      }`.trim() || "Unknown Student";

    return (
      <View
        key={contact.id}
        style={styles.parentCard}
      >
        {/* PARENT HEADER */}

        <View style={styles.parentCardHeader}>
          <View style={styles.parentAvatar}>
            <Text style={styles.parentAvatarText}>
              👨‍👩‍👧
            </Text>
          </View>

          <View style={styles.parentHeaderContent}>
            <Text style={styles.parentContactName}>
              {contact.name}
            </Text>

            <Text style={styles.parentRelationship}>
              {contact.relationship}
            </Text>
          </View>

          <View
            style={[
              styles.parentStatusBadge,
              styles.parentVerifiedBadge,
            ]}
          >
            <Text style={styles.parentStatusText}>
              APPROVED
            </Text>
          </View>
        </View>

        {/* PARENT DETAILS */}

        <View style={styles.parentDetailsBox}>
          <View style={styles.parentDetailRow}>
            <Text style={styles.parentDetailLabel}>
              Student
            </Text>

            <Text style={styles.parentDetailValue}>
              {studentName}
            </Text>
          </View>

          <View style={styles.parentDetailRow}>
            <Text style={styles.parentDetailLabel}>
              Student Number
            </Text>

            <Text style={styles.parentDetailValue}>
              {contact.student?.studentNumber ||
                "N/A"}
            </Text>
          </View>

          <View style={styles.parentDetailRow}>
            <Text style={styles.parentDetailLabel}>
              Parent Phone
            </Text>

            <Text style={styles.parentDetailValue}>
              {contact.phone}
            </Text>
          </View>

          <View style={styles.parentDetailRow}>
            <Text style={styles.parentDetailLabel}>
              Email
            </Text>

            <Text style={styles.parentDetailValue}>
              {contact.email ||
                "Not provided"}
            </Text>
          </View>

          <View style={styles.parentDetailRow}>
            <Text style={styles.parentDetailLabel}>
              Primary Contact
            </Text>

            <Text style={styles.parentDetailValue}>
              {contact.isPrimary
                ? "Yes"
                : "No"}
            </Text>
          </View>

          <View style={styles.parentDetailRow}>
            <Text style={styles.parentDetailLabel}>
              Emergency Contact
            </Text>

            <Text style={styles.parentDetailValue}>
              {contact.isEmergencyContact
                ? "Yes"
                : "No"}
            </Text>
          </View>
        </View>

        {/* ACCOUNT STATUS */}

        <View style={styles.parentSuccessBox}>
          <Text style={styles.parentSuccessText}>
            ✓ This parent account is approved
            and linked to the student.
          </Text>
        </View>

        {/* DELETE BUTTON */}

        <View style={styles.parentActionContainer}>
          <TouchableOpacity
            style={[
              styles.parentDeleteButton,
              processing &&
                styles.disabledButton,
            ]}
            onPress={() =>
              handleDeleteParent(contact)
            }
            disabled={processing}
            activeOpacity={0.8}
          >
            {processing ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <Text
                style={styles.parentDeleteText}
              >
                Delete Parent
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  })
)}

  </>
)}
{/* ====================================================
          HEALTH & EMERGENCY
      ==================================================== */}

      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() =>
          setHealthEmergencyExpanded((current) => !current)
        }
        activeOpacity={0.8}
      >
        <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionTitle}>
            Health & Emergency
          </Text>

          <Text style={styles.sectionSubtitle}>
            Monitor student health requests and emergency
            incidents in real time
          </Text>
        </View>

        <View style={styles.healthHeaderRight}>
          <View style={styles.healthCountRow}>
            <View style={styles.healthCountBadge}>
              <Text style={styles.healthCountText}>
                {healthRequests.filter(
                  (item) => item.status !== "CLOSED"
                ).length}
              </Text>
            </View>

            <View style={styles.emergencyCountBadge}>
              <Text style={styles.emergencyCountText}>
                {emergencies.filter(
                  (item) => item.status !== "CLOSED"
                ).length}
              </Text>
            </View>
          </View>

          <Text style={styles.dropdownArrow}>
            {healthEmergencyExpanded ? "▲" : "▼"}
          </Text>
        </View>
      </TouchableOpacity>

      {healthEmergencyExpanded && (
        <>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={healthEmergencySearch}
              onChangeText={setHealthEmergencySearch}
              placeholder="Search health requests and emergencies..."
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          </View>

          {loadingHealthEmergency ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator
            size="large"
            color="#2563EB"
          />
          <Text style={styles.loadingText}>
            Loading health and emergency records...
          </Text>
        </View>
      ) : (
        <>
          {filteredEmergencies.length > 0 && (
            <View style={styles.emergencyAlertHeader}>
              <Text style={styles.emergencyAlertTitle}>
                🚨 Emergency Incidents
              </Text>
              <Text style={styles.emergencyAlertSubtitle}>
                Prioritize active and critical incidents.
              </Text>
            </View>
          )}

          {filteredEmergencies.length === 0 ? (
            <View style={styles.emptyHealthCard}>
              <Text style={styles.emptyHealthIcon}>
                ✓
              </Text>
              <Text style={styles.emptyHealthTitle}>
                No Emergency Incidents
              </Text>
              <Text style={styles.emptyHealthText}>
                There are currently no emergency records.
              </Text>
            </View>
          ) : (
            filteredEmergencies.map((emergency) => {
              const processing =
                processingEmergencyId === emergency.id;

              const studentName =
                `${emergency.student?.user?.firstName || ""} ${
                  emergency.student?.user?.lastName || ""
                }`.trim() || "Unknown Student";

              const nextStatus =
                emergency.status === "ACTIVE"
                  ? "ACKNOWLEDGED"
                  : emergency.status === "ACKNOWLEDGED"
                  ? "RESOLVED"
                  : emergency.status === "RESOLVED"
                  ? "CLOSED"
                  : null;

              return (
                <View
                  key={emergency.id}
                  style={styles.emergencyCard}
                >
                  <View style={styles.healthCardHeader}>
                    <View style={styles.emergencyIconCircle}>
                      <Text style={styles.healthIconText}>
                        🚨
                      </Text>
                    </View>

                    <View style={styles.healthHeaderContent}>
                      <Text style={styles.healthStudentName}>
                        {studentName}
                      </Text>
                      <Text style={styles.healthStudentNumber}>
                        {emergency.student?.studentNumber ||
                          "Unknown Student"}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.severityBadge,
                        emergency.severity === "CRITICAL"
                          ? styles.criticalBadge
                          : styles.highBadge,
                      ]}
                    >
                      <Text style={styles.severityBadgeText}>
                        {emergency.severity}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.healthDetailsBox}>
                    <View style={styles.healthDetailRow}>
                      <Text style={styles.healthDetailLabel}>
                        Status
                      </Text>
                      <Text style={styles.healthDetailValue}>
                        {emergency.status}
                      </Text>
                    </View>

                    <View style={styles.healthDetailRow}>
                      <Text style={styles.healthDetailLabel}>
                        Reported
                      </Text>
                      <Text style={styles.healthDetailValue}>
                        {new Date(
                          emergency.reportedAt
                        ).toLocaleString()}
                      </Text>
                    </View>

                    <View style={styles.healthDetailRow}>
                      <Text style={styles.healthDetailLabel}>
                        Parent Notification
                      </Text>
                      <Text
                        style={[
                          styles.healthDetailValue,
                          emergency.parentNotified
                            ? styles.notifiedText
                            : styles.pendingNotificationText,
                        ]}
                      >
                        {emergency.parentNotified
                          ? "Sent"
                          : "Pending"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.descriptionBox}>
                    <Text style={styles.descriptionLabel}>
                      Description
                    </Text>
                    <Text style={styles.descriptionText}>
                      {emergency.description}
                    </Text>
                  </View>

                  {emergency.parentNotifications?.map(
                    (notification) => (
                      <View
                        key={notification.id}
                        style={styles.notificationBox}
                      >
                        <Text style={styles.notificationTitle}>
                          Parent: {notification.parentContact?.name ||
                            "Unknown"}
                        </Text>
                        <Text style={styles.notificationText}>
                          {notification.notificationType} · {notification.status}
                        </Text>
                      </View>
                    )
                  )}

                  {nextStatus ? (
                    <TouchableOpacity
                      style={[
                        styles.nextStatusButton,
                        processing && styles.disabledButton,
                      ]}
                      disabled={processing}
                      onPress={() =>
                        updateEmergencyStatus(
                          emergency,
                          nextStatus
                        )
                      }
                    >
                      {processing ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.nextStatusButtonText}>
                          Move to {nextStatus}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })
          )}

          <View style={styles.healthListHeader}>
            <Text style={styles.healthListTitle}>
              🏥 Health Requests
            </Text>
            <Text style={styles.healthListSubtitle}>
              Track non-emergency medical requests through closure.
            </Text>
          </View>

          {filteredHealthRequests.length === 0 ? (
            <View style={styles.emptyHealthCard}>
              <Text style={styles.emptyHealthIcon}>
                ✓
              </Text>
              <Text style={styles.emptyHealthTitle}>
                No Health Requests
              </Text>
              <Text style={styles.emptyHealthText}>
                There are currently no health requests.
              </Text>
            </View>
          ) : (
            filteredHealthRequests.map((request) => {
              const processing =
                processingHealthId === request.id;

              const studentName =
                `${request.student?.user?.firstName || ""} ${
                  request.student?.user?.lastName || ""
                }`.trim() || "Unknown Student";

              const nextStatus =
                request.status === "REPORTED"
                  ? "ACKNOWLEDGED"
                  : request.status === "ACKNOWLEDGED"
                  ? "IN_PROGRESS"
                  : request.status === "IN_PROGRESS"
                  ? "RESOLVED"
                  : request.status === "RESOLVED"
                  ? "CLOSED"
                  : null;

              return (
                <View
                  key={request.id}
                  style={styles.healthCard}
                >
                  <View style={styles.healthCardHeader}>
                    <View style={styles.healthIconCircle}>
                      <Text style={styles.healthIconText}>
                        🏥
                      </Text>
                    </View>

                    <View style={styles.healthHeaderContent}>
                      <Text style={styles.healthStudentName}>
                        {studentName}
                      </Text>
                      <Text style={styles.healthStudentNumber}>
                        {request.student?.studentNumber ||
                          "Unknown Student"}
                      </Text>
                    </View>

                    <View style={styles.requestTypeBadge}>
                      <Text style={styles.requestTypeBadgeText}>
                        {request.requestType}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.healthDetailsBox}>
                    <View style={styles.healthDetailRow}>
                      <Text style={styles.healthDetailLabel}>
                        Priority
                      </Text>
                      <Text style={styles.healthDetailValue}>
                        {request.priority}
                      </Text>
                    </View>

                    <View style={styles.healthDetailRow}>
                      <Text style={styles.healthDetailLabel}>
                        Status
                      </Text>
                      <Text style={styles.healthDetailValue}>
                        {request.status}
                      </Text>
                    </View>

                    <View style={styles.healthDetailRow}>
                      <Text style={styles.healthDetailLabel}>
                        Reported
                      </Text>
                      <Text style={styles.healthDetailValue}>
                        {new Date(
                          request.reportedAt
                        ).toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.descriptionBox}>
                    <Text style={styles.descriptionLabel}>
                      Description
                    </Text>
                    <Text style={styles.descriptionText}>
                      {request.description}
                    </Text>
                  </View>

                  {request.handledBy ? (
                    <Text style={styles.handlerText}>
                      Handler: {request.handledBy.firstName} {request.handledBy.lastName}
                    </Text>
                  ) : null}

                  {nextStatus ? (
                    <TouchableOpacity
                      style={[
                        styles.nextHealthStatusButton,
                        processing && styles.disabledButton,
                      ]}
                      disabled={processing}
                      onPress={() =>
                        updateHealthStatus(
                          request,
                          nextStatus
                        )
                      }
                    >
                      {processing ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.nextStatusButtonText}>
                          Move to {nextStatus}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })
          )}
        </>
      )}

        </>
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

      <Text style={styles.footerText}>
        Hostel Maintenance
      </Text>

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
    alignItems: "center",
    backgroundColor: "#1D4ED8",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },

  headerContent: {
    flex: 1,
    paddingRight: 12,
  },

  brandTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#DBEAFE",
    marginBottom: 4,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 15,
    color: "#DBEAFE",
  },

  // ========================================================
  // LOGOUT
  // ========================================================

  logoutButton: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },

  logoutText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  // ========================================================
  // PENDING SECTION
  // ========================================================

  sectionHeader: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
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
    borderRadius: 20,
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
    borderRadius: 20,
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
    borderRadius: 20,
    padding: 20,
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
  // HEALTH & EMERGENCY
  // ========================================================

  parentHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  healthHeaderRight: {
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 8,
  },

  dropdownArrow: {
    fontSize: 12,
    color: "#2563EB",
    fontWeight: "bold",
  },

  searchContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  searchInput: {
    height: 46,
    fontSize: 14,
    color: "#1E293B",
  },

  healthCountRow: {
    flexDirection: "row",
    gap: 8,
  },

  healthCountBadge: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },

  healthCountText: {
    color: "#1D4ED8",
    fontSize: 15,
    fontWeight: "bold",
  },

  emergencyCountBadge: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },

  emergencyCountText: {
    color: "#B91C1C",
    fontSize: 15,
    fontWeight: "bold",
  },

  emergencyAlertHeader: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 14,
    padding: 15,
    marginBottom: 12,
  },

  emergencyAlertTitle: {
    color: "#991B1B",
    fontSize: 17,
    fontWeight: "bold",
  },

  emergencyAlertSubtitle: {
    color: "#7F1D1D",
    fontSize: 13,
    marginTop: 4,
  },

  emergencyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  healthCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
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

  healthCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  healthIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  emergencyIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  healthIconText: {
    fontSize: 22,
  },

  healthHeaderContent: {
    flex: 1,
    paddingRight: 8,
  },

  healthStudentName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1E293B",
  },

  healthStudentNumber: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 3,
  },

  requestTypeBadge: {
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },

  requestTypeBadgeText: {
    color: "#3730A3",
    fontSize: 9,
    fontWeight: "bold",
  },

  severityBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },

  criticalBadge: {
    backgroundColor: "#FEE2E2",
  },

  highBadge: {
    backgroundColor: "#FEF3C7",
  },

  severityBadgeText: {
    color: "#991B1B",
    fontSize: 9,
    fontWeight: "bold",
  },

  healthDetailsBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },

  healthDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },

  healthDetailLabel: {
    flex: 1,
    fontSize: 12,
    color: "#64748B",
  },

  healthDetailValue: {
    flex: 1.6,
    fontSize: 12,
    fontWeight: "600",
    color: "#1E293B",
    textAlign: "right",
  },

  notifiedText: {
    color: "#16A34A",
  },

  pendingNotificationText: {
    color: "#D97706",
  },

  descriptionBox: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 11,
    marginBottom: 12,
  },

  descriptionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 4,
  },

  descriptionText: {
    fontSize: 13,
    color: "#334155",
    lineHeight: 19,
  },

  notificationBox: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },

  notificationTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E3A8A",
  },

  notificationText: {
    fontSize: 11,
    color: "#1D4ED8",
    marginTop: 3,
  },

  handlerText: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 10,
  },

  nextStatusButton: {
    height: 48,
    backgroundColor: "#DC2626",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  nextHealthStatusButton: {
    height: 48,
    backgroundColor: "#2563EB",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  nextStatusButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },

  healthListHeader: {
    marginTop: 3,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
  },

  healthListTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
  },

  healthListSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },

  emptyHealthCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 28,
    marginBottom: 16,
    alignItems: "center",
  },

  emptyHealthIcon: {
    fontSize: 26,
    color: "#16A34A",
    marginBottom: 10,
  },

  emptyHealthTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1E293B",
  },

  emptyHealthText: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
  },

  // ========================================================
  // PARENT VERIFICATION
  // ========================================================

  parentSectionHeader: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginTop: 4,
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

  parentCountBadge: {
    minWidth: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FCE7F3",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },

  parentCountText: {
    color: "#BE185D",
    fontSize: 16,
    fontWeight: "bold",
  },

  parentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
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

  parentCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  parentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FCE7F3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  parentAvatarText: {
    fontSize: 22,
  },

  parentHeaderContent: {
    flex: 1,
    paddingRight: 8,
  },

  parentContactName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
  },

  parentRelationship: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 3,
  },

  parentStatusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },

  parentVerifiedBadge: {
    backgroundColor: "#DCFCE7",
  },

  parentPendingBadge: {
    backgroundColor: "#FEF3C7",
  },

  parentStatusText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#166534",
  },

  parentDetailsBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 13,
    marginBottom: 13,
  },

  parentDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
  },

  parentDetailLabel: {
    fontSize: 13,
    color: "#64748B",
    flex: 1,
  },

  parentDetailValue: {
    fontSize: 13,
    color: "#1E293B",
    fontWeight: "600",
    flex: 1.5,
    textAlign: "right",
  },

  parentWarningBox: {
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    borderRadius: 10,
    padding: 11,
    marginBottom: 13,
  },

  parentWarningText: {
    fontSize: 12,
    color: "#9A3412",
    lineHeight: 18,
  },

  parentSuccessBox: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 10,
    padding: 11,
    marginBottom: 13,
  },

  parentSuccessText: {
    fontSize: 12,
    color: "#166534",
    lineHeight: 18,
  },

  parentActionContainer: {
    flexDirection: "row",
    gap: 10,
  },

  parentRejectButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  parentRejectText: {
    color: "#DC2626",
    fontSize: 15,
    fontWeight: "bold",
  },

  parentApproveButton: {
    flex: 1,
    height: 48,
    backgroundColor: "#16A34A",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  parentApproveText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },

  parentDeleteButton: {
  flex: 1,
  height: 48,
  backgroundColor: "#DC2626",
  borderRadius: 10,
  justifyContent: "center",
  alignItems: "center",
},

parentDeleteText: {
  color: "#FFFFFF",
  fontSize: 15,
  fontWeight: "bold",
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
    borderRadius: 20,
    padding: 20,
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
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
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
    height: 54,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },

  logoutBottomText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  footerText: {
    textAlign: "center",
    fontSize: 13,
    color: "#64748B",
    marginTop: 10,
    marginBottom: 20,
  },
});
