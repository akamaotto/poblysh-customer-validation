use base64::{engine::general_purpose, Engine as _};
use ring::aead::{self, Aad, LessSafeKey, Nonce, UnboundKey};
use ring::rand::{SecureRandom, SystemRandom};
use std::env;

pub struct EncryptionService {
    key: LessSafeKey,
}

impl EncryptionService {
    pub fn new() -> Self {
        let key_bytes = Self::get_key_bytes();
        let unbound_key =
            UnboundKey::new(&aead::AES_256_GCM, &key_bytes).expect("Failed to create unbound key");
        let key = LessSafeKey::new(unbound_key);
        Self { key }
    }

    fn get_key_bytes() -> [u8; 32] {
        let key_str = env::var("ENCRYPTION_KEY").expect("ENCRYPTION_KEY must be set");
        let decoded = hex::decode(key_str).expect("Failed to decode ENCRYPTION_KEY hex");
        let mut key_bytes = [0u8; 32];
        key_bytes.copy_from_slice(&decoded);
        key_bytes
    }

    pub fn encrypt(&self, plaintext: &str) -> (String, String) {
        let rng = SystemRandom::new();
        let mut nonce_bytes = [0u8; 12];
        rng.fill(&mut nonce_bytes)
            .expect("Failed to generate nonce");

        let nonce = Nonce::try_assume_unique_for_key(&nonce_bytes).expect("Failed to create nonce");

        let mut in_out = plaintext.as_bytes().to_vec();

        self.key
            .seal_in_place_append_tag(nonce, Aad::empty(), &mut in_out)
            .expect("Encryption failed");

        (
            general_purpose::STANDARD.encode(in_out),
            general_purpose::STANDARD.encode(nonce_bytes),
        )
    }

    pub fn decrypt(&self, ciphertext_base64: &str, nonce_base64: &str) -> Result<String, String> {
        let mut in_out = general_purpose::STANDARD
            .decode(ciphertext_base64)
            .map_err(|e| format!("Base64 decode error: {}", e))?;

        let nonce_bytes = general_purpose::STANDARD
            .decode(nonce_base64)
            .map_err(|e| format!("Base64 decode error: {}", e))?;

        let nonce = Nonce::try_assume_unique_for_key(&nonce_bytes)
            .map_err(|_| "Invalid nonce".to_string())?;

        let plaintext = self
            .key
            .open_in_place(nonce, Aad::empty(), &mut in_out)
            .map_err(|_| "Decryption failed".to_string())?;

        String::from_utf8(plaintext.to_vec()).map_err(|e| format!("UTF-8 error: {}", e))
    }
}
