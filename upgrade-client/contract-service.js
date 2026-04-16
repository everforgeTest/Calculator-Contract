const HotPocket = require('hotpocket-js-client');
const bson = require('bson');

class ContractService {
  constructor(servers) {
    this.servers = servers;
    this.userKeyPair = null;
    this.client = null;
    this.isConnectionSucceeded = false;
    this.promiseMap = new Map();
  }

  async init() {
    if (this.userKeyPair == null) {
      this.userKeyPair = await HotPocket.generateKeys();
    }
    if (this.client == null) {
      this.client = await HotPocket.createClient(this.servers, this.userKeyPair, {
        protocol: HotPocket.protocols.bson
      });
    }

    this.client.on(HotPocket.events.disconnect, () => {
      this.isConnectionSucceeded = false;
    });

    this.client.on(HotPocket.events.connectionChange, (server, action) => {
      console.log(server + ' ' + action);
    });

    this.client.on(HotPocket.events.contractOutput, (r) => {
      r.outputs.forEach((o) => {
        const output = bson.deserialize(o);
        const pId = output.promiseId;
        if (output.error) this.promiseMap.get(pId)?.rejecter(output.error);
        else this.promiseMap.get(pId)?.resolver(output.success || output);
        this.promiseMap.delete(pId);
      });
    });

    if (!this.isConnectionSucceeded) {
      if (!(await this.client.connect())) {
        console.log('Connection failed.');
        return false;
      }
      console.log('HotPocket Connected.');
      this.isConnectionSucceeded = true;
    }
    return true;
  }

  async signBuffer(buffer) {
    // Use libsodium-wrappers from the hotpocket-js-client dependency tree to sign (Ed25519 detached)
    const sodium = require('hotpocket-js-client/node_modules/libsodium-wrappers');
    await sodium.ready;
    const sig = sodium.crypto_sign_detached(new Uint8Array(buffer), new Uint8Array(this.userKeyPair.privateKey));
    return Buffer.from(sig).toString('hex');
  }

  submitInputToContract(inp) {
    const promiseId = this._getUniqueId();
    const inpBin = bson.serialize({ promiseId: promiseId, ...inp });

    this.client.submitContractInput(inpBin).then((input) => {
      input?.submissionStatus.then((s) => {
        if (s.status !== 'accepted') throw new Error(`Ledger_Rejection: ${s.reason}`);
      });
    });

    return new Promise((resolve, reject) => {
      this.promiseMap.set(promiseId, { resolver: resolve, rejecter: reject });
    });
  }

  _getUniqueId() {
    const crypto = require('crypto');
    const randomBytes = crypto.randomBytes(10);
    return randomBytes.toString('hex');
  }
}

module.exports = ContractService;
