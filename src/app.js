const { PrismaClient } = require('@prisma/client');
const { httpError } = require('../config');
const errorHandler = require('../utils/errorHandler');
const { user: userService, post } = require('../utils/services');
const {
  replaceKeyValueWithMatchingObject,
  renameKey,
  deleteKeyFromArrayObjects,
  isAlphanumeric,
  asyncLooper,
  convertArray,
  extractPostsTags,
  extractUniqueKey,
} = require('../utils/dro');
// const { clean, filterObject } = require('../utils/dro');

const prisma = new PrismaClient();

async function create(req, res, next) {
  const { user, body } = req;
  const data = {};

  try {
    data.created = await prisma.tag.create({ data: { ...body, userId: user.id } });
  } catch (e) {
    return errorHandler.prismaWrapper(e, next);
  }
  return res.send(data.created);
}

async function read(req, res, next) {
  const {
    query, id, userId, name,
  } = req.query;
  const data = {};
  try {
    data.tag = await prisma.tag.findMany({
      ...(query && { where: { name: { search: query } } }),
      ...(id && { where: { id: { in: id } } }),
      ...(userId && { where: { userId } }),
      ...(name && { where: { name: { in: name } } }),
    });
  } catch (e) {
    return errorHandler.prismaWrapper(e, next);
  }

  return res.send(deleteKeyFromArrayObjects(data.tag, ['userId']));
}

async function readById(req, res, next) {
  const { identifier } = req.params;
  const idNumeric = parseInt(identifier, 10);
  const idAlphanumeric = isAlphanumeric(identifier);
  const where = {
    ...(idNumeric ? { id: idNumeric } : (idAlphanumeric && { name: identifier })),
  };
  const data = {};
  try {
    data.tag = await prisma.tag.findUnique({
      where,
      include: {
        TagPost: true,
        _count: {
          select: { TagPost: true },
        },
      },
    });
  } catch (e) {
    return errorHandler.prismaWrapper(e, next);
  }
  if (data.tag) {
    data.users = await userService.getUsers(data.tag.userId, req.headers.authorization);
    data.tag = renameKey(data.tag, 'userId', 'creator');
    data.tag = replaceKeyValueWithMatchingObject(data.tag, 'creator', data.users, 'id');
    if (data.tag.TagPost) {
      data.tag.TagPost = await post
        .getPosts(extractUniqueKey('postId', data.tag.TagPost), req.headers.authorization);
    }
    data.tag = renameKey(data.tag, 'TagPost', 'posts');
    data.tag = renameKey(data.tag, '_count', 'postCount');
    data.tag.postCount = data.tag.postCount.TagPost;
  }
  return res.send(data.tag);
}

async function updateById(req, res, next) {
  const { user, body, params } = req;
  const { identifier } = params;

  const idNumeric = parseInt(identifier, 10);
  const idAlphanumeric = isAlphanumeric(identifier);
  const where = {
    ...(idNumeric ? { id: idNumeric } : (idAlphanumeric && { name: identifier })),
  };

  const data = {};
  try {
    data.isOwned = await prisma.tag.findFirst({ where: { ...where, userId: user.id } });
    if (!data.isOwned) {
      return next(httpError.Forbidden());
    }
    data.update = await prisma.tag.update({
      where,
      data: { ...body },
    });
  } catch (e) {
    return errorHandler.prismaWrapper(e, next);
  }
  return res.send({ ...data.update });
}

async function deleteById(req, res, next) {
  const { user, params } = req;
  const { identifier } = params;

  const idNumeric = parseInt(identifier, 10);
  const idAlphanumeric = isAlphanumeric(identifier);
  const where = {
    ...(idNumeric ? { id: idNumeric } : (idAlphanumeric && { name: identifier })),
  };

  const data = {};
  try {
    data.isOwned = await prisma.tag.findFirst({ where: { ...where, userId: user.id } });
    if (!data.isOwned) {
      return next(httpError.Forbidden());
    }
    data.delete = await prisma.tag.delete({
      where,
    });
  } catch (e) {
    return errorHandler.prismaWrapper(e, next);
  }
  return res.send({ ...data.delete });
}

