import {
  Schema,
  Types,
  model,
  models,
  type Model,
} from "mongoose";

export interface Message {
  agencyId: Types.ObjectId;
  telecallerId: Types.ObjectId;
  message: string;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<Message>(
  {
    agencyId: {
      type: Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
      index: true,
    },

    telecallerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 2000,
    },

    readAt: {
      type: Date,
      default: null,
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

messageSchema.index({
  agencyId: 1,
  createdAt: -1,
});

messageSchema.index({
  agencyId: 1,
  telecallerId: 1,
  createdAt: -1,
});

export const MessageModel: Model<Message> =
  (models.Message as Model<Message> | undefined) ??
  model<Message>("Message", messageSchema);