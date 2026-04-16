const nacl = require('tweetnacl');
const { UpgradeService } = require('../Services/Common.Services/Upgrade.Service');
const { loadEnv } = require('../Utils/Env');

function isMaintainer(userPubKeyHex) {
  const envKey = (process.env.MAINTAINER_PUBKEY || '').trim();
  if (!envKey) return false;
  return (userPubKeyHex || '').toLowerCase() === envKey.toLowerCase();
}

class UpgradeController {
  constructor(ctx, user, message) {
    this.ctx = ctx;
    this.user = user;
    this.message = message;
    this.service = new UpgradeService(ctx, message);
  }

  static _hexToUint8(hex) {
    const m = hex.match(/[0-9a-fA-F]{2}/g) || [];
    const arr = new Uint8Array(m.map((b) => parseInt(b, 16)));
    return arr;
  }

  async handleRequest() {
    loadEnv();
    try {
      const userPubKeyHex = this.user.publicKey || this.user.pubKey || '';
      if (!isMaintainer(userPubKeyHex)) {
        return { error: { code: 401, message: 'Unauthorized' } };
      }

      const payload = this.message.data || {};
      const version = Number(payload.version);
      const description = payload.description || '';
      const zipBase64 = payload.zipBase64;
      const signatureHex = payload.zipSignatureHex;

      if (!zipBase64 || !signatureHex || Number.isNaN(version)) {
        return { error: { code: 400, message: 'Invalid upgrade payload.' } };
      }

      const zipBuffer = Buffer.from(zipBase64, 'base64');
      const sigUint8 = UpgradeController._hexToUint8(signatureHex);
      const pubUint8 = UpgradeController._hexToUint8(userPubKeyHex);

      const verified = nacl.sign.detached.verify(new Uint8Array(zipBuffer), sigUint8, pubUint8);
      if (!verified) {
        return { error: { code: 401, message: 'Signature verification failed.' } };
      }

      const res = await this.service.upgradeContract({ zipBuffer, version, description });
      return res;
    } catch (e) {
      return { error: { code: 500, message: e.message || 'Upgrade failed.' } };
    }
  }
}

module.exports = { UpgradeController };
