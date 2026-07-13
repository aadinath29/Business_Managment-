const { AppError } = require('../../auth/errors/authErrors');
const { ERROR_CODES } = require('../constants/branchConstants');

class BranchNotFoundError extends AppError {
  constructor(message = 'Branch not found or has been deleted') {
    super(message, 404, ERROR_CODES.BRANCH_NOT_FOUND);
  }
}

class DuplicateBranchCodeError extends AppError {
  constructor(message = 'A branch with this branch code already exists') {
    super(message, 409, ERROR_CODES.DUPLICATE_BRANCH_CODE);
  }
}

module.exports = {
  BranchNotFoundError,
  DuplicateBranchCodeError
};
