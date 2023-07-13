const { default: axios } = require('axios');
const { baseUrl } = require('../config');

const auth = {
  verifyToken: (accessToken) => axios.get(`${baseUrl}/auth/verify-token?accessToken=${accessToken}`),
};

const user = {
  getUsers: (id, Authorization) => axios.get(`${baseUrl}/user?id=${id.toString()}`, {
    headers: {
      Authorization,
    },
  }).then((response) => response.data),
};

const post = {
  getPosts: (id, Authorization) => axios.get(`${baseUrl}/post?id=${id.toString()}`, {
    headers: {
      Authorization,
    },
  }).then((response) => response.data),
};

module.exports = {
  auth,
  user,
  post,
};
