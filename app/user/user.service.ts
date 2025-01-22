
import { type IUser } from "./user.dto";
import userSchema from "./user.schema";
import UserSchema from "./user.schema";
import jwt from "jsonwebtoken";
import axios from "axios";
import bcrypt from "bcrypt";
import { sendEmail } from "../common/helper/send-mail.helper";
import { getRepository, IsNull, MoreThan, Not } from "typeorm";
import { User } from "./user.entity";
export const createUser  = async (data: IUser) => {
    const userRepository = getRepository(User);
    
    try {
        const user = userRepository.create({ ...data, active: true });
        const result = await userRepository.save(user);
        return result;
    } catch (error: any) {
        if (error.code === "23505") { // PostgreSQL unique violation error code
            throw new Error("Email already exists");
        }
        throw new Error(error.message || "An error occurred while creating the user");
    }
};

/**
 * @description Fetch all users from the database
 * @returns {Object} - Returns success and data if users are found, or an error message if no users are found
 */
export const getAllUsers = async () => {
    try {
        // Fetch all users from the database
        const userRepository = getRepository(User);
        const users = await userRepository.find();

        // If no users found, return a message
        if (users.length === 0) {
            return { success: false, message: "No users found" };
        }

        return { success: true, data: users };
    } catch (error: any) {
        throw new Error("Failed to retrieve users: " + error.message);
    }
};

/**
 * @description Logs in a user by verifying email and password, and returns access and refresh tokens
 * @param {string} email - The email of the user
 * @param {string} password - The password of the user
 * @returns {Object} - Returns access token and refresh token
 * @throws {Error} - Throws error if the email/password is invalid or user is not found
 */
export const loginUser  = async (email: string, password: string) => {
    if (!email || !password) {
        throw new Error("Email and password are required");
    }

    // Find the user by email
    const userRepository = getRepository(User);
    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
        throw new Error("User  not found");
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password || "");
    if (!isPasswordValid) {
        throw new Error("Invalid password");
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id as string, user.role as string);
    const refreshToken = generateRefreshToken(user.id as string, user.role as string);

    // Save the refresh token to the database
    user.refreshToken = refreshToken;
    user.active = true;
    await userRepository.save(user);

    return { accessToken, refreshToken };
};

/**
 * @description Generates an access token with user ID and role
 * @param {string} id - The ID of the user
 * @param {string} role - The role of the user
 * @returns {string} - Returns the generated access token
 */
export const generateAccessToken = (id: string, role: string): string => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET as string, { expiresIn: "15m" });
}

/**
 * @description Generates a refresh token with user ID and role
 * @param {string} id - The ID of the user
 * @param {string} role - The role of the user
 * @returns {string} - Returns the generated refresh token
 */
export const generateRefreshToken = (id: string, role: string): string => {
    return jwt.sign({ id, role }, process.env.JWT_REFRESH_SECRET as string, { expiresIn: "7d" });
};

/**
 * @description Refreshes the access and refresh tokens using a valid refresh token
 * @param {string} refreshToken - The refresh token to verify and use for generating new tokens
 * @returns {Object} - Returns new access and refresh tokens
 * @throws {Error} - Throws error if the refresh token is invalid or expired
 */
export const refreshTokens = async (refreshToken: string) => {
    if (!refreshToken) {
        throw new Error("Refresh token is required");
    }

    try {
        // Verify the refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as {
            id: string;
        };

        // Find the user by ID and verify the refresh token
        const userRepository = getRepository(User);
        const user = await userRepository.findOne({ where: { id: decoded.id, refreshToken } });
        if (!user) {
            throw new Error("Invalid or expired refresh token");
        }

        // Generate new tokens
        const newAccessToken = generateAccessToken(user.id as string, user.role as string);
        const newRefreshToken = generateRefreshToken(user.id as string, user.role as string);

        // Update the refresh token in the database (rotate token)
        user.refreshToken = newRefreshToken;
        await userRepository.save(user);

        // Return the new tokens
        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error: any) {
        console.error("Error refreshing tokens:", error);
        throw new Error("Invalid or expired refresh token");
    }
};
/**
 * @description Adds or updates an alert for a user's cryptocurrency portfolio
 * @param {string} userId - The ID of the user
 * @param {string} symbol - The symbol of the cryptocurrency (e.g., "bitcoin")
 * @param {number} threshold - The price threshold at which the alert should be triggered
 * @returns {Array} - Returns the updated list of price thresholds
 * @throws {Error} - Throws error if the user is not found or alerts are disabled
 */
export const addOrUpdateAlert = async (userId: string, symbol: string, threshold: number) => {
    const userRepository = getRepository(User);
    const user = await userRepository.findOne({ where: { id: userId } });
    
    if (!user) throw new Error("User  not found");

    // Ensure alertPreferences is defined
    if (!user.alertPreferences) {
        user.alertPreferences = {
            enableAlerts: true, // Default value, adjust as necessary
            priceThresholds: [] // Initialize as an empty array
        };
    }

    // Check if alerts are enabled
    if (!user.alertPreferences.enableAlerts) {
        throw new Error("Alerts are disabled for this user");
    }

    // Ensure priceThresholds is defined
    if (!user.alertPreferences.priceThresholds) {
        user.alertPreferences.priceThresholds = []; // Initialize as an empty array
    }

    const existingAlert = user.alertPreferences.priceThresholds.find((alert) => alert.symbol === symbol);

    if (existingAlert) {
        // Update the existing threshold
        existingAlert.threshold = threshold;
    } else {
        // Add a new threshold
        user.alertPreferences.priceThresholds.push({ symbol, threshold });
    }

    await userRepository.save(user);
    return user.alertPreferences.priceThresholds;
};
/**
 * @description Retrieves the user's cryptocurrency portfolio with current prices
 * @param {string} userId - The ID of the user
 * @returns {Object} - Returns the user's portfolio with details and current prices
 * @throws {Error} - Throws error if the user is not found
 */


