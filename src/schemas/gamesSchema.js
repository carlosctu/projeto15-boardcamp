import joi from "joi";

export const gamesSchema = joi.object({
    name: joi.string().required(),
    image: joi.string().required(),
    stockTotal: joi.number().positive().required(),
    categoryId: joi.number().required(),
    pricePerDay: joi.number().positive().required(),
  });