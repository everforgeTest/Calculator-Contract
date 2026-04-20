const HotPocket = require('hotpocket-nodejs-contract');
const { DBInitializer } = require('./Data.Deploy/initDB');
const { Controller } = require('./controller');
const bson = require('bson');

const calculatorContract = async (ctx) => {
  console.log('Calculator contract is running.');
//sdgdfh
//fdgdfgfh
  const isReadOnly = ctx.readonly;

  try {
    await DBInitializer.init();
  } catch (e) {
    console.error('DB init error:', e);
  }

  const controller = new Controller(ctx);

  // Determine user protocol for outputs (JSON default unless input is BSON)
  ctx.userProtocol = HotPocket.clientProtocols.JSON;

  for (const user of ctx.users.list()) {
    for (const input of user.inputs) {
      const buf = await ctx.users.read(input);
      let message = null;
      try {
        message = JSON.parse(buf);
        ctx.userProtocol = 'json';
      } catch (e) {
        try {
          message = bson.deserialize(buf);
          ctx.userProtocol = 'bson';
        } catch (ex) {
          await user.send(Buffer.from(JSON.stringify({ error: { code: 400, message: 'Invalid input format.' } })));
          continue;
        }
      }

      if (message.Data && !message.data) message.data = message.Data;
      await controller.handleRequest(user, message, isReadOnly);
    }
  }
};

const hpc = new HotPocket.Contract();
hpc.init(calculatorContract, HotPocket.clientProtocols.JSON, true);
