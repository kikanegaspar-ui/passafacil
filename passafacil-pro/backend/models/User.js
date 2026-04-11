/**
 * models/User.js
 * Schema do utilizador. A senha NUNCA é devolvida pela API (select: false).
 */

const mongoose = require("mongoose");

const historySchema = new mongoose.Schema({
  icon:  { type: String, default: "📌" },
  text:  { type: String, required: true },
  coins: { type: Number, default: 0 },
  date:  { type: Date,   default: Date.now },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true, maxlength: 80 },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 30 },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false }, // NUNCA devolvido na API
  phone:    { type: String, default: "" },
  school:   { type: String, default: "" },
  color:    { type: String, default: "#0EA5A0" },

  // Sistema de recompensas
  coins:    { type: Number, default: 20 },
  aiUses:   { type: Number, default: 0 },

  // Role: "user" ou "admin" — nunca "superadmin" etc.
  role:     { type: String, enum: ["user", "admin"], default: "user" },

  // Histórico de actividades
  history:  [historySchema],

  createdAt: { type: Date, default: Date.now },
}, {
  // Remover __v e renomear _id → id na resposta JSON
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password; // garantia extra
      return ret;
    }
  }
});

module.exports = mongoose.model("User", userSchema);
