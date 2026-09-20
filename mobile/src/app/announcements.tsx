import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

type AnnouncementAudience =
  | "ALL"
  | "BOYS"
  | "GIRLS"
  | "SPECIFIC_BUILDING"
  | "SPECIFIC_BLOCK";

type AnnouncementPriority =
  | "NORMAL"
  | "IMPORTANT"
  | "URGENT";

type Announcement = {
  id: string;
  title: string;
  message: string;
  audience: AnnouncementAudience;
  priority: AnnouncementPriority;
  hostelBuildingId?: string | null;
  blockId?: string | null;
  createdById?: string | null;
  isActive: boolean;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function AnnouncementsScreen() {
  const [announcements, setAnnouncements] = useState<
    Announcement[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [editingAnnouncement, setEditingAnnouncement] =
    useState<Announcement | null>(null);

  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const [audience, setAudience] =
    useState<AnnouncementAudience>("ALL");

  const [priority, setPriority] =
    useState<AnnouncementPriority>("NORMAL");

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  // ==========================================================
  // LOAD ANNOUNCEMENTS
  // ==========================================================

  const loadAnnouncements = useCallback(async () => {
    try {
      setLoading(true);

      const token =
        await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await axios.get(
        `${API_URL}/api/announcements`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success) {
        setAnnouncements(
          response.data.data || []
        );
      } else {
        setAnnouncements([]);
      }
    } catch (error: any) {
      console.log(
        "Load announcements error:",
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
          "Unable to load announcements."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  // ==========================================================
  // RESET FORM
  // ==========================================================

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setAudience("ALL");
    setPriority("NORMAL");
    setEditingAnnouncement(null);
    setShowForm(false);
  };

  // ==========================================================
  // CREATE FORM
  // ==========================================================

  const openCreateForm = () => {
    setEditingAnnouncement(null);
    setTitle("");
    setMessage("");
    setAudience("ALL");
    setPriority("NORMAL");
    setShowForm(true);
  };

  // ==========================================================
  // EDIT FORM
  // ==========================================================

  const openEditForm = (
    announcement: Announcement
  ) => {
    setEditingAnnouncement(announcement);

    setTitle(
      announcement.title || ""
    );

    setMessage(
      announcement.message || ""
    );

    setAudience(
      announcement.audience || "ALL"
    );

    setPriority(
      announcement.priority || "NORMAL"
    );

    setShowForm(true);
  };

  // ==========================================================
  // CREATE / UPDATE
  // ==========================================================

  const handleSave = async () => {
    const cleanTitle = title.trim();
    const cleanMessage = message.trim();

    if (!cleanTitle) {
      Alert.alert(
        "Missing Title",
        "Please enter an announcement title."
      );
      return;
    }

    if (!cleanMessage) {
      Alert.alert(
        "Missing Message",
        "Please enter the announcement message."
      );
      return;
    }

    try {
      setSaving(true);

      const token =
        await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const payload = {
        title: cleanTitle,
        message: cleanMessage,
        audience,
        priority,
      };

      let response;

      if (editingAnnouncement) {
        response = await axios.put(
          `${API_URL}/api/announcements/${editingAnnouncement.id}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type":
                "application/json",
            },
          }
        );
      } else {
        response = await axios.post(
          `${API_URL}/api/announcements`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type":
                "application/json",
            },
          }
        );
      }

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Unable to save announcement."
        );
      }

      Alert.alert(
        editingAnnouncement
          ? "Announcement Updated"
          : "Announcement Created",
        editingAnnouncement
          ? "The announcement was updated successfully."
          : "The announcement was created successfully."
      );

      resetForm();

      await loadAnnouncements();
    } catch (error: any) {
      console.log(
        "Save announcement error:",
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
        "Save Failed",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to save announcement."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // ACTIVATE / DEACTIVATE
  // ==========================================================

  const handleToggleStatus = async (
    announcement: Announcement
  ) => {
    try {
      setProcessingId(
        announcement.id
      );

      const token =
        await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const nextStatus =
        !announcement.isActive;

      const response = await axios.patch(
        `${API_URL}/api/announcements/${announcement.id}/status`,
        {
          isActive: nextStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Unable to update announcement status."
        );
      }

      setAnnouncements((current) =>
        current.map((item) =>
          item.id === announcement.id
            ? {
                ...item,
                isActive: nextStatus,
              }
            : item
        )
      );

      Alert.alert(
        nextStatus
          ? "Announcement Activated"
          : "Announcement Deactivated",
        nextStatus
          ? "The announcement is now visible to its audience."
          : "The announcement is now hidden from students and parents."
      );
    } catch (error: any) {
      console.log(
        "Toggle announcement error:",
        error?.response?.data || error
      );

      Alert.alert(
        "Update Failed",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to update announcement."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // ==========================================================
  // DELETE
  // ==========================================================

  const handleDelete = (
    announcement: Announcement
  ) => {
    Alert.alert(
      "Delete Announcement",
      `Are you sure you want to delete "${announcement.title}"?`,
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
              setProcessingId(
                announcement.id
              );

              const token =
                await AsyncStorage.getItem(
                  "token"
                );

              if (!token) {
                router.replace("/login");
                return;
              }

              const response =
                await axios.delete(
                  `${API_URL}/api/announcements/${announcement.id}`,
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );

              if (!response.data?.success) {
                throw new Error(
                  response.data?.message ||
                    "Unable to delete announcement."
                );
              }

              setAnnouncements(
                (current) =>
                  current.filter(
                    (item) =>
                      item.id !==
                      announcement.id
                  )
              );

              Alert.alert(
                "Deleted",
                "Announcement deleted successfully."
              );
            } catch (error: any) {
              console.log(
                "Delete announcement error:",
                error?.response?.data ||
                  error
              );

              Alert.alert(
                "Delete Failed",
                error?.response?.data?.message ||
                  error?.message ||
                  "Unable to delete announcement."
              );
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  // ==========================================================
  // SEARCH
  // ==========================================================

  const filteredAnnouncements =
    announcements.filter((announcement) => {
      const value =
        search.trim().toLowerCase();

      if (!value) {
        return true;
      }

      return (
        announcement.title
          ?.toLowerCase()
          .includes(value) ||
        announcement.message
          ?.toLowerCase()
          .includes(value) ||
        announcement.audience
          ?.toLowerCase()
          .includes(value) ||
        announcement.priority
          ?.toLowerCase()
          .includes(value)
      );
    });

  // ==========================================================
  // DATE
  // ==========================================================

  const formatDate = (
    value?: string | null
  ) => {
    if (!value) {
      return "N/A";
    }

    try {
      return new Date(
        value
      ).toLocaleString();
    } catch {
      return "N/A";
    }
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#2563EB"
        />

        <Text style={styles.loadingText}>
          Loading announcements...
        </Text>
      </View>
    );
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={
          styles.contentContainer
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadAnnouncements();
            }}
          />
        }
        showsVerticalScrollIndicator={false}
      >

        {/* ==================================================
            HEADER
        ================================================== */}

        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              Announcements
            </Text>

            <Text style={styles.headerSubtitle}>
              Create and manage hostel announcements
            </Text>
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>
              Back
            </Text>
          </TouchableOpacity>
        </View>

        {/* ==================================================
            CREATE BUTTON
        ================================================== */}

        <TouchableOpacity
          style={styles.createButton}
          onPress={openCreateForm}
          activeOpacity={0.8}
        >
          <Text style={styles.createButtonText}>
            + Create Announcement
          </Text>
        </TouchableOpacity>

        {/* ==================================================
            SEARCH
        ================================================== */}

        <TextInput
          style={styles.searchInput}
          placeholder="Search announcements..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />

        {/* ==================================================
            FORM
        ================================================== */}

        {showForm ? (
          <View style={styles.formCard}>

            <Text style={styles.formTitle}>
              {editingAnnouncement
                ? "Edit Announcement"
                : "Create Announcement"}
            </Text>

            <Text style={styles.label}>
              Title
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter announcement title"
              placeholderTextColor="#94A3B8"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>
              Message
            </Text>

            <TextInput
              style={[
                styles.input,
                styles.messageInput,
              ]}
              placeholder="Enter announcement message"
              placeholderTextColor="#94A3B8"
              value={message}
              onChangeText={setMessage}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.label}>
              Audience
            </Text>

            <View style={styles.optionRow}>

              {(
                [
                  "ALL",
                  "BOYS",
                  "GIRLS",
                ] as AnnouncementAudience[]
              ).map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.optionButton,
                    audience === item &&
                      styles.optionButtonActive,
                  ]}
                  onPress={() =>
                    setAudience(item)
                  }
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.optionText,
                      audience === item &&
                        styles.optionTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}

            </View>

            <Text style={styles.label}>
              Priority
            </Text>

            <View style={styles.optionRow}>

              {(
                [
                  "NORMAL",
                  "IMPORTANT",
                  "URGENT",
                ] as AnnouncementPriority[]
              ).map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.optionButton,
                    priority === item &&
                      styles.optionButtonActive,
                  ]}
                  onPress={() =>
                    setPriority(item)
                  }
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.optionText,
                      priority === item &&
                        styles.optionTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}

            </View>

            <View style={styles.formActions}>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={resetForm}
                disabled={saving}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelText}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  saving &&
                    styles.disabledButton,
                ]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                  />
                ) : (
                  <Text style={styles.saveText}>
                    {editingAnnouncement
                      ? "Update"
                      : "Create"}
                  </Text>
                )}
              </TouchableOpacity>

            </View>
          </View>
        ) : null}

        {/* ==================================================
            SECTION HEADER
        ================================================== */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              All Announcements
            </Text>

            <Text style={styles.sectionSubtitle}>
              {filteredAnnouncements.length} announcement
              {filteredAnnouncements.length === 1
                ? ""
                : "s"}
            </Text>
          </View>
        </View>

        {/* ==================================================
            EMPTY STATE
        ================================================== */}

        {filteredAnnouncements.length === 0 ? (

          <View style={styles.emptyCard}>

            <Text style={styles.emptyIcon}>
              📢
            </Text>

            <Text style={styles.emptyTitle}>
              No Announcements
            </Text>

            <Text style={styles.emptyText}>
              Create an announcement to notify
              students and parents.
            </Text>

          </View>

        ) : (

          /* ==================================================
              ANNOUNCEMENT LIST
          ================================================== */

          filteredAnnouncements.map(
            (announcement) => {

              const processing =
                processingId ===
                announcement.id;

              return (
                <View
                  key={announcement.id}
                  style={styles.announcementCard}
                >

                  {/* HEADER */}

                  <View
                    style={
                      styles.announcementHeader
                    }
                  >

                    <View
                      style={
                        styles.announcementTitleContainer
                      }
                    >

                      <Text
                        style={
                          styles.announcementTitle
                        }
                      >
                        {announcement.title}
                      </Text>

                      <Text
                        style={
                          styles.announcementDate
                        }
                      >
                        {formatDate(
                          announcement.createdAt
                        )}
                      </Text>

                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        announcement.isActive
                          ? styles.activeBadge
                          : styles.inactiveBadge,
                      ]}
                    >
                      <Text
                        style={
                          styles.statusText
                        }
                      >
                        {announcement.isActive
                          ? "ACTIVE"
                          : "INACTIVE"}
                      </Text>
                    </View>

                  </View>

                  {/* MESSAGE */}

                  <Text
                    style={
                      styles.announcementMessage
                    }
                  >
                    {announcement.message}
                  </Text>

                  {/* META */}

                  <View
                    style={styles.metaRow}
                  >

                    <View
                      style={styles.metaBadge}
                    >
                      <Text
                        style={
                          styles.metaText
                        }
                      >
                        Audience:{" "}
                        {announcement.audience}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.metaBadge,
                        announcement.priority ===
                          "URGENT" &&
                          styles.urgentBadge,
                        announcement.priority ===
                          "IMPORTANT" &&
                          styles.importantBadge,
                      ]}
                    >
                      <Text
                        style={
                          styles.metaText
                        }
                      >
                        Priority:{" "}
                        {announcement.priority}
                      </Text>
                    </View>

                  </View>

                  {/* ACTIONS */}

                  <View
                    style={styles.actionRow}
                  >

                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() =>
                        openEditForm(
                          announcement
                        )
                      }
                      disabled={processing}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={
                          styles.editButtonText
                        }
                      >
                        Edit
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.toggleButton,
                        announcement.isActive
                          ? styles.deactivateButton
                          : styles.activateButton,
                      ]}
                      onPress={() =>
                        handleToggleStatus(
                          announcement
                        )
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
                          style={
                            styles.toggleButtonText
                          }
                        >
                          {announcement.isActive
                            ? "Deactivate"
                            : "Activate"}
                        </Text>
                      )}

                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() =>
                        handleDelete(
                          announcement
                        )
                      }
                      disabled={processing}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={
                          styles.deleteButtonText
                        }
                      >
                        Delete
                      </Text>
                    </TouchableOpacity>

                  </View>

                </View>
              );
            }
          )
        )}

      </ScrollView>
    </View>
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

  scrollView: {
    flex: 1,
  },

  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#64748B",
  },

  header: {
    backgroundColor: "#1D4ED8",
    borderRadius: 18,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  headerContent: {
    flex: 1,
    paddingRight: 12,
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 5,
  },

  headerSubtitle: {
    fontSize: 14,
    color: "#DBEAFE",
  },

  backButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  backButtonText: {
    color: "#1D4ED8",
    fontWeight: "bold",
  },

  createButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 14,
  },

  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  searchInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 15,
    color: "#0F172A",
    marginBottom: 16,
  },

  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  formTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 7,
    marginTop: 10,
  },

  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 15,
    color: "#0F172A",
  },

  messageInput: {
    minHeight: 110,
  },

  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  optionButton: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },

  optionButtonActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },

  optionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },

  optionTextActive: {
    color: "#FFFFFF",
  },

  formActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },

  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },

  cancelText: {
    color: "#475569",
    fontWeight: "bold",
  },

  saveButton: {
    flex: 1,
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },

  saveText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  disabledButton: {
    opacity: 0.6,
  },

  sectionHeader: {
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0F172A",
  },

  sectionSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 3,
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 6,
  },

  emptyText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },

  announcementCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 17,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  announcementHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },

  announcementTitleContainer: {
    flex: 1,
  },

  announcementTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0F172A",
  },

  announcementDate: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },

  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  activeBadge: {
    backgroundColor: "#DCFCE7",
  },

  inactiveBadge: {
    backgroundColor: "#FEE2E2",
  },

  statusText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#166534",
  },

  announcementMessage: {
    fontSize: 15,
    color: "#334155",
    lineHeight: 22,
    marginTop: 14,
  },

  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },

  metaBadge: {
    backgroundColor: "#E0F2FE",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  urgentBadge: {
    backgroundColor: "#FEE2E2",
  },

  importantBadge: {
    backgroundColor: "#FEF3C7",
  },

  metaText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#334155",
  },

  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },

  editButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#2563EB",
    borderRadius: 9,
    paddingVertical: 10,
    alignItems: "center",
  },

  editButtonText: {
    color: "#2563EB",
    fontWeight: "bold",
  },

  toggleButton: {
    flex: 1.3,
    borderRadius: 9,
    paddingVertical: 10,
    alignItems: "center",
  },

  activateButton: {
    backgroundColor: "#16A34A",
  },

  deactivateButton: {
    backgroundColor: "#F59E0B",
  },

  toggleButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 12,
  },

  deleteButton: {
    flex: 1,
    backgroundColor: "#DC2626",
    borderRadius: 9,
    paddingVertical: 10,
    alignItems: "center",
  },

  deleteButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});