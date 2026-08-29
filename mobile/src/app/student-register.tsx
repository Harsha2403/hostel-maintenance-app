import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

import { router } from "expo-router";
import axios from "axios";

const API_URL = "http://192.168.31.239:5000";

export default function StudentRegister() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [course, setCourse] = useState("");
  const [year, setYear] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  // ==========================================================
  // HANDLE REGISTRATION
  // ==========================================================

  const handleRegister = async () => {
    // ----------------------------------------------------------
    // Required fields
    // ----------------------------------------------------------

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !studentNumber.trim() ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert(
        "Registration Error",
        "Please fill in all required fields."
      );
      return;
    }

    // ----------------------------------------------------------
    // Email validation
    // ----------------------------------------------------------

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      Alert.alert(
        "Registration Error",
        "Please enter a valid email address."
      );
      return;
    }

    // ----------------------------------------------------------
    // Password match
    // ----------------------------------------------------------

    if (password !== confirmPassword) {
      Alert.alert(
        "Registration Error",
        "Passwords do not match."
      );
      return;
    }

    // ----------------------------------------------------------
    // Password length
    // ----------------------------------------------------------

    if (password.length < 8) {
      Alert.alert(
        "Registration Error",
        "Password must be at least 8 characters."
      );
      return;
    }

    // ----------------------------------------------------------
    // Year
    // ----------------------------------------------------------

    let yearValue: number | null = null;

    if (year.trim()) {
      yearValue = Number(year.trim());

      if (
        !Number.isInteger(yearValue) ||
        yearValue < 1 ||
        yearValue > 10
      ) {
        Alert.alert(
          "Registration Error",
          "Please enter a valid year between 1 and 10."
        );
        return;
      }
    }

    // ----------------------------------------------------------
    // Phone
    // ----------------------------------------------------------

    if (phone.trim()) {
      const phoneRegex = /^[0-9]{10}$/;

      if (!phoneRegex.test(phone.trim())) {
        Alert.alert(
          "Registration Error",
          "Please enter a valid 10-digit phone number."
        );
        return;
      }
    }

    try {
      setLoading(true);

      // ========================================================
      // API REQUEST
      // ========================================================

      const response = await axios.post(
        `${API_URL}/api/auth/student-register`,
        {
          email: email.trim(),
          password: password,

          firstName: firstName.trim(),
          lastName: lastName.trim(),

          phone: phone.trim() || null,

          studentNumber:
            studentNumber.trim().toUpperCase(),

          department:
            department.trim() || null,

          course:
            course.trim() || null,

          year: yearValue,
        }
      );

      console.log(
        "Student registration response:",
        response.data
      );

      // ========================================================
      // SUCCESS
      // ========================================================

      if (response.data?.success === true) {
  const successMessage =
    "Your student account has been registered successfully.\n\n" +
    "Your account is now waiting for Admin approval.\n\n" +
    "You can login after the Admin approves your registration.";

  // ========================================================
  // WEB
  // ========================================================

  if (Platform.OS === "web") {
    window.alert(
      "Registered Successfully\n\n" +
        successMessage
    );

    router.replace("/login");
    return;
  }

  // ========================================================
  // ANDROID / IOS
  // ========================================================

  Alert.alert(
    "Registered Successfully",
    successMessage,
    [
      {
        text: "OK",
        onPress: () => {
          router.replace("/login");
        },
      },
    ],
    {
      cancelable: false,
    }
  );

  return;
}

      // ========================================================
      // API RETURNED FAILURE
      // ========================================================

      Alert.alert(
        "Registration Failed",
        response.data?.message ||
          "Registration could not be completed."
      );

    } catch (error: any) {
      console.log(
        "Student registration error:",
        error?.response?.data || error
      );

      // ========================================================
      // SERVER ERROR
      // ========================================================

      Alert.alert(
        "Registration Failed",
        error?.response?.data?.message ||
          "Unable to connect to the server. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : "height"
      }
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>

          {/* ==================================================
              HEADER
          ================================================== */}

          <Text style={styles.title}>
            Student Registration
          </Text>

          <Text style={styles.subtitle}>
            Create your hostel maintenance account
          </Text>

          <Text style={styles.requiredText}>
            * Required fields
          </Text>


          {/* ==================================================
              FIRST NAME
          ================================================== */}

          <Text style={styles.label}>
            First Name *
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter first name"
            placeholderTextColor="#94A3B8"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            editable={!loading}
          />


          {/* ==================================================
              LAST NAME
          ================================================== */}

          <Text style={styles.label}>
            Last Name *
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter last name"
            placeholderTextColor="#94A3B8"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            editable={!loading}
          />


          {/* ==================================================
              EMAIL
          ================================================== */}

          <Text style={styles.label}>
            Email Address *
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter email address"
            placeholderTextColor="#94A3B8"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!loading}
          />


          {/* ==================================================
              PHONE
          ================================================== */}

          <Text style={styles.label}>
            Phone Number
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter 10-digit phone number"
            placeholderTextColor="#94A3B8"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={10}
            editable={!loading}
          />


          {/* ==================================================
              STUDENT NUMBER
          ================================================== */}

          <Text style={styles.label}>
            Student Number *
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Example: STU0004"
            placeholderTextColor="#94A3B8"
            value={studentNumber}
            onChangeText={setStudentNumber}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!loading}
          />


          {/* ==================================================
              DEPARTMENT
          ================================================== */}

          <Text style={styles.label}>
            Department
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Example: Computer Science"
            placeholderTextColor="#94A3B8"
            value={department}
            onChangeText={setDepartment}
            autoCapitalize="words"
            editable={!loading}
          />


          {/* ==================================================
              COURSE
          ================================================== */}

          <Text style={styles.label}>
            Course
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Example: B.Tech"
            placeholderTextColor="#94A3B8"
            value={course}
            onChangeText={setCourse}
            editable={!loading}
          />


          {/* ==================================================
              YEAR
          ================================================== */}

          <Text style={styles.label}>
            Year
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Example: 3"
            placeholderTextColor="#94A3B8"
            value={year}
            onChangeText={setYear}
            keyboardType="number-pad"
            maxLength={2}
            editable={!loading}
          />


          {/* ==================================================
              PASSWORD
          ================================================== */}

          <Text style={styles.label}>
            Password *
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor="#94A3B8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <Text style={styles.helperText}>
            Password must contain at least 8 characters.
          </Text>


          {/* ==================================================
              CONFIRM PASSWORD
          ================================================== */}

          <Text style={styles.label}>
            Confirm Password *
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Re-enter password"
            placeholderTextColor="#94A3B8"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />


          {/* ==================================================
              REGISTER BUTTON
          ================================================== */}

          <TouchableOpacity
            style={[
              styles.registerButton,
              loading && styles.disabledButton,
            ]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <>
                <ActivityIndicator
                  color="#FFFFFF"
                  size="small"
                />

                <Text style={styles.loadingText}>
                  Registering...
                </Text>
              </>
            ) : (
              <Text style={styles.registerButtonText}>
                Register
              </Text>
            )}
          </TouchableOpacity>


          {/* ==================================================
              BACK TO LOGIN
          ================================================== */}

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/login")}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>
              ← Back to Login
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


// ==========================================================
// STYLES
// ==========================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },

  scrollContent: {
    padding: 20,
    paddingTop: 45,
    paddingBottom: 50,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 25,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#0F172A",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    textAlign: "center",
    color: "#64748B",
    marginBottom: 8,
    lineHeight: 21,
  },

  requiredText: {
    fontSize: 12,
    textAlign: "center",
    color: "#94A3B8",
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 7,
    marginTop: 12,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#1E293B",
    backgroundColor: "#FFFFFF",
  },

  helperText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 5,
  },

  registerButton: {
    height: 52,
    backgroundColor: "#2563EB",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    marginTop: 28,
  },

  disabledButton: {
    opacity: 0.6,
  },

  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },

  backButton: {
    alignItems: "center",
    marginTop: 18,
    paddingVertical: 8,
  },

  backButtonText: {
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "600",
  },
});