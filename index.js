//import dependencies

import express from "express";
import cors from "cors";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

/*==========================================
Inisialisasi aplikasi
============================================*/

//deklasrasi variable di JS
//[const|Let] [nameVariable]=[value]
//[var] -->> tidak boleh dipake lagi karena fungsinya sudah digantikan oleh const/let di ES206.
//[var] --> global declaration (var namaOrang)
//
//[const]--> 1x declare, tidak bisa diubah-ubah lagi
//[let]--> 1x declare, tapi bisa diubah-ubah(re-assigment)

const app = express();
const upload = multer();

// inisialisasi object instance GoogleGenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
}); //instantiation object instance (OOP)

/* =========================================
penambahan path
========================================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/*==========================================
inisialisasi middleware
============================================*/
app.use(cors()); //inisialisasi CORES (Cross-Origin Resource Sharing) sebagai middleware
app.use(express.json());

/*==========================================
inisialisasi static directory
============================================*/
//express.static (rootDirectory,options)
app.use(express.static(path.join(__dirname, "static"))); //rootDirectory

/*==========================================
Helper: ekstrak teks dari response @google/genai
============================================*/
function extractText(aiResponse) {
  try {
    // ambil teks dari struktur candidates
    const parts =
      aiResponse?.candidates?.[0]?.content?.parts?.map((p) => p?.text || "") ||
      [];
    const combined = parts.join("").trim();
    if (combined) return combined;

    // fallback ke fungsi text() jika tersedia
    if (typeof aiResponse?.text === "function") {
      return aiResponse.text() || "";
    }

    // fallback ke properti text biasa
    if (typeof aiResponse?.text === "string") {
      return aiResponse.text;
    }

    return "";
  } catch {
    return "";
  }
}

/*==========================================
inisialisasi routing
============================================*/
//contoh app.get() , app.post(), dll -- get/post/put itu bagaian standart dari HTTP

//GET, PUT, POST, PATCH, DELETE, OPTIONS, HEAD
//
//secara penulisannua
//function biasa --> function namaFuction() {}
//[*] arrow function --> [const namaFunction = ] () => {}

//
//secara alurnya
//synchronous -- ()=> {}
//[*] asynchronous --> async () =>{}

app.post("/generate-text", upload.none(), async (req, res) => {
  //terima jeroaanya, lalu cek di disini

  const { prompt } = req.body || {}; //destructuring

  //guard clouse (kasarnya, satpam)
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({
      success: false,
      message: "Prompt harus berupa string!",
      data: null,
    });
  }

  //jeroannya
  try {
    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      config: {
        systemInstruction: "Harus dibalas dalam bahasa Indonesia",
      },
    });

    const text = extractText(aiResponse);

    return res.status(200).json({
      success: true,
      message: "Berhasil dijawab oleh Gemini",
      data: text,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      success: false,
      message: e?.message || "Gagal, server lagi bermasalah!",
      data: null,
    });
  }
});

/*=====================================
Fitur Chat : endpoint : POST /api/chat
=========================================*/
app.post("/api/chat", upload.none(), async (req, res) => {
  const { conversation } = req.body || {};

  try {
    //security #1 :cek conversation apakah berupa array atau tidak
    // dengan Array.isArray().
    if (!Array.isArray(conversation)) {
      throw new Error("Conversation harus berupa array");
    }

    //security #2 :cek setiap pesan dalam conversation apakah valid atau tidak
    let messageIsValid = true;

    if (conversation.length === 0) {
      throw new Error("Conversation tidak boleh kosong");
    }

    conversation.forEach((message) => {
      //#kondisi 1--message harus berupa object dan bukan null
      if (!message || typeof message !== "object") {
        messageIsValid = false;
        return;
      }

      const keys = Object.keys(message);
      const objectHasValidKeys = keys.every((key) =>
        ["text", "role"].includes(key)
      );

      //#kondisi 2 -- message harus memliki struktur yang valid
      if (keys.length !== 2 || !objectHasValidKeys) {
        messageIsValid = false;
        return;
      }

      const { text, role } = message;
      //#kondisi 3a-- nilai harus valid
      if (!["model", "user"].includes(role)) {
        messageIsValid = false;
        return;
      }

      //#kondisi 3b-- text harus valid
      if (!text || typeof text !== "string") {
        messageIsValid = false;
        return;
      }
    });

    if (!messageIsValid) {
      throw new Error("Message harus valid");
    }

    //mapping contents
    const contents = conversation.map(({ role, text }) => ({
      role,
      parts: [{ text }],
    }));

    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents,
      config: {
        systemInstruction: "Harus dibalas dalam bahasa Indonesia",
      },
    });

    const text = extractText(aiResponse);

    return res.status(200).json({
      success: true,
      message: "Berhasil dijawab oleh Gemini",
      data: text,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: e?.message || "Gagal, server lagi bermasalah!",
      data: null,
    });
  }
});

/*==========================================
inisialisasi server
============================================*/

// server-nya harus di-serve dulu

app.listen(3000, () => {
  console.log("Server berjalan di port 3000");
});
