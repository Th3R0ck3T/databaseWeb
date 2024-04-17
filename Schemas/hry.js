const Joi = require('joi');

module.exports.createGameSchema = Joi.object({
    game: Joi.object({
        Jmeno: Joi.string().required(),
        Popis: Joi.string().required(),
        Cena: Joi.number().integer().min(0).required(),
        DatumVzniku: Joi.date().iso().required(),
        SeznamHerID: Joi.number().integer().min(0).required(),
        KategorieID: Joi.number().integer().min(0).required()
    }).required(),
});
module.exports.updateGameSchema = Joi.object({
    game: Joi.object({
        Jmeno: Joi.string().required(),
        Popis: Joi.string().required(),
        Cena: Joi.number().integer().min(0).required(),
        DatumVzniku: Joi.date().iso().required(),
        SeznamHerID: Joi.number().integer().min(0).required(),
        KategorieID: Joi.number().integer().min(0).required()
    }).required(),
});