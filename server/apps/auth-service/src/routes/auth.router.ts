import { isAdmin, isSeller } from "@packages/middleware/authorizeRoles";
import isAuthenticated from "@packages/middleware/isAuthenticated";
import express, { Router } from "express";
import {
  addingUserActivities,
  addUserAddress,
  createShop,
  createStripeConnectLink,
  deleteUserAddress,
  getAdmin,
  getLayoutData,
  getSeller,
  getUser,
  getUserAddresses,
  loginAdmin,
  loginSeller,
  loginUser,
  logOutAdmin,
  logOutSeller,
  logOutUser,
  refreshToken,
  registerSeller,
  resetUserPassword,
  setDefaultAddress,
  updateUserAddress,
  updateUserAvatar,
  updateUserPassword,
  userForgotPassword,
  userRegistration,
  verifySeller,
  verifyUser,
  verifyUserForgotPassword,
} from "../controller/auth.controller";

const router: Router = express.Router();

router.post("/user-registration", userRegistration);
router.post("/verify-user", verifyUser);
router.post("/login-user", loginUser);
router.get("/logout-user", isAuthenticated, logOutUser);
router.post("/refresh-token", refreshToken);
router.get("/logged-in-user", isAuthenticated, getUser);
router.post("/forgot-password-user", userForgotPassword);
router.post("/reset-password-user", resetUserPassword);
router.post("/verify-forgot-password-user", verifyUserForgotPassword);
router.post("/seller-registration", registerSeller);
router.post("/verify-seller", verifySeller);
router.post("/create-shop", createShop);
router.post("/create-stripe-link", createStripeConnectLink);
router.post("/login-seller", loginSeller);
router.get("/logout-seller", isAuthenticated, isSeller, logOutSeller);
router.post("/login-admin", loginAdmin);
router.get("/logout-admin", isAuthenticated, logOutAdmin);
router.get("/logged-in-seller", isAuthenticated, isSeller, getSeller);
router.get("/logged-in-admin", isAuthenticated, isAdmin, getAdmin);
router.post("/change-password", isAuthenticated, updateUserPassword);
router.get("/shipping-addresses", isAuthenticated, getUserAddresses);
router.post("/add-address", isAuthenticated, addUserAddress);
router.put("/update-address/:addressId", isAuthenticated, updateUserAddress);
router.put(
  "/set-default-address/:addressId",
  isAuthenticated,
  setDefaultAddress
);
router.delete("/delete-address/:addressId", isAuthenticated, deleteUserAddress);
router.get("/get-layouts", getLayoutData);
router.post("/update-avatar", isAuthenticated, updateUserAvatar);
router.put("/track-event", isAuthenticated, addingUserActivities);

export default router;
