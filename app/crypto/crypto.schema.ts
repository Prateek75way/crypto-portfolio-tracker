import mongoose from "mongoose";

const Schema = mongoose.Schema;

const TransactionSchema = new Schema({
    userId: { type: mongoose.Types.ObjectId, ref: "user", required: true },
    symbol: { type: String, required: true }, // Cryptocurrency symbol (e.g., 'bitcoin')
    type: { type: String, enum: ["BUY", "SELL"], required: true },
    amount: { type: Number, required: true }, // Quantity of cryptocurrency
    price: { type: Number, required: true }, // Price per unit at the time of transaction
    date: { type: Date, default: Date.now },
});

export default mongoose.model("Transaction", TransactionSchema);