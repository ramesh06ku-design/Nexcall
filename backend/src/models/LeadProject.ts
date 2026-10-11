import {
  Schema,
  Types,
  model,
  models,
  type HydratedDocument,
  type Model,
} from "mongoose";

export interface LeadProject {
  agencyId: Types.ObjectId;
  name: string;
  assignedWorkerIds: Types.ObjectId[];
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}
const leadProjectSchema = new Schema<LeadProject>(
  {
    agencyId: {
      type: Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
      index: true,
    },
    name: {
  type: String,
  required: true,
  trim: true,
  maxlength: 160,
},
assignedWorkerIds: {
  type: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  default: [],
},
archived: {
      type: Boolean,
      default: false,
      required: true,
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

leadProjectSchema.index({
  agencyId: 1,
  archived: 1,
  createdAt: -1,
});

leadProjectSchema.index(
  {
    agencyId: 1,
    name: 1,
  },
  {
    unique: true,
  },
);

export type LeadProjectDocument = HydratedDocument<LeadProject>;

export const LeadProjectModel: Model<LeadProject> =
  (models.LeadProject as Model<LeadProject> | undefined) ??
  model<LeadProject>("LeadProject", leadProjectSchema);