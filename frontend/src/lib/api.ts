import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/v1';

const axiosInstance = axios.create({
  withCredentials: true,
});

export const signUpUser = async (formData: {
  username: string;
  password: string;
}) => {
  const response = await axiosInstance.post(
    `${API_BASE_URL}/users/signup`,
    formData
  );
  return response.data;
};

export const loginUser = async (formData: {
  username: string;
  password: string;
}) => {
  const response = await axiosInstance.post(
    `${API_BASE_URL}/users/login`,
    formData
  );
  return response.data;
};

export const logOutUser = async () => {
  const response = await axiosInstance.post(`${API_BASE_URL}/users/logout`);
  return response.data;
};

export const checkAuthentication = async () => {
  const response = await axiosInstance.get(
    `${API_BASE_URL}/users/authenticated-status`
  );
  return response.data;
};

export const createNewGame = async () => {
  const response = await axiosInstance.post(`${API_BASE_URL}/games/`);
  return response.data;
};
