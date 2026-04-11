/**
 * models/Solution.js
 * Schema das resoluções submetidas pelos alunos.
 */

const mongoose = require("mongoose");

const solutionSchema = new mongoose.Schema({
  // Quem submeteu
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName:  { type: String, required: true },
  userColor: { type: String, default: "#0EA5A0" },

  // Conteúdo
  discipline: {
    type: String,
    required: true,
    enum: ["Matemática", "Física", "Química", "Empreendedorismo"],
  },
  question: { type: String, required: true, maxlength: 2000 },
  answer:   { type: String, required: true, maxlength: 5000 },

  // Avaliação IA
  aiScore:    { type: Number, default: 0, min: 0, max: 100 },
  aiFeedback: { type: String, default: "" },
  aiVerdict:  { type: String, enum: ["CORRECTO", "PARCIAL", "INCORRETO", ""], default: "" },

  // Estado de moderação
  status: {
    type:    String,
    enum:    ["pending", "approved", "rejected"],
    default: "pending",
  },

  // Recompensa em moedas (atribuída ao aprovar)
  coins: { type: Number, default: 0 },

  // Votos da comunidade
  votes: { type: Number, default: 0 },

  // Quem votou (para evitar votos duplos)
  votedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  createdAt: { type: Date, default: Date.now },
}, {
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.votedBy; // não expor lista de quem votou
      return ret;
    }
  }
});

// Índices para pesquisa rápida
solutionSchema.index({ status: 1, discipline: 1 });
solutionSchema.index({ userId: 1 });
solutionSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Solution", solutionSchema);
