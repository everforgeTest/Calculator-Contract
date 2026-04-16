const { CalculatorService } = require('../Services/Domain.Services/Calculator.Service');

class CalculatorController {
  constructor(message) {
    this.message = message;
    this.service = new CalculatorService();
  }

  _parseNumbers(obj) {
    const a = Number(obj.a);
    const b = Number(obj.b);
    if (Number.isNaN(a) || Number.isNaN(b)) throw new Error('Invalid operands');
    return { a, b };
  }

  async handleRequest() {
    const action = (this.message.Action || '').toLowerCase();
    const data = this.message.data || {};

    try {
      switch (action) {
        case 'add': {
          const { a, b } = this._parseNumbers(data);
          const result = await this.service.add(a, b);
          return { success: { result } };
        }
        case 'subtract': {
          const { a, b } = this._parseNumbers(data);
          const result = await this.service.subtract(a, b);
          return { success: { result } };
        }
        case 'multiply': {
          const { a, b } = this._parseNumbers(data);
          const result = await this.service.multiply(a, b);
          return { success: { result } };
        }
        case 'divide': {
          const { a, b } = this._parseNumbers(data);
          const result = await this.service.divide(a, b);
          return { success: { result } };
        }
        case 'history': {
          const page = Number(data.page || 1);
          const perPage = Number(data.perPage || 20);
          const res = await this.service.history(page, perPage);
          return { success: res };
        }
        default:
          return { error: { code: 400, message: 'Invalid action.' } };
      }
    } catch (err) {
      return { error: { code: 400, message: err.message || 'Invalid request.' } };
    }
  }
}

module.exports = { CalculatorController };