export const getUserPortfolio = async (userId: string) => {
    const userRepository = getRepository(User);
    const user = await userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
        throw new Error("User  not found");
    }

    // If the user has no portfolio
    if (!user.portfolio || user.portfolio.length === 0) {
        return { portfolio: [], message: "No cryptocurrencies in your portfolio." };
    }

    const portfolioDetails = await Promise.all(
        user.portfolio.map(async (crypto: { symbol: string; amount: number }) => {
            try {
                // Fetch current price using an API (e.g., CoinGecko)
                const { data } = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
                    params: {
                        ids: crypto.symbol,
                        vs_currencies: user.defaultCurrency || "usd",
                    },
                });

                const currentPrice = data[crypto.symbol]?.[user.defaultCurrency || "usd"] || 0;

                return {
                    symbol: crypto.symbol,
                    amount: crypto.amount,
                    currentPrice,
                    totalValue: crypto.amount * currentPrice,
                };
            } catch (error: any) {
                console.error(`Failed to fetch price for ${crypto.symbol}:`, error.message);
                return {
                    symbol: crypto.symbol,
                    amount: crypto.amount,
                    currentPrice: 0,
                    totalValue: 0,
                    error: "Price fetch failed",
                };
            }
        })
    );

    return { portfolio: portfolioDetails };
};

/**
 * @description Clears the refresh token in the database for a given user
 * @param {string} userId - The ID of the user
 * @returns {void} - Updates the user record to clear the refresh token
 * @throws {Error} - Throws error if the user is not found
 */
export const clearRefreshToken = async (userId: string) => {
    try {
        // Find the user by ID
        const userRepository = getRepository(User);
        const user = await userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error("User  not found");
        }

        // Set the refresh token to an empty string
        user.refreshToken = "";
        await userRepository.save(user);  // Save the updated user object

    } catch (error: any) {
        throw new Error(`Error clearing refresh token: ${error.message}`);
    }
};


/**
 * Generate and send a password reset token using bcrypt.
 * @param email - User's email address.
 */
export const sendResetToken = async (email: string) => {
    const userRepository = getRepository(User);
    const user = await userRepository.findOne({ where: { email } });

    // Always respond with a generic message
    if (!user) {
        return; // Prevent revealing user existence
    }

    // Generate a random token (e.g., a UUID or simple string)
    const resetToken = `${user.id}.${Date.now()}`;
    const hashedToken = await bcrypt.hash(resetToken, 10); // Hash token with bcrypt

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // Set expiration to 15 minutes

    try {
        await userRepository.save(user); // Save the updated user object

        const resetURL = `${process.env.CLIENT_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;
        await sendEmail({
            to: email,
            subject: "Password Reset Request",
            text: `
                <h3>Password Reset</h3>
                <p>Click the link below to reset your password. This link will expire in 15 minutes:</p>
                <a href="${resetURL}" target="_blank">${resetURL}</a>
            `,
        });

        return resetURL;
    } catch (error) {
        console.error("Failed to send reset token:", error);
        throw new Error("Failed to send password reset email.");
    }
};
/**
 * Reset the user's password using the bcrypt-hashed token.
 * @param token - Reset token.
 * @param newPassword - New password.
 */
export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    const userRepository = getRepository(User);
    
    // Find the user with a valid reset token and expiration
    const user = await userRepository.findOne({
        where: {
            resetPasswordToken: Not(IsNull()), // Ensure the reset token exists
            resetPasswordExpires: MoreThan(new Date()), // Ensure token is still valid
        },
    });

    if (!user) {
        throw new Error("Invalid or expired reset token.");
    }

    // Validate the token
    const isTokenValid = await bcrypt.compare(token, user.resetPasswordToken as string);
    if (!isTokenValid) {
        throw new Error("Invalid or expired reset token.");
    }

    // Set new password
    user.password = newPassword // Hash the new password
    user.resetPasswordToken = undefined; // Clear reset token
    user.resetPasswordExpires = undefined; // Clear expiration

    await userRepository.save(user); // Save the updated user object
};

// export const updateUser = async (id: string, data: IUser) => {
//     const result = await UserSchema.findOneAndUpdate({ _id: id }, data, {
//         new: true,
//     });
//     return result;
// };

// export const editUser = async (id: string, data: Partial<IUser>) => {
//     const result = await UserSchema.findOneAndUpdate({ _id: id }, data);
//     return result;
// };

// export const deleteUser = async (id: string) => {
//     const result = await UserSchema.deleteOne({ _id: id });
//     return result;
// };

// export const getUserById = async (id: string) => {
//     const result = await UserSchema.findById(id).lean();
//     return result;
// };

// export const getAllUser = async () => {
//     const result = await UserSchema.find({}).lean();
//     return result;
// };
// export const getUserByEmail = async (email: string) => {
//     const result = await UserSchema.findOne({ email }).lean();
//     return result;
// }

