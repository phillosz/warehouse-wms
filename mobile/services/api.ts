import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://192.168.1.100:3000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add device ID to requests
api.interceptors.request.use(async (config) => {
  const deviceId = await AsyncStorage.getItem('deviceId');
  if (deviceId && config.headers) {
    config.headers['X-Device-ID'] = deviceId;
  }
  return config;
});

export interface Rail {
  id: string;
  code: string;
  name: string;
  warehouseId: string;
  zone?: string;
  rowIndex: number;
  colIndex: number;
  posIndex: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  isActive: boolean;
  rollCount: number;
}

export interface Roll {
  id: string;
  ean: string;
  materialName: string;
  description?: string;
  widthMm?: number;
  grammageGm2?: number;
  color?: string;
  supplier?: string;
  batchNo?: string;
  receivedAt: string;
  status: string;
  location?: {
    rail?: {
      code: string;
      name: string;
    };
    placedAt: string;
    lastMovedAt: string;
  };
}

export interface Movement {
  id: string;
  type: string;
  rollId: string;
  fromRailId?: string;
  toRailId?: string;
  at: string;
  userId: string;
  deviceId?: string;
  user?: {
    name: string;
  };
  fromRail?: {
    code: string;
    name: string;
  };
  toRail?: {
    code: string;
    name: string;
  };
}

export interface User {
  id: string;
  name: string;
  role: string;
  deviceId: string;
}

// User API
export const registerUser = async (name: string, deviceId: string): Promise<User> => {
  const response = await api.post<{ user: User }>('/users/register', { name, deviceId });
  return response.data.user;
};

export const getCurrentUser = async (deviceId: string): Promise<User> => {
  const response = await api.get<User>('/users/me', { params: { deviceId } });
  return response.data;
};

// Rails API
export const getRails = async (): Promise<Rail[]> => {
  const response = await api.get<{ rails: Rail[] }>('/rails');
  return response.data.rails;
};

export const getRail = async (code: string): Promise<Rail> => {
  const response = await api.get<Rail>(`/rails/${code}`);
  return response.data;
};

export const getRailInventory = async (code: string): Promise<{ railCode: string; railName: string; rolls: Roll[] }> => {
  const response = await api.get(`/rails/${code}/inventory`);
  return response.data;
};

// Rolls API
export const searchRolls = async (params: {
  query?: string;
  status?: string;
  railCode?: string;
  limit?: number;
}): Promise<Roll[]> => {
  const response = await api.get<{ rolls: Roll[] }>('/rolls', { params });
  return response.data.rolls;
};

export const getRoll = async (id: string): Promise<Roll & { movements: Movement[] }> => {
  const response = await api.get(`/rolls/${id}`);
  return response.data;
};

export const receiveRoll = async (data: {
  ean: string;
  materialName: string;
  description?: string;
  widthMm?: number;
  grammageGm2?: number;
  color?: string;
  supplier?: string;
  batchNo?: string;
  toRailCode: string;
  userId: string;
  deviceId?: string;
}): Promise<{ roll: Roll; movement: Movement }> => {
  const response = await api.post('/rolls/receive', data);
  return response.data;
};

export const moveRoll = async (
  rollId: string,
  data: {
    toRailCode: string;
    userId: string;
    deviceId?: string;
  }
): Promise<{ movement: Movement }> => {
  const response = await api.post(`/rolls/${rollId}/move`, data);
  return response.data;
};

export const removeRoll = async (
  rollId: string,
  data: {
    reason?: string;
    userId: string;
    deviceId?: string;
  }
): Promise<{ movement: Movement }> => {
  const response = await api.post(`/rolls/${rollId}/remove`, data);
  return response.data;
};

export default api;
