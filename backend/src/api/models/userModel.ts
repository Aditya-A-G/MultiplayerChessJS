import { Schema, model } from 'mongoose';

export interface User {
  _id: string;
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
