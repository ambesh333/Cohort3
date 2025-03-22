import express,{  Request, Response } from 'express';
import { userModel } from './model';
import { Keypair, PublicKey,Connection, Transaction ,VersionedTransaction} from '@solana/web3.js';
import jwt from "jsonwebtoken";
import dotenv from "dotenv"
import { Buffer } from 'buffer'; 
import bs58 from "bs58"
import cors from "cors"
dotenv.config()

const app = express();
app.use(express.json())
app.use(cors())

if (!process.env.RPC) {
    console.error("Environment variable RPC is not defined.");
  } else {
    console.log("RPC endpoint:", process.env.RPC);
  }
  
const connection = new Connection(process.env.RPC || "");
  

app.post("/api/v1/signup", async (req: Request, res: Response): Promise<void> => {
    const username = req.body.username;
    const password = req.body.password;

    const secret = process.env.JWTSECRET;
    if (!secret) {
        res.status(500).json({ message: "JWT secret not found in environment variables" });
        return;
    }

    try {
        const existingUser = await userModel.findOne({ username: username });
        if (existingUser) {
            const token = jwt.sign(
                { id: existingUser._id },
                secret
            );
            res.json({
                message: "User already exists",
                token: token,
                publicKey: existingUser.publicKey
            });
            return;
        }

        const keypair = new Keypair();
        const privateKey = Buffer.from(keypair.secretKey).toString('base64');
        const publicKey = keypair.publicKey.toString();

        const newUser = await userModel.create({
            username: username,
            password: password,
            privateKey: privateKey,
            publicKey: publicKey
        });

        const token = jwt.sign(
            { id: newUser._id },
            secret
        );

        res.json({
            message: "Signup successful",
            token: token,
            PublicKey: publicKey
        });
    } catch (error: any) {
        console.error("Error saving user:", error);
        res.status(400).json({
            message: "Validation error",
            error: error.message
        });
    }
});

app.post("/api/v1/signin", async (req: Request, res: Response): Promise<void> => {
    const username = req.body.username;
    const password = req.body.password;  

    const secret = process.env.JWTSECRET
    if(!secret) (
        res.json({
            message:"secret not found"
        })
    )
    try {
        const user = await userModel.findOne({
            username: username,
            password: password,
        });
        console.log(user)

        if (user && secret) {
            const token = jwt.sign(
                { id: user._id },
                secret
            );
            res.json({
                message: "Login successful",
                token: token,
                PublicKey: user.publicKey
            });
            return;
        }

        res.status(401).json({
            message: "Invalid username or password"
        });
    } catch (error:any) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
});

app.post("/api/v1/txn/sign",async (req:Request,res:Response):Promise<void>=>{
    const serializedTransaction = req.body.message;
    const token = req.body.token;
    const secret = process.env.JWTSECRET;

    console.log("serializedTransaction",serializedTransaction,"token",token,"secret",secret)
    if (!secret) {
        res.status(500).json({ message: "JWT secret not found in environment variables" });
        return;
    }
    const decoded = jwt.verify(token, secret) as { id: string };
    const user = await userModel.findById(decoded.id);

    if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
    }
    const publicKey=  user.publicKey
    const privateKey = user.privateKey
    
    console.log(user,publicKey)

    const tx = Transaction.from(Buffer.from(serializedTransaction, 'base64'));

    const {blockhash} = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = new PublicKey(publicKey);

    const keypair = Keypair.fromSecretKey(
        Uint8Array.from(Buffer.from(privateKey, 'base64'))
      );

    tx.sign(keypair)

    const signature = await connection.sendTransaction(tx,[keypair]);
    console.log(signature)
    res.json({
        message:"Sign txn"
    })
})

app.get("/api/v1/txn",(req:Request,res:Response):void=>{
    res.json({
        message:"Txn"
    })
})

app.listen(3001)