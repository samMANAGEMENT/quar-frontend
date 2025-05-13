import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_KEY_BACKEND,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;
