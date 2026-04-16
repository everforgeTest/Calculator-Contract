function assertEqual(name, a, b) {
  if (a !== b) throw new Error(`${name} expected ${b} but got ${a}`);
}

function assertSuccessResponse(resp) {
  if (!resp || typeof resp !== 'object' || !('success' in resp)) {
    throw new Error('Expected success response');
  }
}

function assertErrorResponse(resp) {
  if (!resp || typeof resp !== 'object' || !('error' in resp)) {
    throw new Error('Expected error response');
  }
}

module.exports = { assertEqual, assertSuccessResponse, assertErrorResponse };
