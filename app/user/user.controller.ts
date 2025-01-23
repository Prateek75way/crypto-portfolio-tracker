
import * as userService from "./user.service";
import { createResponse } from "../common/helper/response.hepler";
import asyncHandler from "express-async-handler";
import { type Request, type Response } from 'express'
import bcrypt from "bcrypt";
import userSchema from "./user.schema";
// Assuming a utility for formatting responses



/**
 * Handles POST /users request
 * Creates a new user based on the request body and returns it in response
 * @param req Request object
 * @param res Response object
 * @returns Response with either user or error message
 */
export const createUser = asyncHandler(async (req: Request, res: Response) => {
    
        const result = await userService.createUser(req.body);
        res.status(201).send(createResponse(result, "User created successfully"));
     
        
});

  
/**
 * @route GET /users
 * @description Fetch all users from the database
 * @access Private (Requires admin role)
 * @returns {Object} 200 - Success response with a list of users
 * @returns {Object} 404 - Error response when no users are found
 * @returns {Object} 500 - Internal server error response
 */
export const getAllUsers = async (req: Request, res: Response) => {
    try {
      const result = await userService.getAllUsers();
  
      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(404).json(result);
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: "An error occurred while fetching users",
        error: error.message,
      });
    }
};


/**
 * @route POST /login
 * @description Login a user and return an access token in an HTTP-only cookie
 * @body {Object} email - The user's email address
 * @body {Object} password - The user's password
 * @access Public
 * @returns {Object} 200 - Success response with a login message and user data
 * @returns {Object} 400 - Error response for invalid credentials or missing fields
 * @returns {Object} 500 - Internal server error response
 */
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    
        const result = await userService.loginUser(email, password);

        // Set the access token as an HTTP-only cookie
        res.cookie("AccessToken", result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Only for HTTPS in production
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        res.status(200).send(createResponse(result, "Login successful"));
    
});

/**
 * @route POST /refresh
 * @description Refresh the access token using a refresh token
 * @body {Object} refreshToken - The user's current refresh token
 * @access Public
 * @returns {Object} 200 - Success response with new access and refresh tokens
 * @returns {Object} 400 - Error response if refresh token is invalid
 * @returns {Object} 500 - Internal server error response
 */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    try {
        const { accessToken, refreshToken: newRefreshToken } = await userService.refreshTokens(refreshToken);

        // Set the new access token as an HTTP-only cookie
        res.cookie("AccessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Use HTTPS in production
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        res.status(200).send(
            createResponse(
                { accessToken, refreshToken: newRefreshToken },
                "Tokens refreshed successfully"
            )
        );
    } catch (error: any) {
        throw new Error(error.message);
    }
});

/**
 * @route POST /alerts
 * @description Add or update an alert for a specific symbol and threshold
 * @body {Object} symbol - The symbol for which to set the alert (e.g., "bitcoin")
 * @body {Object} threshold - The price threshold at which the alert should trigger
 * @access Private
 * @returns {Object} 200 - Success response with alert details
 * @returns {Object} 400 - Error response if symbol or threshold are invalid
 * @returns {Object} 500 - Internal server error response
 */
export const addOrUpdateAlert = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id; // Assume user is authenticated
    if (!userId) throw new Error("User not authenticated");

    const { symbol, threshold } = req.body;
    if (!symbol || typeof threshold !== "number") {
        throw new Error("Symbol and threshold are required");
    }

    const alerts = await userService.addOrUpdateAlert(userId, symbol, threshold);
    res.status(200).send(createResponse(alerts, "Alert added/updated successfully"));
});

/**
 * @route GET /portfolio
 * @description Fetch the user's portfolio
 * @access Private
 * @returns {Object} 200 - Success response with portfolio data
 * @returns {Object} 401 - Error response if user is not authenticated
 * @returns {Object} 500 - Internal server error response
 */
export const getPortfolio = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            throw new Error("User not authenticated");
        }

        const portfolio = await userService.getUserPortfolio(userId);
        return res.status(200).send(createResponse(portfolio, "Fetched portfolio successfully"));
    } catch (error: any) {
        console.error("Error fetching portfolio:", error.message);
        throw new Error("Failed to fetch portfolio");
    }
};

/**
 * @route POST /logout
 * @description Log the user out by clearing the access token cookie and updating the refresh token in the database
 * @access Private
 * @returns {Object} 200 - Success response indicating successful logout
 * @returns {Object} 500 - Internal server error response
 */
export const logoutController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;  // Assuming user is attached to the request after authentication

    if (!userId) {
        throw new Error("User not authenticated");
    }

    try {
        // Clear the accessToken cookie
        res.clearCookie("AccessToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Set secure for production environments
            sameSite: "strict",
        });

        // Call service to update the refresh token in the database
        await userService.clearRefreshToken(userId);

        // Send a success response
        res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});


/**
 * Handle forgot password request and send reset token.
 */
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required." });
        }

        await userService.sendResetToken(email);
        return res.status(200).json({
            message: "Password reset link has been sent to your email.",
        });
    } catch (error: any) {
        console.error("Forgot Password Error:", error);
        return res.status(500).json({
            message: error.message || "Something went wrong. Please try again later.",
        });
    }
};

/**
 * Handle reset password request.
 */
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: "Token and new password are required." });
        }

        await userService.resetPassword(token, newPassword);
        return res.status(200).json({
            message: "Password has been reset successfully.",
        });
    } catch (error: any) {
        console.error("Reset Password Error:", error);
        return res.status(500).json({
            message: error.message || "Something went wrong. Please try again later.",
        });
    }
};


// export const updateUser = asyncHandler(async (req: Request, res: Response) => {
//     const result = await userService.updateUser(req.params.id, req.body);
//     res.send(createResponse(result, "User updated sucssefully"))
// });

// export const editUser = asyncHandler(async (req: Request, res: Response) => {
//     const result = await userService.editUser(req.params.id, req.body);
//     res.send(createResponse(result, "User updated sucssefully"))
// });

// export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
//     const result = await userService.deleteUser(req.params.id);
//     res.send(createResponse(result, "User deleted sucssefully"))
// });


// export const getUserById = asyncHandler(async (req: Request, res: Response) => {
//     const result = await userService.getUserById(req.params.id);
//     res.send(createResponse(result))
// });


// export const getAllUser = asyncHandler(async (req: Request, res: Response) => {
//     const result = await userService.getAllUser();
//     res.send(createResponse(result))
// });
