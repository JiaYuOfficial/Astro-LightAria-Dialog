import { createCipheriv, pbkdf2Sync, randomBytes } from 'node:crypto';
import { PBKDF2_ITERATIONS, SALT_LEN, IV_LEN, TAG_LEN, KEY_LEN } from './crypto-params';

/**
 * 把明文加密为可安全嵌入 HTML 属性的 base64 字符串。
 * 线路格式：base64( salt(16) || iv(12) || authTag(16) || ciphertext )
 *
 * salt / iv 使用随机值（而非由密码推导的确定性值）：
 * 同一个密码下修改正文重新构建，若复用 IV 会导致 GCM nonce 复用，
 * 攻击者可 XOR 两份密文得到明文异或、并恢复认证密钥 H。随机化从根上避免该风险。
 */
export function encryptPayload(plaintext: string, password: string): string {
  const salt = randomBytes(SALT_LEN);
  const iv = randomBytes(IV_LEN);
  const key = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LEN, 'sha256');
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([salt, iv, authTag, ciphertext]).toString('base64');
}
