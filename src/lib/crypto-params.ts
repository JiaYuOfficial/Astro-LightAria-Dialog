// 加密参数：构建期（Node crypto）与浏览器解密端（Web Crypto）必须完全一致，
// 故抽成零依赖模块，避免客户端误引入 node:crypto。
export const PBKDF2_ITERATIONS = 210000; // PBKDF2-HMAC-SHA256 迭代数（OWASP 建议值折中）
export const SALT_LEN = 16; // 盐长度（字节）
export const IV_LEN = 12; // GCM IV 长度（字节）
export const TAG_LEN = 16; // GCM 认证标签长度（字节）
export const KEY_LEN = 32; // AES-256 密钥长度（字节）
