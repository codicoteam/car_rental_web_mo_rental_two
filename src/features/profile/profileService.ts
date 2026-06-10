import axios from 'axios';
import { loadAuthFromStorage } from '../auth/authService';

export interface Profile {
id?: string;
role: string;
name: string;
email: string;
[key: string]: any;
}

const API_BASE = 'http://13.61.185.238:5050/api/v1/profiles';

// Helper to get Axios headers with token
const getAuthHeaders = () => {
const { token } = loadAuthFromStorage();
return token ? { Authorization: `Bearer ${token}` } : {};
};

const createProfile = async (profileData: Profile): Promise<Profile> => {
const response = await axios.post<Profile>(
`${API_BASE}/self`,
profileData,
{ headers: getAuthHeaders() }
);
return response.data;
};

const getProfileByRole = async (role: string): Promise<Profile> => {
const response = await axios.get<Profile>(
`${API_BASE}/me/${role}`,
{ headers: getAuthHeaders() }
);
return response.data;
};

const updateProfile = async (id: string, profileData: Partial<Profile>): Promise<Profile> => {
const response = await axios.patch<Profile>(
`${API_BASE}/${id}`,
profileData,
{ headers: getAuthHeaders() }
);
return response.data;
};

const profileService = {
createProfile,
getProfileByRole,
updateProfile,
};

export default profileService;
