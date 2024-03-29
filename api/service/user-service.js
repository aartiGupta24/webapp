import connect from "../db.connect.js";
import bcrypt from 'bcrypt';

export const createUser = async (user) => {
  const db = connect();

  let data = {};
  try {

    var encryptedPwd = await bcrypt.hash(user.password, 10);
    user.password = encryptedPwd;
    data = await db.users.create(user);

    return {
      id: data.id,
      first_name: data.first_name,
      last_name: data.last_name,
      username: data.username,
      account_created: data.account_created,
      account_updated: data.account_updated,
    };
  } catch (err) {
    console.log("Error: " + err);
    throw new Error(err);
  }
};

export const getUser = async (id) => {
  const db = connect();

  let data = {};
  try {
    data = await db.users.findOne({
      raw: true,
      where: {
        id: id
      }
    });
    return data;
  } catch (err) {
    console.log(err);
  }
}

export const getUserByUsername = async (username) => {
  const db = connect();

  let data = {};
  try {
    data = await db.users.findOne({
      raw: true,
      where: {
        username 
      }
    });
    return data;
  } catch (err) {
    console.log(err);
  }
}

export const updateUser = async (updatedUser) => {
  const db = connect();

  let data = {};
  try {
    data = await db.users.update(updatedUser, {
      raw: true,
      where: {
        id: updatedUser.id
      },
      returning: true,
      plain: true
    });
    return data;
  } catch (err) {
    console.log(err);
  }
}