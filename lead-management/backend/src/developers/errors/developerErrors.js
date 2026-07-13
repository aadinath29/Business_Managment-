const { AppError } = require('../../auth/errors/authErrors');
const { ERROR_CODES } = require('../constants/developerConstants');

class DeveloperNotFoundError extends AppError {
  constructor(message = 'Developer profile not found or has been deleted') {
    super(message, 404, ERROR_CODES.DEVELOPER_NOT_FOUND);
  }
}

class DuplicateEmployeeIdError extends AppError {
  constructor(message = 'Employee ID is already taken') {
    super(message, 409, ERROR_CODES.DUPLICATE_EMPLOYEE_ID);
  }
}

class TeamNotFoundError extends AppError {
  constructor(message = 'Assigned team not found or has been deleted') {
    super(message, 404, ERROR_CODES.TEAM_NOT_FOUND);
  }
}

class BranchMismatchError extends AppError {
  constructor(message = 'Developer branch does not match target team branch') {
    super(message, 400, ERROR_CODES.BRANCH_MISMATCH);
  }
}

module.exports = {
  DeveloperNotFoundError,
  DuplicateEmployeeIdError,
  TeamNotFoundError,
  BranchMismatchError
};
