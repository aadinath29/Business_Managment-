const { AppError } = require('../../auth/errors/authErrors');
const { ERROR_CODES } = require('../constants/teamConstants');

class TeamNotFoundError extends AppError {
  constructor(message = 'Team not found or has been deleted') {
    super(message, 404, ERROR_CODES.TEAM_NOT_FOUND);
  }
}

class TeamLeaderNotFoundError extends AppError {
  constructor(message = 'Team Leader not found or has been deleted') {
    super(message, 404, ERROR_CODES.TEAM_LEADER_NOT_FOUND);
  }
}

class DeveloperNotFoundError extends AppError {
  constructor(message = 'Developer not found or has been deleted') {
    super(message, 404, ERROR_CODES.DEVELOPER_NOT_FOUND);
  }
}

class DuplicateTeamNameError extends AppError {
  constructor(message = 'A team with this team name already exists under the tenant') {
    super(message, 409, ERROR_CODES.DUPLICATE_TEAM_NAME);
  }
}

class DuplicateEmployeeIdError extends AppError {
  constructor(message = 'Employee ID is already taken') {
    super(message, 409, ERROR_CODES.DUPLICATE_EMPLOYEE_ID);
  }
}

class BranchMismatchError extends AppError {
  constructor(message = 'Developer must belong to the same branch as the team') {
    super(message, 400, ERROR_CODES.BRANCH_MISMATCH);
  }
}

module.exports = {
  TeamNotFoundError,
  TeamLeaderNotFoundError,
  DeveloperNotFoundError,
  DuplicateTeamNameError,
  DuplicateEmployeeIdError,
  BranchMismatchError
};