async function createPostTag(req, res, next) {
  const { user, body, params } = req;
  const { id: postId } = params;
  const data = {};
  try {
    body.tags = await asyncLooper(body.tags, async (tag) => {
      const idNumeric = parseInt(tag, 10);
      const idAlphanumeric = isAlphanumeric(tag);
      const where = {
        ...(idNumeric ? { id: idNumeric } : (idAlphanumeric && { name: tag })),
      };
      const result = await prisma.tag.findUnique({
        where,
        select: {
          id: true,
        },
      });
      return result?.id;
    });
    data.postTag = body.tags.map((tagId) => ({
      tagId,
      postId,
      userId: user.id,
    }));
    data.created = await prisma.$transaction(data.postTag.map((pt) => prisma.tagPost.create({
      data: pt,
      include: {
        tag: {
          select: {
            name: true,
            id: true,
          },
        },
      },
    })));
    data.created = convertArray(data.created, 'tag');
  } catch (e) {
    return errorHandler.prismaWrapper(e, next);
  }
  return res.send(data.created);
}

async function deletePostTag(req, res, next) {
  const { user, body, params } = req;
  const { id: postId } = params;
  const data = {};
  try {
    if (!body.post) {
      await prisma.tagPost.deleteMany({ where: { postId } });
      return res.send();
    }
    body.tags = await asyncLooper(body.tags, async (tag) => {
      const idNumeric = parseInt(tag, 10);
      const idAlphanumeric = isAlphanumeric(tag);
      const where = {
        ...(idNumeric ? { id: idNumeric } : (idAlphanumeric && { name: tag })),
      };
      const result = await prisma.tag.findUnique({
        where,
        select: {
          id: true,
        },
      });
      return result?.id;
    });
    data.postTag = body.tags.map((tagId) => ({
      tagId,
      postId,
      userId: user.id,
    }));
    const postTag = await prisma.$transaction(
      data.postTag.map((tag) => prisma.tagPost.findFirst({ where: { ...tag } })),
    );
    await prisma.$transaction(
      postTag.map((tag) => prisma.tagPost.delete({ where: { id: tag.id } })),
    );
  } catch (e) {
    // throw e;
    return errorHandler.prismaWrapper(e, next);
  }
  return res.send(data.created);
}

async function updatePostTag(req, res, next) {
  const { user, body, params } = req;
  const { id: postId } = params;
  const data = {};
  try {
    body.tags = await asyncLooper(body.tags, async (tag) => {
      const idNumeric = parseInt(tag, 10);
      const idAlphanumeric = isAlphanumeric(tag);
      const where = {
        ...(idNumeric ? { id: idNumeric } : (idAlphanumeric && { name: tag })),
      };
      const result = await prisma.tag.findUnique({
        where,
        select: {
          id: true,
        },
      });
      return result?.id;
    });
    data.newTags = body.tags.map((tagId) => ({
      tagId,
      postId,
      userId: user.id,
    }));
    await prisma.tagPost.deleteMany({ where: { userId: user.id, postId } });
    data.newTags = await prisma.$transaction(
      data.newTags.map((tag) => prisma.tagPost.create({
        data: tag,
        include: {
          tag: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })),
    );
  } catch (e) {
    return errorHandler.prismaWrapper(e, next);
  }
  return res.send(convertArray(data.newTags, 'tag'));
}

async function readPostTag(req, res, next) {
  const { params } = req;
  const { id: postId } = params;
  const data = {};
  try {
    if (!Array.isArray(postId)) {
      data.tags = await prisma.tagPost.findMany({
        where: { postId },
        include: {
          tag: {
            select: {
              name: true,
              id: true,
            },
          },
        },
      });
      data.tags = convertArray(data.tags, 'tag');
    } else {
      data.tags = await prisma.$transaction(
        postId.map((id) => prisma.tagPost.findMany({
          where: { postId: id },
          include: {
            tag: {
              select: {
                name: true,
                id: true,
              },
            },
          },
        })),
      );
      data.tags = extractPostsTags(data.tags);
    }
  } catch (e) {
    // throw e;
    return errorHandler.prismaWrapper(e, next);
  }
  return res.send(data.tags);
}

module.exports = {
  create,
  read,
  readById,
  updateById,
  deleteById,
  createPostTag,
  deletePostTag,
  updatePostTag,
  readPostTag,
};
