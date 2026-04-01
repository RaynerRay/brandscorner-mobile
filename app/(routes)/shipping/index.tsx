import axiosInstance from "@/utils/axiosInstance";
import { countries } from "@/utils/countries";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

interface Address {
  id: string;
  name: string;
  label: "Home" | "Work" | "Other";
  street: string;
  city: string;
  zip: string;
  country: string;
  isDefault: boolean;
  userId: string;
  createdAt: string;
}

type ModalType = "add" | "edit" | "delete" | null;

export default function ShippingAddressScreen() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState<ModalType>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    label: "Home" as "Home" | "Work" | "Other",
    street: "",
    city: "",
    zip: "",
    country: "",
    isDefault: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  // Filter countries based on search
  const filteredCountries = countries.filter((country) =>
    country.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const { data: addressesData, isLoading } = useQuery({
    queryKey: ["shipping-addresses"],
    queryFn: async () => {
      const response = await axiosInstance.get("/auth/api/shipping-addresses");
      return response.data.addresses;
    },
  });

  const addresses: Address[] = addressesData || [];

  const getAddressIcon = (label: "Home" | "Work" | "Other") => {
    switch (label.toLowerCase()) {
      case "home":
        return { name: "home-outline", color: "#2563EB" };
      case "work":
        return { name: "business-outline", color: "#059669" };
      case "other":
        return { name: "location-outline", color: "#6B7280" };
      default:
        return { name: "location-outline", color: "#6B7280" };
    }
  };

  const getAddressTypeColor = (label: "Home" | "Work" | "Other") => {
    switch (label.toLowerCase()) {
      case "home":
        return { bg: "#DBEAFE", text: "#2563EB" };
      case "work":
        return { bg: "#D1FAE5", text: "#059669" };
      case "other":
        return { bg: "#F3F4F6", text: "#6B7280" };
      default:
        return { bg: "#F3F4F6", text: "#6B7280" };
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await axiosInstance.put(`/auth/api/set-default-address/${id}`);
      queryClient.invalidateQueries({ queryKey: ["shipping-addresses"] });
      toast.success("Default address updated successfully!");
    } catch (error) {
      console.error("Error setting default address:", error);
      toast.error("Failed to update default address");
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await axiosInstance.delete(`/auth/api/delete-address/${id}`);
      // Refetch addresses after successful deletion
      queryClient.invalidateQueries({ queryKey: ["shipping-addresses"] });
      toast.success("Address deleted successfully!");
      setShowModal(null);
      setSelectedAddress(null);
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error("Failed to delete address");
    }
  };

  const openAddModal = () => {
    setFormData({
      name: "",
      label: "Home",
      street: "",
      city: "",
      zip: "",
      country: "",
      isDefault: false,
    });
    setShowModal("add");
  };

  const openEditModal = (address: Address) => {
    setSelectedAddress(address);
    setFormData({
      name: address.name,
      label: address.label,
      street: address.street,
      city: address.city,
      zip: address.zip,
      country: address.country,
      isDefault: address.isDefault,
    });
    setShowModal("edit");
  };

  const openDeleteModal = (address: Address) => {
    // Prevent deleting the last address
    if (addresses.length === 1) {
      toast.error(
        "Cannot delete the last address. Please add another address first."
      );
      return;
    }
    setSelectedAddress(address);
    setShowModal("delete");
  };

  const closeModal = () => {
    setShowModal(null);
    setSelectedAddress(null);
    setFormData({
      name: "",
      label: "Home",
      street: "",
      city: "",
      zip: "",
      country: "",
      isDefault: false,
    });
  };

  const handleSubmit = async () => {
    if (
      !formData.name ||
      !formData.street ||
      !formData.city ||
      !formData.zip ||
      !formData.country
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      if (showModal === "add") {
        await axiosInstance.post("/auth/api/add-address", formData);
        toast.success("Address added successfully!");
      } else if (showModal === "edit" && selectedAddress) {
        await axiosInstance.put(
          `/auth/api/update-address/${selectedAddress.id}`,
          formData
        );
        toast.success("Address updated successfully!");
      }

      queryClient.invalidateQueries({ queryKey: ["shipping-addresses"] });
      closeModal();
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error("Failed to save address");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderAddressCard = (address: Address) => {
    const iconConfig = getAddressIcon(address.label);
    const typeColor = getAddressTypeColor(address.label);

    return (
      <View
        key={address.id}
        className="bg-white rounded-2xl shadow-[0_0_1px_rgba(0,0,0,0.1)] border border-gray-100 mb-4 overflow-hidden"
      >
        {/* Address Header */}
        <View className="p-4 border-b border-gray-100">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <Ionicons
                name={iconConfig.name as any}
                size={20}
                color={iconConfig.color}
              />
              <Text className="text-lg font-poppins-semibold text-gray-900 ml-2">
                {address.name}
              </Text>
            </View>

            <View className="flex-row items-center">
              {address.isDefault && (
                <View className="bg-blue-100 px-3 py-1 rounded-full mr-2">
                  <Text className="text-blue-700 font-poppins-medium text-sm">
                    Default
                  </Text>
                </View>
              )}
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: typeColor.bg }}
              >
                <Text
                  className="font-poppins-medium text-sm capitalize"
                  style={{ color: typeColor.text }}
                >
                  {address.label}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Address Details */}
        <View className="p-4">
          <Text className="text-gray-700 font-poppins-medium mb-2">
            {address.street}
          </Text>
          <Text className="text-gray-700 font-poppins-medium mb-2">
            {address.city}, {address.zip}
          </Text>
          <Text className="text-gray-700 font-poppins-medium mb-3">
            {address.country}
          </Text>

          {/* Action Buttons */}
          <View className="flex-row gap-3">
            {!address.isDefault && (
              <TouchableOpacity
                className="flex-1 bg-blue-600 py-3 rounded-xl"
                onPress={() => handleSetDefault(address.id)}
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={16}
                    color="white"
                  />
                  <Text className="text-white font-poppins-semibold ml-2">
                    Set as Default
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              className="flex-1 bg-gray-100 py-3 rounded-xl"
              onPress={() => openEditModal(address)}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="create-outline" size={16} color="#6B7280" />
                <Text className="text-gray-700 font-poppins-semibold ml-2">
                  Edit
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-red-50 px-4 py-3 rounded-xl"
              onPress={() => openDeleteModal(address)}
            >
              <View className="flex-row items-center">
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderModal = () => {
    if (!showModal) return null;

    return (
      <Modal
        visible={true}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView className="flex-1 bg-white">
          {/* Modal Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
            <Text className="text-xl font-poppins-bold text-gray-900">
              {showModal === "add" && "Add New Address"}
              {showModal === "edit" && "Edit Address"}
              {showModal === "delete" && "Delete Address"}
            </Text>
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="flex-1 p-4"
            showsVerticalScrollIndicator={false}
          >
            {showModal === "delete" ? (
              // Delete Confirmation
              <View className="flex-1 justify-center items-center py-20">
                <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-6">
                  <Ionicons name="trash-outline" size={32} color="#EF4444" />
                </View>
                <Text className="text-xl font-poppins-bold text-gray-900 text-center mb-2">
                  Delete Address
                </Text>
                <Text className="text-gray-600 font-poppins-medium text-center mb-6">
                  Are you sure you want to delete this address? This action
                  cannot be undone.
                </Text>

                <View className="w-full gap-3">
                  <TouchableOpacity
                    className="bg-red-600 py-4 rounded-xl"
                    onPress={() =>
                      selectedAddress && handleDeleteAddress(selectedAddress.id)
                    }
                  >
                    <Text className="text-white font-poppins-semibold text-center">
                      Delete Address
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="bg-gray-100 py-4 rounded-xl"
                    onPress={closeModal}
                  >
                    <Text className="text-gray-700 font-poppins-semibold text-center">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // Add/Edit Form
              <View className="gap-4">
                {/* Address Label */}
                <View>
                  <Text className="text-gray-700 font-poppins-medium mb-2">
                    Address Label
                  </Text>
                  <View className="flex-row gap-2">
                    {(["Home", "Work", "Other"] as const).map((label) => (
                      <TouchableOpacity
                        key={label}
                        className={`flex-1 py-3 px-4 rounded-xl border ${
                          formData.label === label
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 bg-white"
                        }`}
                        onPress={() =>
                          setFormData((prev) => ({ ...prev, label }))
                        }
                      >
                        <Text
                          className={`font-poppins-medium text-center ${
                            formData.label === label
                              ? "text-blue-600"
                              : "text-gray-700"
                          }`}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Address Name */}
                <View>
                  <Text className="text-gray-700 font-poppins-medium mb-2">
                    Address Name *
                  </Text>
                  <TextInput
                    className="border border-gray-200 rounded-xl px-4 py-3 font-poppins-medium"
                    placeholder="e.g., Home, Office, Vacation House"
                    value={formData.name}
                    onChangeText={(text) =>
                      setFormData((prev) => ({ ...prev, name: text }))
                    }
                  />
                </View>

                {/* Street Address */}
                <View>
                  <Text className="text-gray-700 font-poppins-medium mb-2">
                    Street Address *
                  </Text>
                  <TextInput
                    className="border border-gray-200 rounded-xl px-4 py-3 font-poppins-medium"
                    placeholder="Enter your street address"
                    value={formData.street}
                    onChangeText={(text) =>
                      setFormData((prev) => ({ ...prev, street: text }))
                    }
                  />
                </View>

                {/* City and ZIP */}
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-gray-700 font-poppins-medium mb-2">
                      City *
                    </Text>
                    <TextInput
                      className="border border-gray-200 rounded-xl px-4 py-3 font-poppins-medium"
                      placeholder="Enter city"
                      value={formData.city}
                      onChangeText={(text) =>
                        setFormData((prev) => ({ ...prev, city: text }))
                      }
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-700 font-poppins-medium mb-2">
                      ZIP Code *
                    </Text>
                    <TextInput
                      className="border border-gray-200 rounded-xl px-4 py-3 font-poppins-medium"
                      placeholder="Enter ZIP code"
                      value={formData.zip}
                      onChangeText={(text) =>
                        setFormData((prev) => ({ ...prev, zip: text }))
                      }
                    />
                  </View>
                </View>

                {/* Country */}
                <View>
                  <Text className="text-gray-700 font-poppins-medium mb-2">
                    Country *
                  </Text>
                  <TouchableOpacity
                    className="border border-gray-200 rounded-xl px-4 py-3 flex-row items-center justify-between"
                    onPress={() => setShowCountryPicker(true)}
                  >
                    <Text
                      className={`font-poppins-medium ${
                        formData.country ? "text-gray-900" : "text-gray-400"
                      }`}
                    >
                      {formData.country || "Select country"}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                {/* Country Picker Modal */}
                <Modal
                  visible={showCountryPicker}
                  animationType="slide"
                  presentationStyle="pageSheet"
                  onRequestClose={() => setShowCountryPicker(false)}
                >
                  <SafeAreaView className="flex-1 bg-white">
                    {/* Country Picker Header */}
                    <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
                      <Text className="text-xl font-poppins-bold text-gray-900">
                        Select Country
                      </Text>
                      <TouchableOpacity
                        onPress={() => setShowCountryPicker(false)}
                      >
                        <Ionicons name="close" size={24} color="#6B7280" />
                      </TouchableOpacity>
                    </View>

                    {/* Search Input */}
                    <View className="p-4 border-b border-gray-100">
                      <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
                        <Ionicons name="search" size={20} color="#6B7280" />
                        <TextInput
                          className="flex-1 ml-3 font-poppins-medium"
                          placeholder="Search countries..."
                          value={countrySearch}
                          onChangeText={setCountrySearch}
                        />
                      </View>
                    </View>

                    {/* Countries List */}
                    <ScrollView
                      className="flex-1 pb-12"
                      showsVerticalScrollIndicator={false}
                    >
                      {filteredCountries.map((country) => (
                        <TouchableOpacity
                          key={country}
                          className={`p-4 border-b border-gray-100 ${
                            formData.country === country
                              ? "bg-blue-50"
                              : "bg-white"
                          }`}
                          onPress={() => {
                            setFormData((prev) => ({ ...prev, country }));
                            setShowCountryPicker(false);
                            setCountrySearch("");
                          }}
                        >
                          <View className="flex-row items-center justify-between">
                            <Text
                              className={`font-poppins-medium ${
                                formData.country === country
                                  ? "text-blue-600"
                                  : "text-gray-900"
                              }`}
                            >
                              {country}
                            </Text>
                            {formData.country === country && (
                              <Ionicons
                                name="checkmark"
                                size={20}
                                color="#2563EB"
                              />
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </SafeAreaView>
                </Modal>

                {/* Set as Default */}
                <View className="flex-row items-center justify-between py-3">
                  <View>
                    <Text className="text-gray-700 font-poppins-medium">
                      Set as Default Address
                    </Text>
                    <Text className="text-gray-500 font-poppins-medium text-sm">
                      Use this address for future orders
                    </Text>
                  </View>
                  <TouchableOpacity
                    className={`w-12 h-6 rounded-full ${
                      formData.isDefault ? "bg-blue-600" : "bg-gray-200"
                    }`}
                    onPress={() => {
                      // If trying to uncheck default and this is the only default address, show error
                      if (
                        formData.isDefault &&
                        showModal === "edit" &&
                        selectedAddress
                      ) {
                        const defaultAddresses = addresses.filter(
                          (addr) => addr.isDefault
                        );
                        if (
                          defaultAddresses.length === 1 &&
                          defaultAddresses[0].id === selectedAddress.id
                        ) {
                          toast.error(
                            "Cannot remove default status from the only default address. Please set another address as default first."
                          );
                          return;
                        }
                      }
                      setFormData((prev) => ({
                        ...prev,
                        isDefault: !prev.isDefault,
                      }));
                    }}
                  >
                    <View
                      className={`w-[22px] h-[22px] bg-white rounded-full shadow-sm transform transition-transform ${
                        formData.isDefault ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </TouchableOpacity>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  className={`py-4 rounded-xl ${
                    isSubmitting ? "bg-gray-400" : "bg-blue-600"
                  }`}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  <Text className="text-white font-poppins-semibold text-center">
                    {isSubmitting
                      ? "Saving..."
                      : showModal === "add"
                      ? "Add Address"
                      : "Update Address"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 pt-12 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-xl font-poppins-bold text-gray-900">
              Shipping Address
            </Text>
          </View>

          <TouchableOpacity
            className="bg-blue-600 px-4 py-2 rounded-lg"
            onPress={openAddModal}
          >
            <View className="flex-row items-center">
              <Ionicons name="add" size={20} color="white" />
              <Text className="text-white font-poppins-semibold ml-1">
                Add New
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View className="flex-1 justify-center items-center py-20">
            <View className="animate-spin">
              <Ionicons name="refresh" size={48} color="#6B7280" />
            </View>
            <Text className="text-gray-500 font-poppins-medium mt-4 text-center text-lg">
              Loading addresses...
            </Text>
          </View>
        ) : addresses.length === 0 ? (
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="location-outline" size={64} color="#9CA3AF" />
            <Text className="text-gray-500 font-poppins-medium mt-4 text-center text-lg">
              No addresses found
            </Text>
            <Text className="text-gray-400 font-poppins-medium text-center mt-2">
              Add your first shipping address to get started
            </Text>
            <TouchableOpacity
              className="bg-blue-600 px-6 py-3 rounded-xl mt-6"
              onPress={openAddModal}
            >
              <Text className="text-white font-poppins-semibold">
                Add Address
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Address Cards */}
            {addresses.map(renderAddressCard)}

            {/* Add New Address Card */}
            <TouchableOpacity
              className="bg-white rounded-2xl shadow-[0_0_1px_rgba(0,0,0,0.1)] border-2 border-dashed border-gray-300 p-6 items-center"
              onPress={openAddModal}
              activeOpacity={0.7}
            >
              <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mb-3">
                <Ionicons name="add" size={24} color="#2563EB" />
              </View>
              <Text className="text-gray-900 font-poppins-semibold text-lg">
                Add New Address
              </Text>
              <Text className="text-gray-500 font-poppins-medium text-center mt-1">
                Add a new shipping address for faster checkout
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Bottom Spacing */}
        <View className="h-20" />
      </ScrollView>

      {/* Modal */}
      {renderModal()}
    </SafeAreaView>
  );
}
