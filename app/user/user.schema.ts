import mongoose from "mongoose";
import { type IUser } from "./user.dto";
import bcrypt from "bcrypt";

const Schema = mongoose.Schema;

const hashPassword = async (password: string) => {
    const hash = await bcrypt.hash(password, 12);
    return hash;
};

const UserSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    active: { type: Boolean, default: true },
    role: { type: String, enum: ["USER", "ADMIN"], default: "USER" },
    password: { type: String, required: true },
    refreshToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    // Portfolio for tracking user holdings
    portfolio: [
        {
            symbol: { type: String, required: true },
            amount: { type: Number, required: true },
        },
    ],

    // Default currency for price thresholds and display
    defaultCurrency: { type: String, default: "usd" },

    // Track the number of transactions a user has performed
    transactionCount: { type: Number, default: 0 },

    // Alert preferences for price thresholds
    alertPreferences: {
        enableAlerts: { type: Boolean, default: true },
        priceThresholds: [
            {
                symbol: { type: String, required: true },
                threshold: { type: Number, required: true },
            },
        ],
        // Track the triggered alerts for the user
        triggeredAlerts: [
            {
                symbol: { type: String, required: true },
                threshold: { type: Number, required: true },
                triggeredAt: { type: Date, default: Date.now },
            },
        ],
    },
}, { timestamps: true });

// Hash the user's password before saving
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    this.password = await hashPassword(this.password);
    next();
});

export default mongoose.model<IUser>("User", UserSchema);
