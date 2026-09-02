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
} from "react-native";

import { router } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config/api";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(
        "Error",
        "Please enter email and password."
      );
      return;
    }

    try {
      setLoading(true);

      // Clear any previous session
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");

      // ==========================================
      // LOGIN API
      // ==========================================

      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        {
          email: email.trim(),
          password,
        }
      );

      const { token, user } = response.data;

      // ==========================================
      // SAVE SESSION
      // ==========================================

      await AsyncStorage.setItem(
        "token",
        token
      );

      await AsyncStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      // ==========================================
      // ROLE-BASED NAVIGATION
      // ==========================================

      if (user.role === "ADMIN") {
        router.replace("/admin");

      } else if (user.role === "STUDENT") {
        router.replace("/student");

      } else if (
        user.role === "MAINTENANCE_STAFF"
      ) {
        // Maintenance staff goes to
        // their own dashboard first.
        router.replace("/maintenance-home");

      } else {
        Alert.alert(
          "Error",
          "Unknown user role."
        );
      }

    } catch (error: any) {
      console.log(
        "Login error:",
        error?.response?.data || error
      );

      Alert.alert(
        "Login Failed",
        error?.response?.data?.message ||
          "Unable to connect to the server."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : "height"
      }
    >
      <View style={styles.card}>

        {/* ==========================================
            TITLE
        ========================================== */}

        <Text style={styles.title}>
          Hostel Maintenance
        </Text>

        <Text style={styles.subtitle}>
          Sign in to manage hostel maintenance
        </Text>


        {/* ==========================================
            EMAIL
        ========================================== */}

        <Text style={styles.label}>
          Email Address
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#94A3B8"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />


        {/* ==========================================
            PASSWORD
        ========================================== */}

        <Text style={styles.label}>
          Password
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor="#94A3B8"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />


        {/* ==========================================
            LOGIN BUTTON
        ========================================== */}

        <TouchableOpacity
          style={[
            styles.loginButton,
            loading && styles.disabledButton,
          ]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator
              color="#FFFFFF"
            />
          ) : (
            <Text
              style={styles.loginButtonText}
            >
              Login
            </Text>
          )}
        </TouchableOpacity>


        {/* ==========================================
            STUDENT REGISTRATION
        ========================================== */}

        <View style={styles.registerSection}>

          <Text style={styles.registerQuestion}>
            Don't have an account?
          </Text>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={() =>
              router.push("/student-register")
            }
            activeOpacity={0.8}
            disabled={loading}
          >
            <Text
              style={styles.registerButtonText}
            >
              Register as Student
            </Text>
          </TouchableOpacity>

        </View>

      </View>
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
    justifyContent: "center",
    padding: 20,
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
    marginBottom: 30,
    lineHeight: 21,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
    marginTop: 10,
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

  loginButton: {
    height: 52,
    backgroundColor: "#2563EB",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
  },

  disabledButton: {
    opacity: 0.6,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  registerSection: {
    alignItems: "center",
    marginTop: 22,
  },

  registerQuestion: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 10,
  },

  registerButton: {
    height: 48,
    width: "100%",
    borderWidth: 1,
    borderColor: "#2563EB",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  registerButtonText: {
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "bold",
  },

});