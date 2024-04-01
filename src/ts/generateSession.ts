class generateSession {
  constructor(public address: string) {
    this.address = address;
  }

  static generateSessionData(address: string) {
    const signData1 = 'signData1';
    const signData2 = 'signData2';
    return address + signData1 + signData2;
  }
}

export default generateSession;
