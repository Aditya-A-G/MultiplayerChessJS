import { Schema, model, Document } from 'mongoose';

export interface User extends Document {
  username: string;
  password: string;
}

const userSchema = new Schema<User>({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});

export const UserModel = model<User>('User', userSchema);
