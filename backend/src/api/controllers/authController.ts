import { UserModel } from '../models/userModel';
import bcrypt from 'bcryptjs';
import { NextFunction, Request, Response } from 'express';

export const signUp = async (req: Request, res: Response) => {
  const { username, password } = req.body as unknown as {
    username: string;
    password: string;
  };

  try {
    const user = await UserModel.findOne({
      username,
    });

    if (user) {
      return res.status(409).json({
        status: 'fail',
        message: 'username already exits',
      });
    }

    const hashPassword = await bcrypt.hash(password, 12);

    const newUser = await UserModel.create({
      username,
      password: hashPassword,
    });

    res.status(201).json({
      status: 'success',
      data: {
        _id: newUser._id,
        username: newUser.username,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
    });
  }
};

export const logOut = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.status(200).json({
      status: 'success',
    });
  });
};
