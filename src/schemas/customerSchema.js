import joi from "joi";

export const customerSchema = joi.object({
  name: joi.string().required(),
  phone: joi.string().min(10).max(11).required(),
  cpf: joi
    .string()
    .pattern(/^[0-9]+$/)
    .min(11)
    .max(11)
    .required(),
  birthday: joi.string().required(),
});

