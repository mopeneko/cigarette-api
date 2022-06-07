import { Controller, Get } from '@nestjs/common';
import { Account, Address, Deadline, Mosaic, MosaicId, NetworkType, PlainMessage, RepositoryFactoryHttp, TransferTransaction, UInt64 } from 'symbol-sdk';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async get() {
    const privateKey = process.env.PRIVATE_KEY;
    const address = Address.createFromRawAddress(process.env.ADDRESS);
    const mosaicID = new MosaicId('606F8854012B0C0F');
    const amount = 1;

    const repositoryFactory = new RepositoryFactoryHttp('https://01.symbol-blockchain.com:3001');
    const txRepo = repositoryFactory.createTransactionRepository();
    const netRepo = repositoryFactory.createNetworkRepository();

    let epockAdjustment = 0;
    let networkGenerationHash = '';

    await netRepo.
    getNetworkProperties().
    forEach((config) => {
      if (!config.network.epochAdjustment) {
        throw new Error('failed to get epockAdjustment');
      }
      epockAdjustment = Number(config.network.epochAdjustment.slice(0, -1));
      networkGenerationHash = config.network.generationHashSeed;
    });

    const tx = TransferTransaction.create(
      Deadline.create(epockAdjustment),
      address,
      [new Mosaic(mosaicID, UInt64.fromUint(amount))],
      PlainMessage.create('cigarette:smoked'),
      NetworkType.MAIN_NET,
      UInt64.fromUint(100000),
    );

    const account = Account.createFromPrivateKey(privateKey, NetworkType.MAIN_NET);
    const signedTransaction = account.sign(tx, networkGenerationHash);

    txRepo.announce(signedTransaction);
  }
}
