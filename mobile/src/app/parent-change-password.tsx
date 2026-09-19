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

export default function ParentChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleChangePassword = async () => {
    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      Alert.alert(
        "Error",
        "Please fill in all password fields."
      );
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert(
        "Invalid Password",
        "New password must contain at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        "Password Mismatch",
        "New password and confirm password do not match."
      );
      return;
    }

    try {
      setLoading(true);

      const token =
        await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert(
          "Session Expired",
          "Please login again."
        );

        router.replace("/login");
        return;
      }

      const response = await axios.put(
        `${API_URL}/api/auth/change-password`,
        {
          currentPassword,
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data?.success) {
        const storedUser =
          await AsyncStorage.getItem("user");

        if (storedUser) {
          const user = JSON.parse(storedUser);

          user.mustChangePassword = false;

          await AsyncStorage.setItem(
            "user",
            JSON.stringify(user)
          );
        }

        Alert.alert(
          "Password Changed",
          "Your password has been changed successfully.",
          [
            {
              text: "Continue",
              onPress: () => {
                router.replace("/parent");
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "Password Change Failed",
          response.data?.message ||
            "Unable to change password."
        );
      }
    } catch (error: any) {
      console.log(
        "Change password error:",
        error?.response?.data || error
      );

      Alert.alert(
        "Password Change Failed",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to change password."
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
        <Text style={styles.icon}>🔐</Text>

        <Text style={styles.title}>
          Change Your Password
        </Text>

        <Text style={styles.subtitle}>
          For security, you must change your temporary
          password before accessing the Parent Dashboard.
        </Text>

        <Text style={styles.label}>
          Temporary Password
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter temporary password"
          placeholderTextColor="#94A3B8"
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
          autoCapitalize="none"
        />

        <Text style={styles.label}>
          New Password
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter new password"
          placeholderTextColor="#94A3B8"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
          autoCapitalize="none"
        />

        <Text style={styles.label}>
          Confirm New Password
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Confirm new password"
          placeholderTextColor="#94A3B8"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[
            styles.button,
            loading && styles.disabledButton,
          ]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>
              Change Password
            </Text>
          )}
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

  icon: {
    fontSize: 45,
    textAlign: "center",
    marginBottom: 10,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    color: "#0F172A",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#64748B",
    lineHeight: 21,
    marginBottom: 20,
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

  button: {
    height: 52,
    backgroundColor: "#2563EB",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 25,
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});