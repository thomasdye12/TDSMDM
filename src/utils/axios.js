import axios from 'axios';
import { TDS_auth } from './auth';

// State object to store userAboutMeData
const state = {
  userAboutMeData: null,
};

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: 'https://device.server.thomasdye.net/TDSapi', // Set your base URL here
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
  config => {
    // Get the JWT token
    let token = TDS_auth();

    if (!token) {
      token = TDS_auth();

      if (!token) {
        window.location.href = 'https://auth.thomasdye.net/auth?redirect=https://device.server.thomasdye.net';
        return Promise.reject(new Error('No authentication token found. Redirecting to login.'));
      }
    }

    config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Function to get the contents of the about/me endpoint and store it globally
export const getUserAboutMe = async () => {
  if (state.userAboutMeData) {
    return state.userAboutMeData; // Return cached data if already fetched
  }
  try {
    const response = await axiosInstance.get('https://auth.thomasdye.net/auth/app/user/about/me');
    state.userAboutMeData = response.data; // Store the data in the state object
    return state.userAboutMeData;
  } catch (error) {
    console.error('Error fetching user about me data:', error);
    throw error;
  }
};

export const userAccessToservice = async () => {
  // use the get userabout me to see if the user has 
  // "net.thomasdye.profilemanager.admin",
  // "net.thomasdye.profilemanager.view.all",
  // "net.thomasdye.profilemanager.edit.all",
  // "net.thomasdye.profilemanager.delete.all",
  // "net.thomasdye.profilemanager.create.all",
  // "net.thomasdye.profilemanager.view.self",
  // "net.thomasdye.profilemanager.edit.self",
  // "net.thomasdye.profilemanager.delete.self",
  // "net.thomasdye.profilemanager.create.self",
  // any of these roles
  // if they do return true
  // else return false
  //  "AccessRights": [
  const userAboutMe = await getUserAboutMe();
  const accessRights = userAboutMe.AccessRights;
  const requiredRoles = [
    "net.thomasdye.profilemanager.admin",
    "net.thomasdye.profilemanager.devices.all",
    "net.thomasdye.profilemanager.apps.all",
    "net.thomasdye.profilemanager.profiles.all",
    "net.thomasdye.profilemanager.delete.all",
    "net.thomasdye.profilemanager.create.all",
    "net.thomasdye.profilemanager.events.all",
  ];

  return accessRights.some(role => requiredRoles.includes(role));

}

// same thing but a single service will be passed in
export const userAccessToserviceSub =  async (service) => {
  // use the get userabout me to see if the user has 
  // "net.thomasdye.profilemanager.admin",
  // "net.thomasdye.profilemanager.view.all",
  // "net.thomasdye.profilemanager.edit.all",
  // "net.thomasdye.profilemanager.delete.all",
  // "net.thomasdye.profilemanager.create.all",
  // "net.thomasdye.profilemanager.view.self",
  // "net.thomasdye.profilemanager.edit.self",
  // "net.thomasdye.profilemanager.delete.self",
  // "net.thomasdye.profilemanager.create.self",
  // any of these roles
  // if they do return true
  // else return false
  //  "AccessRights": [
  const userAboutMe = await getUserAboutMe();
  const accessRights = userAboutMe.AccessRights;
  const requiredRoles = [
    'net.thomasdye.profilemanager.admin',
    service,
  ];

  return accessRights.some(role => requiredRoles.includes(role));

}




// Exporting both the axiosInstance and the state
export { state };

// Default export for the axiosInstance
export default axiosInstance;
