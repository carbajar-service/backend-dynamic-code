// Package Imports

// Custom Imports
const responser = require("./responser");
const AppError = require("./appError");

// statusCode, handler, messageCode, optionalMessage = null
const handleCastErrorDB = (err) => {
  const message = `${err.path}: ${err.value}.`;
  return new AppError(400, message, true);
};

const handleDuplicateFieldsDB = (err) => {
  let message = err.errmsg.match(/(["'])(\\?.)*?\1/);
  if (message) {
    message = message[0];
  }
  console.log("handleDuplicateFieldsDB regex value", message);
  return new AppError(400, message, true);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = errors.join(". ");
  return new AppError(400, message, true);
};

const handleJWTError = () => new AppError(401, "Invalid token. Please log in again!");

const handleJWTExpiredError = () => new AppError(401, "Your token has expired! Please log in again.");


const sendError = (err, req, res) => {
  if (err.isOperational) {
    return responser.send(err.statusCode, err.message, req, res, err);
  } else {
    // 1) Log error
    console.error("ERROR 💥", err);
    // 2) Send generic message
    return responser.send(500, "something went wrong", req, res, err);
  }
};

module.exports.errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  let error = err;
  if (error.name === "CastError") error = handleCastErrorDB(error);
  // if (error.code === 11000) error = handleDuplicateFieldsDB(error);
  if (error.name === "ValidationError") error = handleValidationErrorDB(error);
  if (error.name === "JsonWebTokenError") error = handleJWTError();
  if (error.name === "TokenExpiredError") error = handleJWTExpiredError();
  sendError(error, req, res);
};
