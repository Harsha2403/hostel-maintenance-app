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

export default function MaintenanceLogin() {
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

      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");

      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        {
          email: email.trim(),
          password,
        }
      );

      const { token, user } = response.data;

      if (user.role !== "MAINTENANCE_STAFF") {
        Alert.alert(
          "Access Denied",
          "This login page is only for maintenance staff."
        );
        return;
      }

      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      router.replace("/maintenance-home");
    } catch (error: any) {
      console.log(
        "Maintenance login error:",
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
        <Text style={styles.title}>
          Maintenance Staff
        </Text>

        <Text style={styles.subtitle}>
          Sign in to access your maintenance dashboard
        </Text>

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

        <TouchableOpacity
          style={[
            styles.loginButton,
            loading && styles.disabledButton,
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>
              Login as Maintenance Staff
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/login")}
        >
          <Text style={styles.backButtonText}>
            Back to Main Login
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

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

  loginButton: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 22,
  },

  disabledButton: {
    opacity: 0.6,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  backButton: {
    alignItems: "center",
    marginTop: 18,
  },

  backButtonText: {
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "600",
  },
});
