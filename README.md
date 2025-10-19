# Yang akan dikerjakan

1. Sedia static directory
2. Implementasi endpoint chatbot (POST/api/chat)
    - Mulai buat endpoint baru
    - Buat handler untuk menghandle request POST/api/chat yang dari browser
    -Buat beberapa "security" (guard clouse):
     1. Handle payload `conversation` daro `req.body` apakah conversation-nya berupa Array atau tidak
     2. Hadnle setiap message yang ada pada payload `conversation`, untuk cek apakah setiap message-nya sudah berupa object dengan isinyiya `{ role: 'user' | 'model', messagge: string }`. Tandai sebagai invalid:
        - Jika ada elemen yang tidak sesuai (tipe data-nya lain dari `object` atau nilainya `null`), tandai sebagai invalid
        - Jika setiap elemen tidak memiliki 2 property persis, dan tidak memiliki `role` dan `model` pada object-nya
        -`role` tidak berupa `user` atau `model` atau `message` ridak bertipe data `string` atau berisi string kosong (`""` atau `''`)
    - Lakukan mapping agar bisa dikirim ke Google Gemini API dengan function/method `generateContent()`
    -Massage yang diterima Google Gemini API nanti akan dikirimkan kembali ke user dengan format `{ succes: boolean, message: string, data: string}`
      
