function exclude(data, keys) {
  const returnValue = { ...data };
  keys.forEach((key) => {
    delete returnValue[key];
  });
  return returnValue;
}

/**
 * Loops through an array and applies an asynchronous function to each element,
 * returning an array of results. Optionally filters out falsy values.
 *
 * @async
 * @function asyncLooper
 * @param {Array} array - The array to loop through.
 * @param {Function} asyncFunc - The asynchronous function to apply to each element.
 * @param {boolean} [cleanUp=false] - If true, filters out falsy values from the results.
 * @returns {Promise<Array>} A promise that resolves to an array of results.
 * @throws {Error} If the asyncFunc rejects for any element in the array.
 *
 * @example
 * const results = await asyncLooper([1, 2, 3], async (n) => n * 2);
 * console.log(results); // [2, 4, 6]
 *
 * @example
 * const results = await asyncLooper([1, null, 3], async (n) => n, true);
 * console.log(results); // [1, 3]
 */
async function asyncLooper(array, asyncFunc, cleanUp = false) {
  let results = await Promise.all(array.map(asyncFunc));

  // If clean is true, filter out falsy values
  if (cleanUp) {
    results = results.filter(Boolean);
  }

  return results;
}

function clean(data) {
  const obj = { ...data };
  Object.keys(obj).forEach((key) => {
    if ((obj[key] === null) || (obj[key] === undefined)) {
      delete obj[key];
    }
  });
  return obj;
}

function containsAny(obj, keys) {
  return keys.some((key) => key in obj);
}

function filterObject(fields, object) {
  const returnValue = {};
  fields.forEach((key) => {
    if (Object.hasOwnProperty.call(object, key)) {
      returnValue[key] = object[key];
    }
  });
  return returnValue;
}

const extractUniqueKey = (key, arr) => {
  const keys = arr.map((obj) => obj[key]);
  const uniqueKeys = [...new Set(keys)];
  return uniqueKeys;
};

/**
 * Replace a specific key's value in an object with the corresponding object from a list of
 * replacement objects.
 *
 * @param {Object} inputObject - The object whose key's value needs to be replaced.
 * @param {string} targetKey - The key in the object whose value needs to be replaced.
 * @param {Array<Object>} availableReplacements - An array of objects, one of which will be used to
 * replace the key's value.
 * @param {string} replacementObjKey - The key in the replacement objects that corresponds to
 * the value in the inputObject.
 * @returns {Object} - The resulting object after the replacement has been made.
 */
function replaceKeyValueWithMatchingObject(
  inputObject,
  targetKey,
  availableReplacements,
  replacementObjKey,
) {
  const matchingReplacement = availableReplacements
    .find((replacement) => replacement[replacementObjKey] === inputObject[targetKey]);
  const { [targetKey]: _, ...remainingObj } = inputObject;
  return { ...remainingObj, [targetKey]: matchingReplacement };
}

/**
 * Maps through an array of objects and replaces a specific key's value in each object
 * with the corresponding object from a list of replacement objects.
 *
 * @param {Array<Object>} objectsArray - An array of objects to iterate over
 * and replace key's value.
 * @param {string} targetKey - The key in the objects whose value needs to be replaced.
 * @param {Array<Object>} availableReplacements - An array of objects, one of which will be used to
 * replace the key's value.
 * @param {string} replacementObjKey - The key in the replacement objects that corresponds to
 * the value in the input objects.
 * @returns {Array<Object>} - The resulting array after the replacements have been made.
 */
function replaceKeyInObjectArrayWithValue(
  objectsArray,
  targetKey,
  availableReplacements,
  replacementObjKey,
) {
  return objectsArray
    .map((obj) => replaceKeyValueWithMatchingObject(
      obj,
      targetKey,
      availableReplacements,
      replacementObjKey,
    ));
}

/**
 * Renames a key in the given object.
 *
 * @param {Object} obj - The object to modify.
 * @param {string} oldKey - The current key name.
 * @param {string} newKey - The new key name.
 * @returns {Object} - The modified object with the key renamed.
 */
function renameKey(obj, oldKey, newKey) {
  const modifiedObj = { ...obj };

  if (Object.prototype.hasOwnProperty.call(modifiedObj, oldKey)) {
    modifiedObj[newKey] = modifiedObj[oldKey];
    delete modifiedObj[oldKey];
  }

  return modifiedObj;
}

/**
 * Renames a key in each object of the given array.
 *
 * @param {Array<Object>} arr - The array of objects to modify.
 * @param {string} oldKey - The current key name.
 * @param {string} newKey - The new key name.
 * @returns {Array<Object>} - The modified array of objects with the key renamed.
 */
function renameKeyInArray(arr, oldKey, newKey) {
  return arr.map((obj) => renameKey(obj, oldKey, newKey));
}

/**
 * Deletes a specified key from each object in an array of objects.
 *
 * @param {Array<Object>} array - The array of objects to modify.
 * @param {string} keyToDelete - The key to delete from each object.
 * @returns {Array} - The modified array with the specified key removed from all objects.
 */
function deleteKeyFromArrayObjects(array, keyToDelete) {
  const arrayCopy = array;
  for (let i = 0; i < array.length; i += 1) {
    delete arrayCopy[i][keyToDelete];
  }
  return array;
}

function isAlphanumeric(str) {
  const alphanumericRegex = /^[a-zA-Z0-9-]*$/;
  return alphanumericRegex.test(str);
}

function convertArray(arr, key) {
  // Use reduce to transform the array
  const result = arr.reduce((acc, item) => {
    // Check if the tag is already in the accumulator
    const found = acc.find((element) => element.id === item[key].id);

    // If not found, add it to the accumulator
    if (!found) {
      acc.push(item[key]);
    }

    return acc;
  }, []);

  return result;
}

function extractPostsTags(input) {
  const result = input.flat().reduce((acc, cur) => {
    // Find the post in the accumulator
    let post = acc.find((item) => item.postId === cur.postId);

    // If the post was not found, create a new one
    if (!post) {
      post = {
        postId: cur.postId,
        tag: [],
      };
      acc.push(post);
    }

    // If the tag is not already in the post's tag array, add it
    if (!post.tag.find((tag) => tag.id === cur.tag.id)) {
      post.tag.push({
        name: cur.tag.name,
        id: cur.tag.id,
      });
    }

    return acc;
  }, []);

  return result;
}

module.exports = {
  exclude,
  clean,
  containsAny,
  filterObject,
  extractUniqueKey,
  replaceKeyValueWithMatchingObject,
  replaceKeyInObjectArrayWithValue,
  renameKey,
  renameKeyInArray,
  deleteKeyFromArrayObjects,
  isAlphanumeric,
  asyncLooper,
  convertArray,
  extractPostsTags,
};
