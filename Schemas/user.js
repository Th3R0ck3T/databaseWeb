const Joi = require('joi');

module.exports.createUserSchema = Joi.object({
  user: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
    confirmPassword: Joi.string().required()
  }).required()
});