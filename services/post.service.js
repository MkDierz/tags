const { ApiService } = require('./api.service');

class PostService extends ApiService {
  constructor() {
    super('/post');
  }

  async getPosts(id) {
    return this.get(`/?id=${id.toString()}`);
  }

  async getPostById(id) {
    return this.get(`/${id.toString()}`);
  }
}

module.exports = { PostService };
