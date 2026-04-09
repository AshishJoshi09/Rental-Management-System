const Joi = require("joi");

const schemas = {
  register: Joi.object({
    name:     Joi.string().min(2).max(100).required(),
    email:    Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role:     Joi.string().valid("tenant", "owner").default("tenant"),
    phone:    Joi.string().allow("").optional(),
  }),

  login: Joi.object({
    email:    Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  property: Joi.object({
    title:           Joi.string().min(5).max(200).required(),
    description:     Joi.string().allow("").optional(),
    address:         Joi.string().required(),
    city:            Joi.string().required(),
    state:           Joi.string().allow("").optional(),
    zip:             Joi.string().allow("").optional(),
    price_per_month: Joi.number().positive().required(),
    bedrooms:        Joi.number().integer().min(0).default(1),
    bathrooms:       Joi.number().integer().min(0).default(1),
    area_sqft:       Joi.number().integer().positive().allow(null).optional(),
    property_type:   Joi.string().valid("apartment","house","villa","studio","commercial").default("apartment"),
    amenities:       Joi.array().items(Joi.string()).optional(),
    images:          Joi.array().items(Joi.string()).optional(),
    is_available:    Joi.boolean().default(true),
  }),

  booking: Joi.object({
    property_id: Joi.number().integer().required(),
    start_date:  Joi.date().iso().required(),
    end_date:    Joi.date().iso().greater(Joi.ref("start_date")).required(),
    notes:       Joi.string().allow("").optional(),
  }),

  review: Joi.object({
    property_id: Joi.number().integer().required(),
    booking_id:  Joi.number().integer().optional(),
    rating:      Joi.number().integer().min(1).max(5).required(),
    comment:     Joi.string().allow("").optional(),
  }),

  maintenance: Joi.object({
    property_id: Joi.number().integer().required(),
    title:       Joi.string().min(5).max(200).required(),
    description: Joi.string().allow("").optional(),
    priority:    Joi.string().valid("low","medium","high","urgent").default("medium"),
    images:      Joi.array().items(Joi.string()).optional(),
  }),
};

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      msg: "Validation error",
      errors: error.details.map(d => d.message),
    });
  }
  next();
};

module.exports = { schemas, validate };
