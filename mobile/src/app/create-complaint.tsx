import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config/api";


interface ComplaintCategory {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export default function CreateComplaint() {
  const [categories, setCategories] = useState<ComplaintCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loading, setLoading] = useState(false);

  // Success message shown directly on the page
  const [successMessage, setSuccessMessage] = useState("");

  // =========================
  // FETCH COMPLAINT CATEGORIES
  // =========================
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);

      const token = await AsyncStorage.getItem("token");

      const response = await axios.get(
        `${API_URL}/api/complaint-categories?active=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Categories:", response.data);

      setCategories(response.data.data || []);
    } catch (error: any) {
      console.log(
        "Fetch categories error:",
        error.response?.data || error.message
      );

      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Failed to load complaint categories."
      );
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // =========================
  // SUBMIT COMPLAINT
  // =========================
  const handleSubmit = async () => {
    // Remove old success message when submitting again
    setSuccessMessage("");

    if (!selectedCategoryId) {
      Alert.alert(
        "Missing Category",
        "Please select a complaint category."
      );
      return;
    }

    if (!title.trim()) {
      Alert.alert(
        "Missing Title",
        "Please enter a complaint title."
      );
      return;
    }

    if (!description.trim()) {
      Alert.alert(
        "Missing Description",
        "Please describe the issue."
      );
      return;
    }

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert(
          "Session Expired",
          "Please log in again."
        );
        return;
      }

      console.log("Submitting complaint...");

      const response = await axios.post(
        `${API_URL}/api/complaints`,
        {
          categoryId: selectedCategoryId,
          title: title.trim(),
          description: description.trim(),
          priority,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log(
        "Complaint created successfully:",
        response.data
      );

      // Get complaint data from backend response
      const complaint =
        response.data?.data ||
        response.data?.complaint;

      // Get complaint number or ID
      const complaintNumber =
        complaint?.complaintNo ||
        complaint?.complaintNumber ||
        complaint?.id;

      // Clear form
      setSelectedCategoryId("");
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");

      // Show success message directly on screen
      setSuccessMessage(
        complaintNumber
          ? `Your complaint has been submitted successfully. Complaint ID: ${complaintNumber}`
          : "Your complaint has been submitted successfully."
      );
    } catch (error: any) {
      console.log(
        "Complaint error:",
        error.response?.data || error.message
      );

      Alert.alert(
        "Failed to Submit Complaint",
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* BACK BUTTON */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        disabled={loading}
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {/* PAGE TITLE */}
      <Text style={styles.title}>
        Raise a Complaint
      </Text>

      {/* SUCCESS MESSAGE */}
      {successMessage ? (
        <View style={styles.successBox}>
          <Text style={styles.successTitle}>
            ✓ Complaint Submitted Successfully!
          </Text>

          <Text style={styles.successText}>
            {successMessage}
          </Text>

          <TouchableOpacity
            style={styles.viewComplaintsButton}
            onPress={() =>
              router.replace("/my-complaints")
            }
          >
            <Text style={styles.viewComplaintsText}>
              View My Complaints
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeSuccessButton}
            onPress={() => setSuccessMessage("")}
          >
            <Text style={styles.closeSuccessText}>
              Raise Another Complaint
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* COMPLAINT CATEGORY */}
      <Text style={styles.label}>
        Complaint Category
      </Text>

      {loadingCategories ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="small"
            color="#2563EB"
          />

          <Text style={styles.loadingText}>
            Loading categories...
          </Text>
        </View>
      ) : categories.length === 0 ? (
        <Text style={styles.noCategories}>
          No complaint categories available.
        </Text>
      ) : (
        <View style={styles.categoryContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategoryId === category.id &&
                  styles.categoryButtonSelected,
              ]}
              onPress={() =>
                setSelectedCategoryId(category.id)
              }
              disabled={loading}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategoryId === category.id &&
                    styles.categoryTextSelected,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* COMPLAINT TITLE */}
      <Text style={styles.label}>
        Complaint Title
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Example: Water leakage"
        value={title}
        onChangeText={setTitle}
        editable={!loading}
      />

      {/* DESCRIPTION */}
      <Text style={styles.label}>
        Description
      </Text>

      <TextInput
        style={[
          styles.input,
          styles.descriptionInput,
        ]}
        placeholder="Describe the issue..."
        value={description}
        onChangeText={setDescription}
        multiline
        textAlignVertical="top"
        editable={!loading}
      />

      {/* PRIORITY */}
      <Text style={styles.label}>
        Priority
      </Text>

      <View style={styles.priorityContainer}>
        {["LOW", "MEDIUM", "HIGH", "URGENT"].map(
          (item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.priorityButton,
                priority === item &&
                  styles.priorityButtonSelected,
              ]}
              onPress={() => setPriority(item)}
              disabled={loading}
            >
              <Text
                style={[
                  styles.priorityText,
                  priority === item &&
                    styles.priorityTextSelected,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>

      {/* SUBMIT BUTTON */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          loading && styles.buttonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <View style={styles.submittingContainer}>
            <ActivityIndicator
              color="#FFFFFF"
              size="small"
            />

            <Text style={styles.submitButtonText}>
              {"  "}Submitting...
            </Text>
          </View>
        ) : (
          <Text style={styles.submitButtonText}>
            Submit Complaint
          </Text>
        )}
      </TouchableOpacity>

      {/* CANCEL BUTTON */}
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => router.back()}
        disabled={loading}
      >
        <Text style={styles.cancelText}>
          Cancel
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

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

  backButton: {
    marginBottom: 20,
  },

  backText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2563EB",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#0F172A",
  },

  /* SUCCESS BOX */

  successBox: {
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#86EFAC",
    borderRadius: 12,
    padding: 18,
    marginBottom: 25,
  },

  successTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#166534",
    marginBottom: 8,
  },

  successText: {
    fontSize: 15,
    color: "#166534",
    marginBottom: 15,
    lineHeight: 22,
  },

  viewComplaintsButton: {
    backgroundColor: "#16A34A",
    padding: 13,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },

  viewComplaintsText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },

  closeSuccessButton: {
    padding: 10,
    alignItems: "center",
  },

  closeSuccessText: {
    color: "#166534",
    fontSize: 14,
    fontWeight: "600",
  },

  /* FORM */

  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
    color: "#334155",
  },

  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  loadingText: {
    marginLeft: 10,
    color: "#64748B",
  },

  noCategories: {
    color: "#DC2626",
    marginBottom: 20,
  },

  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },

  categoryButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },

  categoryButtonSelected: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },

  categoryText: {
    color: "#334155",
    fontWeight: "600",
  },

  categoryTextSelected: {
    color: "#FFFFFF",
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  descriptionInput: {
    height: 140,
  },

  priorityContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 30,
  },

  priorityButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },

  priorityButtonSelected: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },

  priorityText: {
    color: "#334155",
    fontWeight: "600",
    fontSize: 13,
  },

  priorityTextSelected: {
    color: "#FFFFFF",
  },

  /* SUBMIT BUTTON */

  submitButton: {
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  submittingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  /* CANCEL */

  cancelButton: {
    marginTop: 15,
    padding: 15,
    alignItems: "center",
  },

  cancelText: {
    color: "#64748B",
    fontSize: 16,
  },
});