# **CryEnv 🔐 - Secure .env Surveys for Teams**

[![NPM Version](https://img.shields.io/npm/v/cryenv?style=flat-square)](https://www.npmjs.com/package/cryenv)
[![GitHub Stars](https://img.shields.io/github/stars/unbywyd/cryenv?style=flat-square)](https://github.com/unbywyd/cryenv/stargazers)
[![License: MIT](https://img.shields.io/github/license/unbywyd/cryenv?style=flat-square)](LICENSE)

### **Effortlessly collect & manage missing .env variables in a secure way.**

---

## **🔹 What is CryEnv?**

CryEnv is a **CLI tool** that helps teams **securely collect missing environment variables** by creating **interactive encrypted surveys**.

With CryEnv, you can:

- **Detect missing .env variables** in your project.
- **Create encrypted surveys** to request missing values.
- **Securely share a survey token** with a team member.
- **Import responses back** into your `.env` file.
- **Ensure only the creator can decrypt responses**.

✅ **Fast.**  
🔐 **Secure.**  
🛠️ **Easy to use.**

---

## **🔒 Security & Data Handling**

CryEnv is designed with **security and privacy** in mind. Here’s how data is handled:

### **Questions (Unencrypted)**

- Questions are **not encrypted** and are stored in **base64** format with **zlib compression**.
- **Do not include sensitive data in questions.** Use them only to describe what information is needed.
- Questions are used to guide the recipient and are not considered secret.

### **Answers (Encrypted)**

- Answers are **fully encrypted** using a combination of **AES-256-CBC** and **RSA**:
  1. Compressed with **zlib**.
  2. Encrypted with a randomly generated **AES-256 key**.
  3. The AES key is encrypted using the creator’s **RSA public key**.
  4. The final payload is encoded in **base64** for easy sharing.
- Only the **survey creator** can decrypt the answers using their private key.

### **Email Feature (Optional)**

- CryEnv can send survey links via email using `node-fetch` and a private server at **webto.pro**.
- **No sensitive data is sent or stored** on the server. Only the encrypted survey token is transmitted.
- Emails are used solely for convenience and are **not required**. You can share tokens manually.

### **Guarantees**

- **No data is stored** on external servers.
- **Emails are not saved** or shared with third parties.
- The email feature is **optional** and can be skipped if you prefer manual sharing.

---

## **🚀 Quick Start**

No installation required! Just use **npx**:

```sh
npx cryenv
```

This will guide you through **creating an encrypted survey** for missing environment variables.

To fill a survey:

```sh
npx cryenv --fill YOUR_TOKEN
```

To import responses into your `.env` file:

```sh
npx cryenv --import YOUR_TOKEN --path=.env
```

---

## **🔍 How It Works?**

1️⃣ **Create a survey** with missing `.env` keys.  
2️⃣ **Share the generated token** with a teammate.  
3️⃣ **The recipient fills the survey** via CLI.  
4️⃣ **Responses are securely encrypted** – only you can decrypt them.  
5️⃣ **Import the responses** directly into your `.env` file.

🔒 **All data remains private & secure** – even CryEnv cannot read the responses.

---

## **📦 Installation (Optional)**

You can install CryEnv globally:

```sh
npm install -g cryenv
```

Now you can use it without `npx`:

```sh
cryenv
```

---

## **🛠️ Commands & Usage**

### **1️⃣ Detect missing .env variables**

Automatically scan your `.env.example` or another file:

```sh
npx cryenv --env .env.example
```

This will create a survey with all missing variables.

---

### **2️⃣ Create a new survey**

```sh
npx cryenv
```

You'll be guided through an **interactive setup**.

---

### **3️⃣ Fill a survey (as a recipient)**

If someone shares a **CryEnv token** with you, fill it like this:

```sh
npx cryenv --fill YOUR_TOKEN
```

You'll be prompted to enter values.

---

### **4️⃣ Import responses into .env**

```sh
npx cryenv --import YOUR_TOKEN --path=.env
```

This will **decrypt responses** and add them to your `.env` file.

---

### **5️⃣ Restore a saved survey**

```sh
npx cryenv --restore FILE
```

Useful if you need to **re-import or review** responses.

---

## **🔐 How CryEnv Ensures Security?**

✔ **All responses are encrypted.**  
✔ **Only the survey creator can decrypt responses.**  
✔ **Survey tokens never expose raw data.**  
✔ **No external servers are used – works fully offline.**

---

## **💡 Example Workflow**

Imagine you're working on a team project. Some environment variables are missing, and you need your teammate to fill them securely.

1. **You create a survey** and get a unique token:

   ```sh
   npx cryenv --env .env.example
   ```

2. **You share the token** with a teammate:

   ```sh
   npx cryenv --fill YOUR_TOKEN
   ```

3. **They fill the survey** without seeing other values.

4. **You import their encrypted responses** into `.env`:
   ```sh
   npx cryenv --import YOUR_TOKEN --path=.env
   ```

🎉 **Done! Your `.env` file is now complete – securely.**

---

## **📜 License**

CryEnv is licensed under the **MIT License**.  
© 2025 [Unbywyd](https://unbywyd.com).

---

## **🔗 Links**

🔹 **NPM:** [CryEnv on NPM](https://www.npmjs.com/package/cryenv)  
🔹 **GitHub:** [CryEnv Repository](https://github.com/unbywyd/cryenv)  
🔹 **Issues:** [Report a bug](https://github.com/unbywyd/cryenv/issues)

---

### **🚀 Secure, fast, and efficient .env management for teams!**

Need more features? Open an issue or contribute on **GitHub**! 😊
