/* eslint-disable default-case */
import { Readable } from 'stream';
import EncryptUtils from './EncryptUtils';

class ChatUtils {
  private static chatQueue = [];

  private static isChatinging = false;

  static async requestSignData() {
    await EncryptUtils.generateKey();
    // contract params
    const data = 'helloworld';
    const signData = EncryptUtils.signData(data);
    return signData;
  }

  static requestChatQueue(readableStream: Readable, agendUrl: string, question: string) {
    console.log('chatQueue: ', this.chatQueue);
    this.isChatinging = true;
    const ws = new WebSocket(agendUrl);
    let chatSeq = 0;
    ws.addEventListener('open', async () => {
      if (ws.readyState === 1) {
        const signData = await EncryptUtils.signData('ack'); // 签名
        ws.send(JSON.stringify({ chat_seq: chatSeq, qn: question, signature_question: signData }));
      }
    });
    ws.onmessage = async (event) => {
      if (event?.data === 'DONE') {
        ws.close();
      } else if (event?.data !== 'ack') {
        readableStream.push({
          code: 200,
          message: event.data,
        });
        // 签名回传
        await EncryptUtils.generateKey();
        const signData = await EncryptUtils.signData(event.data);
        if (signData) {
          chatSeq += 1;
          console.log('signData: ', signData);
          ws.send(
            JSON.stringify({
              chat_seq: chatSeq,
              total_payment: { amount: '1', denom: 'CNY' },
              signature_question: signData,
            }),
          );
        } else {
          // 签名
          readableStream.push({
            code: 201,
            message: 'Sign Expirded, Please Sign Again',
          });
        }
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
    return new Promise((resolve, reject) => {
      if (!agendUrl || !question) {
        reject(new Error('agendUrl or question is null'));
      } else {
        const readableStream = new Readable({ objectMode: true });
        // eslint-disable-next-line no-underscore-dangle, @typescript-eslint/no-empty-function
        readableStream._read = () => {};
        resolve(readableStream);
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
