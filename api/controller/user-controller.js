import emailValidator from "email-validator";
import passwordValidator from "password-validator";
import bcrypt from "bcrypt";

import * as userService from "../service/user-service.js";

// Create a schema
const schema = new passwordValidator();

// Add properties to it
schema
  .is()
  .min(8)
  .has()
  .uppercase()
  .has()
  .lowercase()
  .has()
  .digits(2)
  .has()
  .not()
  .spaces();

const setErrorResponse = (error, response) => {
  response.status(500);
  response.json(error);
};

const setSuccessResponse = (obj, response) => {
  response.status(201);
  response.json(obj);
};

const auth = (request, response) => {
  // check for basic auth header
  if (
    !request.headers.authorization ||
    request.headers.authorization.indexOf("Basic ") === -1
  ) {
    response.status(403).json({
      message: "Missing Request Header: Authorization",
    });
    return;
  }

  // verify auth credentials
  const base64Credentials = request.headers.authorization.split(" ")[1];
  console.log(base64Credentials);
  const credentials = Buffer.from(base64Credentials, "base64").toString(
    "ascii"
  );
  const [email, password] = credentials.split(":");

  return {
    email,
    password,
  };
};

export const post = async (request, response) => {
  const email = request.body.username;
  const password = request.body.password;

  if (
    !request.body.firstName ||
    !request.body.lastName ||
    !email ||
    !password
  ) {
    response.status(400);
    response.json({
      message: "A required field is empty.",
    });
  } else {
    if (emailValidator.validate(email) && schema.validate(password)) {
      try {
        const payload = {
          firstName: request.body.firstName,
          lastName: request.body.lastName,
          username: request.body.username,
          password: request.body.password
        };
        const user = await userService.createUser(payload);
        setSuccessResponse(user, response);
      } catch (error) {
        if (error.message.includes("SequelizeUniqueConstraintError")) {
          response.status(400);
          response.json({
            message: "A user account with the email address already exists",
          });
        } else setErrorResponse(error, response);
      }
    } else {
      response.status(400);
      response.json({
        message: "Invalid Email or password.",
      });
    }
  }
};

export const get = async (request, response) => {
  try {
    const id = request.params.id;

    const authCredentials = auth(request, response);

    if (!authCredentials) {
      return;
    }

    const user = await userService.getUser(id);
    if (!user) {
      response.status(404).json({
        message: "User not found!",
      });
      return;
    }

    if (authCredentials && authCredentials.email != user.username) {
      response.status(401).json({
        message: "Oops! Unauthorized Access",
      });
      return;
    }
    bcrypt.compare(authCredentials.password, user.password, (err, res) => {
      if (err) {
        response.status(400).json({
          message: "Bad Request",
        });
        return;
      }
      if (res) {
        const resData = {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          account_created: user.createdAt,
          account_updated: user.updatedAt,
        };

        response.status(200).json(resData);
      } else {
        response.status(401).json({
          message: "Oops! Unauthorized Access",
        });
      }
    });
  } catch (error) {
    setErrorResponse(error, response);
  }
};

export const update = async (request, response) => {
  try {
    const id = request.params.id;
    const authCredentials = auth(request, response);

    if (!authCredentials) {
      return;
    }

    const user = await userService.getUser(id);
    if (!user) {
      response.status(404).json({
        message: "User not found!",
      });
      return;
    }

    if (authCredentials && authCredentials.email != user.username) {
      response.status(401).json({
        message: "Oops! Unauthorized Access.",
      });
      return;
    }
    bcrypt.compare(
      authCredentials.password,
      user.password,
      async (err, res) => {
        if (err) {
          response.status(400).json({
            message: "Bad Request",
          });
          return;
        }
        if (res) {
          if (
            "updatedAt" in request.body ||
            "username" in request.body ||
            "id" in request.body ||
            "createdAt" in request.body
          ) {
            response.status(400).json({
              message: "Bad Request",
            });
            return;
          }
          const updated = {
            ...request.body,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          };
          updated.id = id;
          console.log("Request Body: " + JSON.stringify(updated));
          if (updated.password) {
            if (schema.validate(updated.password)) {
              const newEncryptedPwd = await bcrypt.hash(updated.password, 10);
              updated.password = newEncryptedPwd;
            } else {
              response.status(401).send({
                message: "Invalid Password!",
              });
              return;
            }
          }
          const data = await userService.updateUser(updated);
          const updatedUserObj = {
            id: data[1].id,
            firstName: data[1].firstName,
            lastName: data[1].lastName,
            username: data[1].username,
            account_created: data[1].createdAt,
            account_updated: data[1].updatedAt,
          };

          response.status(204).json(updatedUserObj);
          return;
        } else {
          response.status(401).json({
            message: "Oops! UnAuthorized Access",
          });
        }
      }
    );
  } catch (error) {
    console.log(error);
    setErrorResponse(error, response);
  }
};
