import mongoose, { Schema, Document, Model } from "mongoose";
import { IUser } from "@ilot/types";

export interface UserDocument extends Omit<IUser, '_id'>, Document { 
  _id: mongoose.Types.ObjectId; 
  synapseId?: string;       
  signature?: string;       
  currentMode: 'standard' | 'ghost'; 
  password?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: number;
  lastActive: Date;
  isOnline: boolean;
  airplaneMode: boolean;
  teams: string[]; 
  projects: string[];
}

const UserSchema = new Schema<UserDocument>(
  {
    uid: { type: String, unique: true, sparse: true }, // Pivot Neo4j
    synapseId: { type: String, index: true }, 
    signature: { type: String },
    currentMode: { type: String, enum: ['standard', 'ghost'], default: 'standard' },
    username: { type: String, required: true, unique: true, trim: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, select: false },
    avatar: { type: String },
    // 💠 NEXUS : Rôles synchronisés avec @ilot/types
    role: { 
      type: String, 
      enum: ["ARCHITECTE", "BATISSEUR", "VISITEUR"], 
      default: "BATISSEUR", 
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Number },
    lastActive: { type: Date, default: Date.now },
    isOnline: { type: Boolean, default: false },
    airplaneMode: { type: Boolean, default: false },
    teams: [{ type: String }],
    projects: [{ type: String }]
  },
  { 
    timestamps: true,
    toJSON: { 
      virtuals: true,
      transform: (_, ret: any) => { 
        delete ret._id; 
        delete ret.__v;
        delete ret.password;
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

UserSchema.virtual('id').get(function(this: UserDocument) {
  return this._id ? this._id.toHexString() : null;
});

export const UserModel: Model<UserDocument> = 
  mongoose.models.User || mongoose.model<UserDocument>("User", UserSchema);

  