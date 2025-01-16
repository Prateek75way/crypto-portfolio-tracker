
import { type IUser } from "./user.dto";
import userSchema from "./user.schema";
import UserSchema from "./user.schema";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
export const createUser = async (data: IUser) => {
    try {
        const result = await userSchema.create({...data, active: true});
        return result;
    } catch (error: any) {
        if (error.code === 11000) {
            // Handle duplicate key error (e.g., duplicate email)
            throw new Error("Email already exists");
        }
        throw new Error(error.message || "An error occurred while creating the user");
    }
};



export const loginUser = async (email: string, password: string) => {
    if (!email || !password) {
        throw new Error("Email and password are required");
    }

    // Find the user by email
    const user = await userSchema.findOne({ email });
    if (!user) {
        throw new Error("User not found");
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password || "");
    if (!isPasswordValid) {
        throw new Error("Invalid password");
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id, user.role);

    // Save the refresh token to the database
    user.refreshToken = refreshToken;
    user.active = true;
    await user.save();

    return { accessToken, refreshToken };
};

export const generateAccessToken = (id: string, role: string): string => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET as string, { expiresIn: "15m" });
}

export const generateRefreshToken = (id: string, role: string): string => {
    return jwt.sign({ id, role }, process.env.JWT_REFRESH_SECRET as string, { expiresIn: "7d" });
  };

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
        const user = await userSchema.findOne({ _id: decoded.id, refreshToken });
        if (!user) {
            throw new Error("Invalid or expired refresh token");
        }

        // Generate new tokens
        const newAccessToken = generateAccessToken(user._id, user.role);
        const newRefreshToken = generateRefreshToken(user._id, user.role);

        // Update the refresh token in the database (rotate token)
        user.refreshToken = newRefreshToken;
        await user.save();

        // Return the new tokens
        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error: any) {
        console.error("Error refreshing tokens:", error);
        throw new Error("Invalid or expired refresh token");
    }
};



export const addOrUpdateAlert = async (userId: string, symbol: string, threshold: number) => {
    const user = await userSchema.findById(userId);
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

    await user.save();
    return user.alertPreferences.priceThresholds;
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

