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
const ai = new GoogleGenAI({}); //instantiation object instance (OOP)

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
inisialisasi routing
============================================*/
//contoh app.get() , app.post(), dll -- get/post/put itu bagaian standart dari HTTP

//GET, PUT, POST, PATCHM DELTE, OPTIONS, HEAD
//
//secara penulisannua
//function biasa --> function namaFuction() {}
//[*] arrow function --> [const namaFunction = ] () => {}

//
//secara alurnya
//synchronous -- ()=> {}
//[*] asynchronous --> async () =>{}

app.post("/generate-text", async (req, res) => {
  //terima jeroaanya, lalu cek di disini

  const { prompt } = req.body; //destructuring

  //guard clouse (kasarnya, satpam)

  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({
      succes: false,
      message: "Prompt harus berupa string!",
      data: null,
    });
  }

  //jeroannya
  try {
    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ text: prompt }],
      config: {
        systemInstruction: "Harus dibalas dalam bahasa Indonesia",
      },
    });
    res.status(200).json({
      succes: true,
      message: "Berhasil dijawab oleh Gemini",
      data: aiResponse.text,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      succes: false,
      message: "Gagal , server lagi bermasalah!",
      data: null,
    });
  }
});

/*=====================================
Fitur Chat : endpoint : POST /api/chat
=========================================*/
app.post("/api/chat", async (req, res) => {
  const { conversation } = req.body;

  try {
    //security #1 :cek conversation apakah berupa array atau tidak
    // dengan Array.isArray().
    if (!Array.isArray(conversation)) {
      throw new Error("Conversation harus berupa array");
    }

    //security #2 :cek setiap pesan dalam conversation apakah valid atau tidak
    // dengan Array.isArray().
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

      //#kondisi 2 -- massage harus memliki struktur yang valid
      if (keys.length !== 2 || objectHasValidKeys) {
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

    const contents = conversation.map(({role, text}) =>({
      role,
      parts:[(text)]
    }));

    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config:{
        systemInstruction: "Harus dibalas dalam bahasa Indonesia"
      }
    })

    res.status(200).json({
      succes: true,
      message: "Berhasil dijawab oleh Gemini",
      data: aiResponse.text,
    });

    res.status(500).json({
      succes: false,
      message: e.message,
      data: null,
    });

  } catch (e) {
    console.log(e);
    res.status(400).json({
      success: false,
      message: "Conversation harus berupa array",
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
