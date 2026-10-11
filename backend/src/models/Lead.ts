import {
  Schema,
  Types,
  model,
  models,
  type HydratedDocument,
  type Model,
} from "mongoose";

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "interested",
  "follow_up",
  "converted",
  "not_interested",
  "lost",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export interface Lead {
  agencyId: Types.ObjectId;
  projectId?: Types.ObjectId | null;
  name: string;
  phone: string;
  requirement?: string;
  email?: string;
  company?: string;
  source?: string;
  status: LeadStatus;
  assignedTo: Types.ObjectId | null;
  notes?: string;
  archived: boolean;
  demoKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<Lead>(
  {
    agencyId: {
      type: Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
      index: true,
    },
    projectId: {
  type: Schema.Types.ObjectId,
  ref: "LeadProject",
  default: null,
  index: true,
},
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    requirement: {
      type: String,
      trim: true,
      maxlength: 500
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 160,
    },
    company: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    source: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    status: {
      type: String,
      enum: LEAD_STATUSES,
      default: "new",
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    archived: {
      type: Boolean,
      default: false,
      required: true,
    },
    demoKey: {
      type: String,
      sparse: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_document, returned) => {
        const value = returned as Record<string, unknown>;
        value.id = String(value._id);
        delete value._id;
        return value;
      },
    },
  },
);

leadSchema.index({
  agencyId: 1,
  archived: 1,
  status: 1,
  createdAt: -1,
});

leadSchema.index({
  agencyId: 1,
  assignedTo: 1,
  archived: 1,
});

leadSchema.index({
  agencyId: 1,
  phone: 1,
});

leadSchema.index(
  {
    agencyId: 1,
    demoKey: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      demoKey: { $type: "string" },
    },
  },
);

export type LeadDocument = HydratedDocument<Lead>;

export const LeadModel: Model<Lead> =
  (models.Lead as Model<Lead> | undefined) ?? model<Lead>("Lead", leadSchema);