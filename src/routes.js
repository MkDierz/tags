const { Router } = require('express');
const { checkToken, initServices } = require('../utils/middleware');
const errorHandler = require('../utils/errorHandler');
const {
  nameField,
  updateFields,
  readFields,
  identifierParam,
  idParam,
  multipleIdParam,
} = require('../utils/validator');
const {
  read,
  create,
  deleteById,
  readById,
  updateById,
  createPostTag,
  deletePostTag,
  readPostTag,
  updatePostTag,
} = require('./app');

const router = Router();
router.use(initServices);
router.use(checkToken);

router.post('/', nameField, errorHandler.validation, create);
router.get('/', readFields, errorHandler.validation, read);
router.get('/:identifier', identifierParam, errorHandler.validation, readById);
router.put('/:identifier', updateFields, errorHandler.validation, updateById);
router.delete('/:identifier', identifierParam, errorHandler.validation, deleteById);

router.post('/post/:id', idParam, createPostTag);
router.delete('/post/:id', idParam, deletePostTag);
router.get('/post/:id', multipleIdParam, readPostTag);
router.put('/post/:id', idParam, updatePostTag);

module.exports = router;
