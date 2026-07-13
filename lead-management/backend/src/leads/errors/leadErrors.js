const { AppError } = require('../../auth/errors/authErrors');
const { ERROR_CODES } = require('../constants/leadConstants');

class LeadNotFoundError extends AppError {
  constructor(message = 'Lead not found or has been deleted') {
    super(message, 404, ERROR_CODES.LEAD_NOT_FOUND);
  }
}

class BranchNotFoundError extends AppError {
  constructor(message = 'Specified branch not found or has been deleted') {
    super(message, 404, ERROR_CODES.BRANCH_NOT_FOUND);
  }
}

class TeamNotFoundError extends AppError {
  constructor(message = 'Specified team not found or does not belong to the branch') {
    super(message, 404, ERROR_CODES.TEAM_NOT_FOUND);
  }
}

class InvalidTransitionError extends AppError {
  constructor(message = 'Invalid journey stage transition') {
    super(message, 400, ERROR_CODES.INVALID_TRANSITION);
  }
}

module.exports = {
  LeadNotFoundError,
  BranchNotFoundError,
  TeamNotFoundError,
  InvalidTransitionError
};
