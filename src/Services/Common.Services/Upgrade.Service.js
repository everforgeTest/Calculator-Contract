const fs = require('fs');
const settings = require('../../settings.json').settings;
const { SqliteDatabase } = require('./dbHandler');
const { Tables } = require('../../Constants/Tables');

class UpgradeService {
  constructor(ctx, message) {
    this.ctx = ctx;
    this.message = message;
    this._db = new SqliteDatabase(settings.dbPath);
  }

  async _getCurrentVersion() {
    this._db.open();
    try {
      const row = await this._db.getLastRecord(Tables.CONTRACTVERSION);
      return row && row.Version ? Number(row.Version) : 1.0;
    } finally {
      this._db.close();
    }
  }

  async _insertVersion(version, description) {
    this._db.open();
    try {
      const res = await this._db.insertValue(Tables.CONTRACTVERSION, {
        Version: version,
        Description: description
      });
      return res.lastId;
    } finally {
      this._db.close();
    }
  }

  async upgradeContract({ zipBuffer, version, description }) {
    const current = await this._getCurrentVersion();
    if (!(version > current)) {
      return { error: { code: 403, message: 'Incoming version must be greater than current version.' } };
    }

    try {
      fs.writeFileSync(settings.newContractZipFileName, zipBuffer);

      const shellScriptContent = `#!/bin/bash\
\
echo "Running post execution script"\
\
! command -v unzip &>/dev/null && apt-get update && apt-get install --no-install-recommends -y unzip\
\
zip_file=\"${settings.newContractZipFileName}\"\
\
unzip -o -d ./ \"$zip_file\" >>/dev/null\
\
echo \"Unzipped $zip_file to current directory.\"\
\
rm \"$zip_file\" >>/dev/null\
`;
      fs.writeFileSync(settings.postExecutionScriptName, shellScriptContent, { mode: 0o777 });

      const id = await this._insertVersion(version, description);
      return { success: { message: 'Contract upgrade recorded.', id } };
    } catch (e) {
      return { error: { code: 500, message: e.message || 'Failed to write upgrade artifacts.' } };
    }
  }
}

module.exports = { UpgradeService };
