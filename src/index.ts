import ChatUtils from './ts/ChatUtils';
import generateSession from './ts/generateSession';

class LibraryStarter {
  public id: string;

  public url: string;

  constructor(options: any) {
    this.id = options.id;
    this.url = options.url;
  }

  getConfig() {
    return {
      id: this.id,
      url: this.url,
    };
  }
}

// 生成公私钥
// 发起合约调用请求
export { generateSession, ChatUtils };
export default LibraryStarter;
