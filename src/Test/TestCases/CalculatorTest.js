const HotPocket = require('hotpocket-js-client');
const { assertEqual, assertSuccessResponse, assertErrorResponse } = require('../test-utils');

async function runCalculatorTests() {
  const servers = ['wss://localhost:8081'];
  const userKeyPair = await HotPocket.generateKeys();
  const client = await HotPocket.createClient(servers, userKeyPair);

  if (!(await client.connect())) throw new Error('Connection failed');

  async function sendJSON(payload) {
    const buf = Buffer.from(JSON.stringify(payload));
    return new Promise((resolve, reject) => {
      client.submitContractInput(buf).then((input) => {
        input?.submissionStatus.then((s) => {
          if (s.status !== 'accepted') reject(new Error('Ledger rejection'));
        });
      });
      client.once(HotPocket.events.contractOutput, (res) => {
        try {
          const out = JSON.parse(res.outputs[0].toString());
          resolve(out);
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  // Add
  let resp = await sendJSON({ Service: 'Calculator', Action: 'Add', data: { a: 2, b: 3 } });
  assertSuccessResponse(resp);
  assertEqual('add', resp.success.result, 5);

  // Subtract
  resp = await sendJSON({ Service: 'Calculator', Action: 'Subtract', data: { a: 10, b: 4 } });
  assertSuccessResponse(resp);
  assertEqual('subtract', resp.success.result, 6);

  // Multiply
  resp = await sendJSON({ Service: 'Calculator', Action: 'Multiply', data: { a: 7, b: 6 } });
  assertSuccessResponse(resp);
  assertEqual('multiply', resp.success.result, 42);

  // Divide
  resp = await sendJSON({ Service: 'Calculator', Action: 'Divide', data: { a: 20, b: 4 } });
  assertSuccessResponse(resp);
  assertEqual('divide', resp.success.result, 5);

  // Divide by zero
  resp = await sendJSON({ Service: 'Calculator', Action: 'Divide', data: { a: 1, b: 0 } });
  assertErrorResponse(resp);
}

module.exports = { runCalculatorTests };
