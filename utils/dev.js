const { owners } = require("../config.json");

module.exports = function isOwner(userId) {
  return owners.includes(userId);
};
