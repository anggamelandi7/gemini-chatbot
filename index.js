//import dependencies

import express from "express";
import cors from "cors";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';


//Inisialisasi aplikasi

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

//inisialisasi middleware
app.use(cors()); //inisialisasi CORES (Cross-Origin Resource Sharing) sebagai middleware
app.use(express.json());

//inisialisasi routing
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

// server-nya harus di-serve dulu

app.listen(3000, () => {
  console.log("Server berjalan di port 3000");
});