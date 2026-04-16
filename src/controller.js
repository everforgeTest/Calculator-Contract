const { CalculatorController } = require('./Controllers/Calculator.Controller');
const { UpgradeController } = require('./Controllers/Upgrade.Controller');
const bson = require('bson');

class Controller {
  constructor(ctx) {
    this.ctx = ctx;
  }

  async handleRequest(user, message, isReadOnly) {
    let result = {};
    try {
      const service = message.Service || message.service || '';
      if (service.toLowerCase() === 'upgrade') {
        const upgradeController = new UpgradeController(this.ctx, user, message);
        result = await upgradeController.handleRequest();
      } else if (service.toLowerCase() === 'calculator') {
        const calcController = new CalculatorController(message);
        result = await calcController.handleRequest();
      } else {
        result = { error: { code: 400, message: 'Invalid service.' } };
      }
    } catch (e) {
      result = { error: { code: 500, message: e.message || 'Internal error.' } };
    }

    if (isReadOnly) {
      await this.sendOutput(user, result);
    } else {
      const payload = message.promiseId ? { promiseId: message.promiseId, ...result } : result;
      await this.sendOutput(user, payload);
    }
  }

  async sendOutput(user, response) {
    try {
      if (this.ctx.userProtocol === 'bson') {
        await user.send(bson.serialize(response));
      } else {
        await user.send(Buffer.from(JSON.stringify(response)));
      }
    } catch (e) {
      // swallow
    }
  }
}

module.exports = { Controller };
