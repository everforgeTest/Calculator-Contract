const { Tables } = require('../../Constants/Tables');
const settings = require('../../settings.json').settings;
const { SqliteDatabase } = require('../Common.Services/dbHandler');

class CalculatorService {
  constructor() {
    this._dbPath = settings.dbPath;
    this._db = new SqliteDatabase(this._dbPath);
  }

  _save(operation, a, b, result) {
    this._db.open();
    return this._db
      .insertValue(Tables.CALCULATION, {
        Operation: operation,
        OperandA: a,
        OperandB: b,
        Result: result
      })
      .finally(() => this._db.close());
  }

  async add(a, b) {
    const result = a + b;
    await this._save('Add', a, b, result);
    return result;
  }

  async subtract(a, b) {
    const result = a - b;
    await this._save('Subtract', a, b, result);
    return result;
  }

  async multiply(a, b) {
    const result = a * b;
    await this._save('Multiply', a, b, result);
    return result;
  }

  async divide(a, b) {
    if (b === 0) throw new Error('Division by zero');
    const result = a / b;
    await this._save('Divide', a, b, result);
    return result;
  }

  async history(page = 1, perPage = 20) {
    this._db.open();
    try {
      const rows = await this._db.runSelectQuery(`SELECT * FROM ${Tables.CALCULATION} ORDER BY Id DESC`);
      const start = (page - 1) * perPage;
      const end = start + perPage;
      const paged = rows.slice(start, end);
      return {
        data: paged,
        page,
        totalPages: Math.ceil(rows.length / perPage)
      };
    } finally {
      this._db.close();
    }
  }
}

module.exports = { CalculatorService };
