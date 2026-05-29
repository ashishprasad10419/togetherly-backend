const ApiError = require('../utils/apiError');

/**
 * Validates req[property] against a Joi schema.
 * Replaces req[property] with the validated/cleaned value.
 */
function validate(schema, property = 'body') {
  return (req, _res, next) => {
    if (!schema) return next();
    const { value, error } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      const details = error.details.map((d) => ({ message: d.message, path: d.path }));
      return next(ApiError.badRequest('Validation failed', details));
    }
    req[property] = value;
    next();
  };
}

module.exports = validate;
