// eslint-disable-next-line import/no-extraneous-dependencies
import * as ecc from 'eosjs-ecc';
// eslint-disable-next-line import/no-extraneous-dependencies
import * as hash from 'eosjs-ecc/lib/hash';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Evaluate, ProofHoHash } from '@idena/vrf-js';
// eslint-disable-next-line import/no-extraneous-dependencies
import * as elliptic from 'elliptic';

class EncryUtils {
  private static privateKey;

  private static publicKey;

  static async generateKey() {
    if (this.privateKey && this.publicKey) {
      return { privateKey: this.privateKey, publicKey: this.publicKey };
    }

    const privateKey = await ecc.PrivateKey.randomKey();
    const publicKey = await privateKey.toPublic();

    this.privateKey = privateKey;
    this.publicKey = publicKey;

    return {
      privateKey,
      publicKey,
    };
  }

  static async signData(data: string) {
    if (!this.privateKey || !this.publicKey) {
      return '请重新发起签名';
    }
    const dataHash = await hash.sha256(data, 'hex');
    // console.log('this.privateKey: ', this.privateKey.toBuffer().toString('hex'));
    // console.log('this.publicKey: ', this.publicKey.toUncompressed().toBuffer().toString('hex'));
    // console.log('data_hash:', dataHash);
    const signature = await ecc.Signature.signHash(dataHash, this.privateKey).toHex();
    // console.log('signature:', signature);
    return signature;
  }

  static generateProof(sk, data) {
    return Evaluate(sk, data);
  }

  static verifyProof(pk, data, proof) {
    return ProofHoHash(pk, data, proof);
  }

  static testVrf() {
    // eslint-disable-next-line new-cap
    const EC = new elliptic.ec('secp256k1');
    const data = [1, 2, 3, 4, 5]; // data
    console.log('the data is:', Buffer.from(data).toString('hex'));
    const key = EC.genKeyPair();
    console.warn('the private key is:', Buffer.from(key.getPrivate().toArray()).toString('hex'));
    console.warn('the public key is:', key.getPublic().encode('hex', true));
    // eslint-disable-next-line no-shadow
    const [hash, proof] = this.generateProof(key.getPrivate().toArray(), data);
    console.log('the hash is:', Buffer.from(hash).toString('hex'));
    console.log('the proof is:', Buffer.from(proof).toString('hex'));
    const recoverHash = this.verifyProof(key.getPublic(), data, proof);
    console.log('recover_hash:', Buffer.from(recoverHash).toString('hex'));
  }
}

export default EncryUtils;
