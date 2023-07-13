const { body, query, param } = require('express-validator');

const nameField = body('name').notEmpty().matches(/^[A-Za-z0-9-]+$/)
  .withMessage('tag can only contain letters, numbers, and hyphens');

const idParam = param('id').exists().withMessage('Valid id is required').toInt();
const multipleIdParam = param('id')
  .custom((value) => {
    const values = value.split(',');
    if (!values.map((i) => parseInt(i, 10)).every(Number.isInteger)) {
      throw new Error('Array does not contain Integers');
    }
    return true;
  })
  .customSanitizer((value) => {
    const values = value.split(',');
    if (values.length === 1) {
      return parseInt(values[0], 10);
    }
    return values.map((v) => parseInt(v, 10));
  });
const identifierParam = param('identifier').exists().withMessage('Valid identifier is required');
const searchQueryField = query('query').isAlphanumeric().withMessage('valid query required').optional();
const userIdQueryField = query('userId').isNumeric().withMessage('valid userId required').toInt()
  .optional();
const nameQueryField = query('name')
  .custom((value) => {
    const values = value.split(',');
    if (!values.every((item) => /^[a-zA-Z0-9-]*$/.test(item))) {
      throw new Error('name cannot contains non-alphanumeric or forbidden characters');
    }
    return true;
  })
  .customSanitizer((value) => value.split(','))
  .optional();
const idQuery = query('id')
  .custom((value) => {
    if (!value.split(',').map((i) => parseInt(i, 10)).every(Number.isInteger)) {
      throw new Error('Array does not contain Integers');
    }
    return true;
  })
  .customSanitizer((value) => value.split(',').map((i) => parseInt(i, 10)))
  .optional();

const updateFields = [
  nameField,
  identifierParam,
];
const readFields = [
  searchQueryField,
  nameQueryField,
  idQuery,
  userIdQueryField,
];
module.exports = {
  nameField,
  readFields,
  updateFields,
  identifierParam,
  idParam,
  multipleIdParam,
};
