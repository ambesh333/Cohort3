import React, { useState, useEffect } from 'react';
import { Transaction, Connection, PublicKey, SystemProgram, LAMPORTS_PER_SOL, VersionedTransaction } from '@solana/web3.js';
import axios from 'axios';
import Cookies from 'js-cookie';
import './App.css';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.RPC) {
  console.error("Environment variable RPC is not defined.");
} else {
  console.log("RPC endpoint:", process.env.RPC);
}

const connection = new Connection(process.env.RPC || "");

function App() {
  const [amount, setAmount] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [publicKey, setPublicKey] = useState<string>("");

  const storeToken = (token: string) => {
    Cookies.set('jwt', token, { expires: 1 }); 
  };

  // Helper: get token from cookies
  const getToken = (): string | undefined => Cookies.get('jwt');

  // Sign Up function
  async function signUp() {
    try {
      const response = await axios.post("http://localhost:3001/api/v1/signup", {
        username,
        password,
      });
      const { token, publicKey, message } = response.data;
      storeToken(token);
      setPublicKey(publicKey);
      setIsAuthenticated(true);
      console.log(message);
    } catch (error: any) {
      console.error("Signup error:", error.response?.data || error.message);
    }
  }

  // Sign In function
  async function signIn() {
    try {
      const response = await axios.post("http://localhost:3001/api/v1/signin", {
        username,
        password,
      });
      const { token, PublicKey, message } = response.data;
      storeToken(token);
      setPublicKey(PublicKey);
      setIsAuthenticated(true);
      console.log(message);
    } catch (error: any) {
      console.error("Signin error:", error.response?.data || error.message);
    }
  }

  async function sendSol() {
    const lamports = parseFloat(amount) * LAMPORTS_PER_SOL;
    if (isNaN(lamports) || lamports <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const fromPubkey = new PublicKey(publicKey || "8oc3zbXGJPaqxF1QJgawxZHiWrB9KCb7G9yHNwCoUoPZ");

    const ix = SystemProgram.transfer({
      fromPubkey: fromPubkey,
      toPubkey: new PublicKey("CEByFyavvxXMuDoftyRkjE1p1eNExEiEvG5v1YPkk4DS"),
      lamports: lamports,
    });

    // Create and configure transaction
    const tx = new Transaction().add(ix);
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = fromPubkey;

    // For VersionedTransaction, if needed, use appropriate serialization.
    const serializedTx = tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    const serializedTxBase64 = serializedTx.toString('base64');


    // Get token from cookies
    const token = getToken();
    if (!token) {
      alert("You must be signed in to send a transaction");
      return;
    }

    // Send the transaction and token to your backend for signing
    try {
      await axios.post("http://localhost:3001/api/v1/txn/sign", {
        message: serializedTxBase64,
        token,
      });
      alert("Transaction submitted");
    } catch (error: any) {
      console.error("Transaction error:", error.response?.data || error.message);
    }
  }

  return (
    <div className="App">
      <div className="auth">
        <h2>Authentication</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={signUp}>Sign Up</button>
        <button onClick={signIn}>Sign In</button>
      </div>
      {isAuthenticated && (
        <div className="transaction">
          <h2>Send SOL</h2>
          <input
            type="number"
            placeholder="Enter amount"
            className="amount-input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button className="send-button" onClick={sendSol}>
            Send
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
