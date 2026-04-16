const fs = require('fs');
const path = require('path');
const ContractService = require('./contract-service');

// Usage:
// node index.js <contractUrl> <zipFilePath> <privateKeyIgnored> <version> <description>

const contractUrl = process.argv[2];
const filepath = process.argv[3];
const _ignoredPrivKeyArg = process.argv[4];
const version = process.argv[5];
const description = process.argv[6] || '';

async function clientApp(contractUrl, filepath, version, description) {
  const contractService = new ContractService([contractUrl]);
  if (!(await contractService.init())) return;

  const fileName = path.basename(filepath);
  const fileContent = fs.readFileSync(filepath);
  const sizeKB = Math.round(fileContent.length / 1024);

  const signatureHex = await contractService.signBuffer(fileContent);
  const zipBase64 = fileContent.toString('base64');

  const submitData = {
    service: 'Upgrade',
    Action: 'UpgradeContract',
    data: {
      version: parseFloat(version),
      description: description,
      zipBase64: zipBase64,
      zipSignatureHex: signatureHex
    }
  };

  console.log(`Uploading the file ${fileName} ${sizeKB}KB`);
  contractService
    .submitInputToContract(submitData)
    .then((re) => {
      console.log('Contract update submission successful.', re);
    })
    .catch((reason) => {
      console.log('Contract update submission failed.', reason);
    })
    .finally(() => process.exit());
}

clientApp(contractUrl, filepath, version, description);
