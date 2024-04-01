import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';

class ChatUtils {
  private static address = '';

  private static mnemonic = '';

  static requestTransfer(address: string) {
    return `receive${address}`;
  }

  // 本地生成随机公私钥
  private static gengrateKey() {
    return new Promise<void>((resove, reject) => {
      DirectSecp256k1HdWallet.generate(24)
        .then((wallet) => {
          wallet
            .getAccounts()
            .then((accounts) => {
              this.address = accounts[0].address;
              this.mnemonic = wallet.mnemonic;
              resove();
            })
            .catch((error) => {
              reject(error);
            });
        })
        .catch((error) => {
          reject(error);
        });
    });
    // DirectSecp256k1HdWallet.generate(24)
    //   .then((wallet) => {
    //     wallet.getAccounts().then((accounts) => {
    //       this.address = accounts[0].address;
    //       this.mnemonic = wallet.mnemonic;
    //       resove
    //     }).catch((error) => {

    //     });
    //   })
    //   .catch((error) => {

    //   });
    // const wallet: DirectSecp256k1HdWallet = await DirectSecp256k1HdWallet.generate(24);
    // console.log('Mnemonic: ', wallet.mnemonic);
    // // process.stdout.write(wallet.mnemonic)
    // const accounts = await wallet.getAccounts();
    // console.log('Address: ', accounts[0].address);
    // return {
    //   address: accounts[0].address,
    //   mnemonic: wallet.mnemonic,
    // };
  }

  static requestChat() {
    return new Promise((resolve, reject) => {
      this.gengrateKey()
        .then(() => {
          resolve({
            signData: this.address + this.mnemonic,
          });
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  // 发起签名
  // 发送签名结果给 DApp,等待回调结果
  // 获取 DApp 返回的合约调用成功结果
}

export default ChatUtils;
