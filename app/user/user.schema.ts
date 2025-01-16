import mongoose from "mongoose";
import { type IUser } from "./user.dto";
import bcrypt from 'bcrypt';

const Schema = mongoose.Schema;

const hashPassword = async (password: string) => {
        const hash = await bcrypt.hash(password, 12);
        return hash;
};

const UserSchema = new Schema<IUser>({
        name: { type: String, required: true },
        email: { type: String, required: true },
        active: { type: Boolean, required: false, default: true },
        role: { type: String, required: true, enum: ["USER", "ADMIN"], default: "USER" },
        password: { type: String, required: true },
        refreshToken: { type: String, required: false },
        portfolio: [
            {
                symbol: { type: String, required: true },
                amount: { type: Number, required: true },
            },
        ],
        defaultCurrency: { type: String, default: "usd" },
        transactionCount: { type: Number, default: 0 },
        alertPreferences: {
            enableAlerts: { type: Boolean, default: true },
            priceThresholds: [
                {
                    symbol: { type: String, required: true },
                    threshold: { type: Number, required: true },
                },
            ],
        },
    }, { timestamps: true });
    
    UserSchema.pre("save", async function (next) {
        if (!this.isModified("password")) {
            return next();
        }
        this.password = await hashPassword(this.password);
        next();
    });
    
    export default mongoose.model<IUser>("user", UserSchema);
    