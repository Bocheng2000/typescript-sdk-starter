/* eslint-disable default-case */
import { DirectSecp256k1HdWallet, makeSignDoc } from '@cosmjs/proto-signing';
import { SigningStargateClient } from '@cosmjs/stargate';
import { Readable } from 'stream';
import EncryptUtils from './EncryptUtils';

// const crypto = require('crypto');
// const ecc = require('eccrypto-js');

class ChatUtils {
  private static address = '';

  private static mnemonic = '';

  private static txId = '';

  private static chatQueue = [];

  private static isChatinging = false;

  static requestTransfer(address: string) {
    return `receive${address}`;
  }

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
  }

  static async requestSignData() {
    await EncryptUtils.generateKey();
    const data = 'helloworld';
    const signData = EncryptUtils.signData(data);
    return signData;
  }

  static requestChatQueue(readableStream: Readable, agendUrl: string, question: string) {
    console.log('this.chatQueue: ', this.chatQueue);
    console.log('this.chatQueue.length: ', this.chatQueue.length);
    this.isChatinging = true;
    const ws = new WebSocket(agendUrl);
    let chatSeq = 0;
    ws.addEventListener('open', async () => {
      console.log('11111111');
      if (ws.readyState === 1) {
        console.log('22222222');
        const signData = await EncryptUtils.signData('ack'); // 签名
        ws.send(JSON.stringify({ chat_seq: chatSeq, qn: question, signature_question: signData }));
      }
    });
    console.log('ws.readyState: ', ws.readyState);
    ws.onmessage = async (event) => {
      console.log('event.data: ', event);
      if (event?.data === 'DONE') {
        ws.close();
      } else if (event?.data !== 'ack') {
        readableStream.push({
          code: 200,
          message: event.data,
        });
        // 签名回传
        const signData = await EncryptUtils.signData(event.data);
        chatSeq += 1;
        console.log('signData: ', signData);
        ws.send(
          JSON.stringify({
            chat_seq: chatSeq,
            total_payment: { amount: '1', denom: 'CNY' },
            signature_question: signData,
          }),
        );
      }
    };
    ws.onclose = () => {
      console.log('onclose');
      readableStream.push(null); // 结束数据流
      this.isChatinging = false;
      if (this.chatQueue.length > 0) {
        const {
          readableStream: nextReadableStream,
          agendUrl: nextAgendUrl,
          question: nextQuestion,
        } = this.chatQueue.shift(); // 取出队列中的下一个
        this.requestChatQueue(nextReadableStream, nextAgendUrl, nextQuestion); // 递归调用
      }
    };
    ws.onopen = () => {
      console.log('onopen');
    };
  }

  static requestChat(agendUrl: string, question: string) {
    console.log('params: ', agendUrl, question);
    return new Promise((resolve, reject) => {
      // 查询 txId 的执行结果,确保已经 lock balance
      if (!agendUrl || !question) {
        reject(new Error('agendUrl or question is null'));
      } else {
        const readableStream = new Readable({ objectMode: true });
        // eslint-disable-next-line no-underscore-dangle, @typescript-eslint/no-empty-function
        readableStream._read = () => {};
        resolve(readableStream);
        const requestOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer glpat-D_bNazzQdYiUCsxWdz4y`,
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'user',
                content: question,
              },
            ],
            model: 'gpt-3.5-turbo',
            stream: true,
          }),
        };
        // 模拟产生数据流的过程
        // let count = 0;
        // const interval = setInterval(() => {
        //   if (count < 100) {
        //     readableStream.push({
        //       message: `${question} answer: ${count}`,
        //     });
        //     count += 1;
        //   } else {
        //     clearInterval(interval);
        //     readableStream.push(null); // 结束数据流
        //   }
        // }, 1000);

        // agend websocket
        if (this.isChatinging) {
          this.chatQueue.push({ readableStream, agendUrl, question });
        } else {
          this.requestChatQueue(readableStream, agendUrl, question);
        }
      }
    });
  }
}

export default ChatUtils;
